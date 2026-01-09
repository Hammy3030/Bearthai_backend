import mongoose from 'mongoose';
import { DatabaseService } from './databaseService.js';
import { Lesson } from '../models/Lesson.js';
import { Test } from '../models/Test.js';
import { Game } from '../models/Game.js';
import { Question } from '../models/Question.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { TestAttempt } from '../models/TestAttempt.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { Notification } from '../models/Notification.js';

export class StudentService {
  static async getStudentLessons(studentId, classroomId) {
    // Get lessons with progress, tests, and games
    const lessons = await Lesson.find({
      classroomId,
      isActive: true
    }).sort({ orderIndex: 1 });

    // AUTO-FIX: Update old path `/คำศัพท์บท1-4/` to `/คำศัพท์บท1-8/`
    for (const lesson of lessons) {
      if (lesson.content && lesson.content.includes('/คำศัพท์บท1-4/')) {
        console.log(`Auto-updating lesson ${lesson.orderIndex} path from /คำศัพท์บท1-4/ to /คำศัพท์บท1-8/`);
        const updatedContent = lesson.content.replaceAll('/คำศัพท์บท1-4/', '/คำศัพท์บท1-8/');
        lesson.content = updatedContent;
        try {
          await Lesson.updateOne({ _id: lesson._id || lesson.id }, { content: updatedContent });
        } catch (e) {
          console.error('Failed to update lesson path:', e);
        }
      }
    }

    // Get all progress records for this student in one query
    const allProgress = await LessonProgress.find({ studentId });
    const progressMap = new Map();
    allProgress.forEach(p => {
      progressMap.set(p.lessonId.toString(), p);
    });

    const results = await Promise.all(lessons.map(async (lesson, index) => {
      const progress = progressMap.get(lesson._id.toString());

      const tests = await Test.find({
        lessonId: lesson._id,
        isActive: true
      });

      const testsWithAttempts = await Promise.all(tests.map(async (testItem) => {
        const attempts = await TestAttempt.find({
          testId: testItem._id,
          studentId
        });
        return { ...testItem.toObject(), testAttempts: attempts.map(a => a.toObject()) };
      }));

      const games = await Game.find({
        lessonId: lesson._id,
        isActive: true
      });

      const gamesWithAttempts = await Promise.all(games.map(async (gameItem) => {
        const attempts = await GameAttempt.find({
          gameId: gameItem._id,
          studentId
        });
        return { ...gameItem.toObject(), gameAttempts: attempts.map(a => a.toObject()) };
      }));

      const preTest = testsWithAttempts.find(t => t.type === 'PRE_TEST');
      const postTest = testsWithAttempts.find(t => t.type === 'POST_TEST');

      let status = 'LOCKED';
      let canAccess = false;

      const preTestAttempts = preTest?.testAttempts || [];
      const postTestAttempts = postTest?.testAttempts || [];

      const preTestCompleted = preTestAttempts.length > 0;
      const lessonCompleted = progress?.isCompleted === true;
      const postTestCompleted = postTestAttempts.length > 0;
      const gamesCompleted = gamesWithAttempts.every(gameItem => {
        const gameAttempt = gameItem.gameAttempts?.find(attempt => attempt.studentId?.toString() === studentId.toString());
        return gameAttempt && gameAttempt.isPassed;
      });

      // Check if previous lesson is completed
      let previousLessonCompleted = false;
      let isFirstLessonInChapter = false;

      if (lesson.orderIndex > 1) {
        // Find the previous lesson by orderIndex WITHIN THE SAME CHAPTER
        const previousLesson = lessons.find(l =>
          l.orderIndex === lesson.orderIndex - 1 &&
          l.chapter === lesson.chapter
        );

        if (previousLesson) {
          const previousLessonId = previousLesson._id.toString();
          const prevProgress = progressMap.get(previousLessonId);
          previousLessonCompleted = prevProgress?.isCompleted === true;
        } else {
          // No previous lesson in same chapter = this is the first lesson of this chapter
          isFirstLessonInChapter = true;
        }
      } else {
        // orderIndex === 1 means this is the very first lesson overall
        isFirstLessonInChapter = true;
      }

      // First lesson overall, OR first lesson of any chapter is always unlocked
      const isUnlockedByOrder = lesson.orderIndex === 1 || isFirstLessonInChapter || previousLessonCompleted;

      // If it's the first lesson of chapter or previous is completed, allow access
      if (isUnlockedByOrder) {
        // For the first lesson of any chapter, skip pre-test requirement and allow direct access
        if (lesson.orderIndex === 1 || isFirstLessonInChapter) {
          if (!lessonCompleted) {
            // First lesson of chapter is always unlocked and accessible
            status = 'UNLOCKED';
            canAccess = true;
          } else if (!postTestCompleted && postTest) {
            // Post-test is ready
            status = 'POST_TEST_READY';
            canAccess = false;
          } else if (!gamesCompleted && gamesWithAttempts.length > 0 && postTestCompleted) {
            // Games are ready
            status = 'GAMES_READY';
            canAccess = false;
          } else {
            // All completed
            status = 'COMPLETED';
            canAccess = false;
          }
        } else {
          // For subsequent lessons, check if pre-test is required
          if (preTest && !preTestCompleted) {
            // Pre-test is required but not completed
            status = 'LOCKED';
            canAccess = false;
          } else if (!lessonCompleted) {
            // Pre-test completed (or no pre-test), lesson is unlocked and can be accessed
            status = 'UNLOCKED';
            canAccess = true;
          } else if (!postTestCompleted && postTest) {
            // Post-test is ready
            status = 'POST_TEST_READY';
            canAccess = false;
          } else if (!gamesCompleted && gamesWithAttempts.length > 0 && postTestCompleted) {
            // Games are ready
            status = 'GAMES_READY';
            canAccess = false;
          } else {
            // All completed
            status = 'COMPLETED';
            canAccess = false;
          }
        }
      } else {
        // Locked because previous lesson is not completed
        status = 'LOCKED';
        canAccess = false;
      }

      // Return lesson object with status, progress, tests, and games
      return {
        ...lesson.toObject(),
        status,
        canAccess,
        progress: progress ? progress.toObject() : null,
        tests: testsWithAttempts,
        games: gamesWithAttempts,
        preTest,
        postTest
      };
    }));

    return results;
  }

  static async completeLesson(studentId, lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      throw new Error('ไม่พบบทเรียน');
    }

    const result = await DatabaseService.createLessonProgress({
      student_id: studentId,
      lesson_id: lessonId,
      is_completed: true,
      completed_at: new Date()
    });

    // Get lesson info for notification (lesson already fetched above)
    if (lesson) {
      // Create notification for lesson completion
      await DatabaseService.createNotification({
        student_id: studentId,
        title: `🎯 เรียนจบบทเรียนแล้ว!`,
        message: `คุณเรียนจบ "${lesson.title}" แล้ว! ทำแบบทดสอบเพื่อทดสอบความรู้ของคุณ`,
        type: 'SUCCESS'
      });

      // Check if next lesson exists and unlock it
      const allLessons = await Lesson.find({
        classroomId: lesson.classroomId,
        isActive: true
      }).sort({ orderIndex: 1 });

      const currentIndex = allLessons.findIndex(l => l._id.toString() === lessonId.toString());
      if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
        const nextLesson = allLessons[currentIndex + 1];
        // Create notification for next lesson unlocked
        await DatabaseService.createNotification({
          student_id: studentId,
          title: `🔓 บทเรียนใหม่ปลดล็อกแล้ว!`,
          message: `บทเรียน "${nextLesson.title}" พร้อมสำหรับคุณแล้ว!`,
          type: 'INFO'
        });
      }
    }

    return result;
  }

  static async getPreTestStatus(studentId, lessonId) {
    // Normalize studentId and lessonId to ObjectId
    let studentObjectId = studentId;
    let lessonObjectId = lessonId;

    // Convert studentId to ObjectId
    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    } else if (studentId && typeof studentId === 'object' && studentId._id) {
      studentObjectId = studentId._id;
    } else if (studentId && typeof studentId === 'object' && studentId.toString) {
      // If it's already an ObjectId, keep it
      studentObjectId = studentId;
    }

    // Convert lessonId to ObjectId
    if (typeof lessonId === 'string' && mongoose.Types.ObjectId.isValid(lessonId)) {
      lessonObjectId = new mongoose.Types.ObjectId(lessonId);
    } else if (lessonId && typeof lessonId === 'object' && lessonId._id) {
      lessonObjectId = lessonId._id;
    } else if (lessonId && typeof lessonId === 'object' && lessonId.toString) {
      lessonObjectId = lessonId;
    }

    // Find pre-test for this lesson
    const preTest = await Test.findOne({
      lessonId: lessonObjectId,
      type: 'PRE_TEST',
      isActive: true
    });

    if (!preTest) {
      return {
        hasPreTest: false,
        isPreTestCompleted: true, // No pre-test required
        canAccessLesson: true
      };
    }

    // Get testId as ObjectId
    const testObjectId = preTest._id;

    // Query TestAttempt with multiple strategies to handle different data types
    // Strategy 1: Try with ObjectId
    let testAttempt = await TestAttempt.findOne({
      studentId: studentObjectId,
      testId: testObjectId
    });

    // Strategy 2: Try with string IDs
    if (!testAttempt) {
      testAttempt = await TestAttempt.findOne({
        studentId: mongoose.Types.ObjectId.isValid(studentId)
          ? new mongoose.Types.ObjectId(studentId)
          : studentId,
        testId: testObjectId
      });
    }

    // Strategy 3: Try with string comparison (MongoDB will handle conversion)
    if (!testAttempt) {
      testAttempt = await TestAttempt.findOne({
        $expr: {
          $and: [
            { $eq: [{ $toString: '$studentId' }, studentId.toString()] },
            { $eq: [{ $toString: '$testId' }, testObjectId.toString()] }
          ]
        }
      });
    }

    // Strategy 4: Try finding any attempt for this student and test (most permissive)
    if (!testAttempt) {
      const allAttempts = await TestAttempt.find({
        testId: testObjectId
      });

      console.log('getPreTestStatus - Found all attempts for test:', {
        testId: testObjectId.toString(),
        totalAttempts: allAttempts.length,
        attempts: allAttempts.map(a => ({
          id: a._id.toString(),
          studentId: a.studentId.toString(),
          testId: a.testId.toString(),
          completedAt: a.completedAt
        }))
      });

      // Find matching studentId by comparing string representations
      testAttempt = allAttempts.find(attempt =>
        attempt.studentId.toString() === studentId.toString() ||
        attempt.studentId.toString() === studentObjectId.toString()
      );

      if (testAttempt) {
        console.log('getPreTestStatus - Found matching attempt via Strategy 4');
      }
    }

    console.log('getPreTestStatus - Debug:', {
      studentId: studentId?.toString(),
      studentObjectId: studentObjectId?.toString(),
      studentObjectIdType: studentObjectId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof studentObjectId,
      lessonId: lessonId?.toString(),
      lessonObjectId: lessonObjectId?.toString(),
      preTestId: preTest._id?.toString(),
      testObjectId: testObjectId?.toString(),
      testAttemptFound: !!testAttempt,
      testAttemptId: testAttempt?._id?.toString(),
      testAttemptStudentId: testAttempt?.studentId?.toString(),
      testAttemptStudentIdType: testAttempt?.studentId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof testAttempt?.studentId,
      testAttemptTestId: testAttempt?.testId?.toString(),
      testAttemptTestIdType: testAttempt?.testId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof testAttempt?.testId
    });

    const isPreTestCompleted = testAttempt !== null;

    return {
      hasPreTest: true,
      isPreTestCompleted,
      canAccessLesson: isPreTestCompleted,
      preTestId: preTest._id.toString(),
      preTestTitle: preTest.title
    };
  }

  static async getPostTestStatus(studentId, lessonId) {
    // Check if lesson is completed
    const lessonProgress = await LessonProgress.findOne({
      studentId,
      lessonId
    });

    const isLessonCompleted = lessonProgress?.isCompleted === true;

    // Find post-test for this lesson
    const postTest = await Test.findOne({
      lessonId,
      type: 'POST_TEST',
      isActive: true
    });

    if (!postTest) {
      return {
        hasPostTest: false,
        isPostTestUnlocked: isLessonCompleted,
        isPostTestCompleted: false
      };
    }

    // Check if student has completed post-test
    const testAttempt = await TestAttempt.findOne({
      studentId,
      testId: postTest._id
    });

    const isPostTestCompleted = testAttempt !== null;

    return {
      hasPostTest: true,
      isPostTestUnlocked: isLessonCompleted,
      isPostTestCompleted,
      postTestId: postTest._id.toString(),
      postTestTitle: postTest.title
    };
  }

  static async submitActivity(studentId, lessonId, activityId, activityData) {
    // Store activity result in LessonProgress's activityResults field
    // If LessonProgress doesn't have activityResults field, we can store it separately
    // For now, we'll create/update a simple activity result record

    let lessonProgress = await LessonProgress.findOne({
      studentId,
      lessonId
    });

    if (!lessonProgress) {
      // Create new progress record if it doesn't exist
      lessonProgress = await DatabaseService.createLessonProgress({
        student_id: studentId,
        lesson_id: lessonId,
        is_completed: false,
        completed_at: null
      });
    }

    // Store activity results in a simple format
    // In a production system, you might want to create a separate ActivityResult model
    const activityResult = {
      activityId,
      answer: activityData.answer,
      isCorrect: activityData.isCorrect,
      score: activityData.score || (activityData.isCorrect ? 100 : 0),
      timeSpent: activityData.timeSpent || 0,
      submittedAt: new Date()
    };

    // Update or initialize activityResults array
    if (!lessonProgress.activityResults) {
      lessonProgress.activityResults = [];
    }

    // Remove existing result for this activity if exists, then add new one
    lessonProgress.activityResults = lessonProgress.activityResults.filter(
      (r) => r.activityId !== activityId
    );
    lessonProgress.activityResults.push(activityResult);

    // Update time spent
    if (lessonProgress.timeSpent) {
      lessonProgress.timeSpent += activityData.timeSpent || 0;
    } else {
      lessonProgress.timeSpent = activityData.timeSpent || 0;
    }

    await lessonProgress.save();

    return activityResult;
  }

  static async getStudentTests(studentId, classroomId, filters = {}) {
    const query = {
      classroomId,
      isActive: true
    };

    if (filters.lessonId) {
      query.lessonId = filters.lessonId;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const tests = await Test.find(query).sort({ createdAt: 1 });

    const results = await Promise.all(tests.map(async (testItem) => {
      const questions = await Question.find({ testId: testItem._id }).sort({ orderIndex: 1 });
      const lesson = await Lesson.findById(testItem.lessonId);
      const attempts = await TestAttempt.find({ testId: testItem._id, studentId }).sort({ completedAt: -1 });

      return {
        ...testItem.toObject(),
        questions: questions.map(q => {
          const qObj = q.toObject();
          // AUTO-FIX: Patch image URLs in questions
          if (qObj.imageUrl && (qObj.imageUrl.includes('/คำศัพท์บท1-4/') || qObj.imageUrl.includes('/คำศัพท์บท1-3/'))) {
            qObj.imageUrl = qObj.imageUrl.replace(/\/คำศัพท์บท1-[34]\//, '/คำศัพท์บท1-8/');
          }
          return qObj;
        }),
        lesson: lesson?.toObject() || null,
        testAttempts: attempts.map(a => a.toObject()),
        attempted: attempts.length > 0,
        lastAttempt: attempts[0]?.toObject() || null
      };
    }));

    return results;
  }

  static async submitTest(studentId, testId, answers, timeSpent) {
    // Convert studentId and testId to ObjectId if they're strings
    let studentObjectId = studentId;
    let testObjectId = testId;

    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    } else if (studentId && typeof studentId === 'object' && studentId.toString) {
      studentObjectId = studentId;
    }

    if (typeof testId === 'string' && mongoose.Types.ObjectId.isValid(testId)) {
      testObjectId = new mongoose.Types.ObjectId(testId);
    } else if (testId && typeof testId === 'object' && testId.toString) {
      testObjectId = testId;
    }

    // Get test with questions
    const test = await Test.findById(testObjectId);
    const questions = await Question.find({ testId: testObjectId });

    if (!test) {
      throw new Error('ไม่พบแบบทดสอบ');
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = questions.length;

    questions.forEach(question => {
      const studentAnswer = answers[question._id.toString()];
      if (studentAnswer === question.correctAnswer) {
        correctCount++;
      }
    });

    const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const isPassed = score >= test.passingScore;

    // Get last attempt number - try with ObjectId first, then string
    let lastAttempt = await TestAttempt.findOne({
      studentId: studentObjectId,
      testId: testObjectId
    }).sort({ attemptNumber: -1 });

    if (!lastAttempt) {
      lastAttempt = await TestAttempt.findOne({
        studentId: studentId.toString(),
        testId: testId.toString()
      }).sort({ attemptNumber: -1 });
    }

    const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    console.log('submitTest - Creating test attempt:', {
      studentId: studentId?.toString(),
      studentObjectId: studentObjectId?.toString(),
      testId: testId?.toString(),
      testObjectId: testObjectId?.toString(),
      score,
      isPassed,
      attemptNumber
    });

    // Create test attempt - use ObjectId for consistency
    const testAttempt = await DatabaseService.createTestAttempt({
      student_id: studentObjectId,
      test_id: testObjectId,
      answers,
      score,
      is_passed: isPassed,
      attempt_number: attemptNumber,
      time_spent: timeSpent,
      completed_at: new Date()
    });

    console.log('submitTest - Test attempt created:', {
      testAttemptId: testAttempt?._id?.toString(),
      testAttemptStudentId: testAttempt?.studentId?.toString(),
      testAttemptStudentIdType: testAttempt?.studentId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof testAttempt?.studentId,
      testAttemptTestId: testAttempt?.testId?.toString(),
      testAttemptTestIdType: testAttempt?.testId instanceof mongoose.Types.ObjectId ? 'ObjectId' : typeof testAttempt?.testId,
      score,
      isPassed,
      attemptNumber
    });

    // Verify the test attempt was saved correctly by querying it back
    const verifyAttempt = await TestAttempt.findById(testAttempt._id);
    console.log('submitTest - Verification query:', {
      found: !!verifyAttempt,
      verifyStudentId: verifyAttempt?.studentId?.toString(),
      verifyTestId: verifyAttempt?.testId?.toString()
    });

    // Get test info for notification (test already fetched above)
    if (test && isPassed) {
      // Create notification for passing test
      await DatabaseService.createNotification({
        student_id: studentId,
        title: `🎉 ยินดีด้วย! คุณผ่านแบบทดสอบแล้ว`,
        message: `คุณทำคะแนนได้ ${score}% ในแบบทดสอบ "${test.title}"`,
        type: 'SUCCESS'
      });

      // Calculate stars based on score
      let stars = 0;
      if (score >= 90) stars = 3;
      else if (score >= 80) stars = 2;
      else if (score >= 60) stars = 1;

      if (stars > 0) {
        await DatabaseService.createNotification({
          student_id: studentId,
          title: `⭐ ได้รับ ${stars} ดาว!`,
          message: `คุณได้รับ ${stars} ดาวจากแบบทดสอบ "${test.title}"`,
          type: 'SUCCESS'
        });
      }
    }

    return {
      ...testAttempt,
      score,
      correctAnswers: correctCount,
      totalQuestions
    };
  }

  static async getStudentGames(studentId, classroomId, filters = {}) {
    const query = {
      classroomId,
      isActive: true
    };

    if (filters.lessonId) {
      query.lessonId = filters.lessonId;
    }

    if (filters.type) {
      query.type = filters.type;
    }

    const games = await Game.find(query);

    const results = await Promise.all(games.map(async (gameItem) => {
      const lesson = await Lesson.findById(gameItem.lessonId);
      const attempts = await GameAttempt.find({ gameId: gameItem._id, studentId }).sort({ completedAt: -1 });

      return {
        ...gameItem.toObject(),
        lesson: lesson?.toObject() || null,
        gameAttempts: attempts.map(a => a.toObject()),
        attempted: attempts.length > 0,
        lastAttempt: attempts[0]?.toObject() || null
      };
    }));

    return results;
  }

  static async submitGame(studentId, gameId, gameData) {
    // Get game
    const game = await Game.findById(gameId);

    if (!game) {
      throw new Error('ไม่พบเกม');
    }

    // Get last attempt number
    const lastAttempt = await GameAttempt.findOne({ studentId, gameId })
      .sort({ attemptNumber: -1 });

    const attemptNumber = lastAttempt ? lastAttempt.attemptNumber + 1 : 1;

    // Determine if passed (you can customize this logic)
    const isPassed = gameData.score >= 60; // Default passing score

    // Create game attempt
    const gameAttempt = await DatabaseService.createGameAttempt({
      student_id: studentId,
      game_id: gameId,
      score: gameData.score,
      level: gameData.level || 1,
      is_passed: isPassed,
      attempt_number: attemptNumber,
      time_spent: gameData.timeSpent,
      data: gameData.data,
      completed_at: new Date()
    });

    // Get game info for notification (game already fetched above)
    if (game) {
      // Create notification for 100% score (gold medal)
      if (gameData.score === 100) {
        await DatabaseService.createNotification({
          student_id: studentId,
          title: `🥇 ได้เหรียญทอง!`,
          message: `คุณเล่นเกม "${game.title}" ได้คะแนน 100%!`,
          type: 'SUCCESS'
        });
      } else if (isPassed) {
        // Create notification for completing game
        await DatabaseService.createNotification({
          student_id: studentId,
          title: `🎮 ผ่านเกมแล้ว!`,
          message: `คุณเล่นเกม "${game.title}" ได้คะแนน ${gameData.score}%`,
          type: 'SUCCESS'
        });
      }
    }

    return {
      ...gameAttempt,
      score: gameData.score,
      isPassed: isPassed
    };
  }

  static async getStudentProgress(studentId) {
    const progress = await LessonProgress.find({ studentId });

    const progressWithLesson = await Promise.all(progress.map(async (p) => {
      const lesson = await Lesson.findById(p.lessonId);
      const classroom = lesson ? await (await import('../models/Classroom.js')).Classroom.findById(lesson.classroomId) : null;

      return {
        ...p.toObject(),
        lesson: lesson ? {
          ...lesson.toObject(),
          classroom: classroom?.toObject() || null
        } : null
      };
    }));

    const testAttempts = await TestAttempt.find({ studentId }).sort({ completedAt: -1 });

    const testAttemptsWithTest = await Promise.all(testAttempts.map(async (attempt) => {
      const test = await Test.findById(attempt.testId);
      const lesson = test ? await Lesson.findById(test.lessonId) : null;

      return {
        ...attempt.toObject(),
        test: test ? {
          ...test.toObject(),
          lesson: lesson?.toObject() || null
        } : null
      };
    }));

    const gameAttempts = await GameAttempt.find({ studentId }).sort({ completedAt: -1 });

    const gameAttemptsWithGame = await Promise.all(gameAttempts.map(async (attempt) => {
      const game = await Game.findById(attempt.gameId);
      const lesson = game ? await Lesson.findById(game.lessonId) : null;

      return {
        ...attempt.toObject(),
        game: game ? {
          ...game.toObject(),
          lesson: lesson?.toObject() || null
        } : null
      };
    }));

    return {
      lessons: progressWithLesson,
      tests: testAttemptsWithTest,
      games: gameAttemptsWithGame
    };
  }

  static async getStudentNotifications(studentId, unreadOnly = false) {
    return await DatabaseService.getNotificationsByStudent(studentId, unreadOnly);
  }

  static async markNotificationAsRead(studentId, notificationId) {
    return await DatabaseService.markNotificationAsRead(studentId, notificationId);
  }

  static async detectHandwritingAI(imageData, targetWord) {
    try {
      // Validate imageData exists
      if (!imageData || typeof imageData !== 'string') {
        throw new Error('Invalid image data');
      }

      // Check if imageData is a valid base64 string with content
      if (!imageData.startsWith('data:image/')) {
        throw new Error('Invalid image format');
      }

      // Extract the base64 portion
      const base64Data = imageData.split(',')[1];
      if (!base64Data || base64Data.length < 100) {
        throw new Error('Canvas appears to be empty');
      }

      // Use Google Gemini API only
      const { GeminiService } = await import('./geminiService.js');
      console.log('🤖 Using Google Gemini API for handwriting detection...');

      if (!GeminiService.isConfigured()) {
        throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in .env file');
      }

      const geminiResult = await GeminiService.detectHandwriting(imageData, targetWord);

      // Apply strict validation
      const detectedText = geminiResult.detectedText || '';
      let isCorrect = geminiResult.isCorrect || false;
      let confidence = Math.min(100, Math.max(0, geminiResult.confidence || 0));

      // STRICT VALIDATION: Additional checks to ensure accuracy
      const detectedLower = detectedText.toLowerCase().trim();
      const targetLower = targetWord.toLowerCase().trim();
      const isCharacterMatch = detectedLower === targetLower;
      const isRandomPattern = /(random|scribble|circle|line|doodle|shape)/i.test(detectedText) ||
        detectedText.length > targetWord.length + 3;
      const meetsConfidenceThreshold = confidence >= 80;

      if (isRandomPattern) {
        console.warn(`Rejecting random pattern: "${detectedText}"`);
        isCorrect = false;
        confidence = Math.min(confidence, 30);
      }

      if (isCorrect) {
        if (!isCharacterMatch) {
          console.warn(`⚠️ Character mismatch: detected "${detectedText}" vs target "${targetWord}" - REJECTING`);
          isCorrect = false;
          confidence = Math.min(confidence, 40);
        }

        if (!meetsConfidenceThreshold || confidence < 80) {
          console.warn(`⚠️ Confidence ${confidence}% is below 80% threshold - REJECTING (likely poor tracing)`);
          isCorrect = false;
          confidence = Math.min(confidence, 50);
        }

        const explanationLower = (geminiResult.explanation || '').toLowerCase();
        const tracingIssues = [
          'messy', 'scribble', 'scribbles', 'ไม่ทับ', 'นอกกรอบ', 'เขียนนอก', 'เขียนมั่ว',
          'ไม่ตาม', 'ไม่ตรง', 'ห่าง', 'gap', 'random', 'messed', 'zig', 'zag',
          'หลายเส้น', 'ทับกัน', 'ระบาย', 'coloring', 'thick', 'หนาเกิน'
        ];
        const hasTracingIssue = tracingIssues.some(keyword => explanationLower.includes(keyword));

        if (hasTracingIssue) {
          console.warn(`⚠️ Explanation mentions tracing issues - REJECTING (messy scribbles detected)`);
          isCorrect = false;
          confidence = Math.min(confidence, 30);
        }

        const goodTracingKeywords = ['ทับเส้นประ', 'ตามเส้น', 'ชัดเจน', 'เส้นเดียว', 'ดีมาก', 'ถูกต้อง'];
        const hasGoodTracing = goodTracingKeywords.some(keyword => explanationLower.includes(keyword));

        if (!hasGoodTracing && confidence < 90) {
          console.warn(`⚠️ No good tracing keywords in explanation with confidence ${confidence}% - REJECTING (likely messy)`);
          isCorrect = false;
          confidence = Math.min(confidence, 40);
        }
      }

      if (confidence < 40) {
        isCorrect = false;
      }

      let explanation = geminiResult.explanation || '';
      if (!isCorrect) {
        if (!isCharacterMatch && !isRandomPattern) {
          explanation = `เขียนได้ "${detectedText}" แต่ควรเขียน "${targetWord}" ลองเขียนให้ตรงกับอักษรที่กำหนด`;
        } else if (isRandomPattern || confidence < 50) {
          explanation = 'ลองเขียนตามเส้นประให้ชัดเจนขึ้นนะ';
        } else if (!meetsConfidenceThreshold) {
          explanation = 'ลองเขียนให้ใกล้เส้นประมากขึ้น พยายามอีกนิดนะ';
        } else {
          explanation = explanation || 'กรุณาเขียนตามเส้นประให้ถูกต้อง';
        }
      }

      console.log('Final validation result:', {
        detectedText,
        targetWord,
        isCharacterMatch,
        isRandomPattern: isRandomPattern || false,
        meetsConfidenceThreshold,
        finalIsCorrect: isCorrect,
        finalConfidence: confidence
      });

      return {
        detectedText,
        isCorrect,
        confidence,
        explanation,
        method: 'Gemini'
      };

    } catch (error) {
      console.error('Gemini API detection error:', error);

      // Check for specific errors
      if (error.message?.includes('API key') || error.message?.includes('401')) {
        console.error('Gemini API authentication failed. Please check your GEMINI_API_KEY.');
        throw new Error('Gemini API authentication failed. Please check your API key configuration.');
      } else if (error.message?.includes('quota') || error.message?.includes('429')) {
        console.error('Gemini API quota exceeded.');
        throw new Error('Gemini API quota exceeded. Please try again later.');
      } else if (error.message?.includes('JSON')) {
        console.error('Failed to parse Gemini API response as JSON.');
        throw new Error('Failed to parse AI response. Please try again.');
      }

      // Re-throw error to be handled by controller
      throw error;
    }
  }
}
