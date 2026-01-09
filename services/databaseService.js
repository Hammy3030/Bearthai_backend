import { User } from '../models/User.js';
import { Teacher } from '../models/Teacher.js';
import { Student } from '../models/Student.js';
import { Classroom } from '../models/Classroom.js';
import { Lesson } from '../models/Lesson.js';
import { Test } from '../models/Test.js';
import { Question } from '../models/Question.js';
import { Game } from '../models/Game.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { TestAttempt } from '../models/TestAttempt.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { Notification } from '../models/Notification.js';
import { Announcement } from '../models/Announcement.js';
import { WritingAttempt } from '../models/WritingAttempt.js';

// Database Service - MongoDB with Mongoose

export class DatabaseService {
  // ===========================================
  // USER MANAGEMENT
  // ===========================================

  static async createUser(userData) {
    const user = await User.create({
      email: userData.email,
      password: userData.password,
      role: userData.role,
      name: userData.name,
      school: userData.school,
      isEmailVerified: userData.isEmailVerified,
      emailVerificationToken: userData.emailVerificationToken,
      emailVerificationExpiry: userData.emailVerificationExpiry
    });

    // Get user ID before converting to object
    const userId = user._id;

    // Populate with role-specific data
    if (user.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId });
      return { ...user.toObject(), teacher };
    } else if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId }).populate('classroomId');
      return { ...user.toObject(), student };
    }
    return user.toObject();
  }

  static async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) return null;

    const result = user.toObject();

    // Populate with role-specific data
    if (user.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: user._id });
      result.teacher = teacher?.toObject() || null;
    } else if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id }).populate('classroomId');
      if (student) {
        const studentObj = student.toObject();
        // Ensure classroomId is properly extracted
        if (studentObj.classroomId && typeof studentObj.classroomId === 'object' && studentObj.classroomId._id) {
          // Keep the populated object for reference, but also add the ID
          studentObj.classroomIdId = studentObj.classroomId._id.toString();
        }
        result.student = studentObj;
        console.log('getUserById - Student found:', {
          id: studentObj._id,
          hasClassroomId: !!studentObj.classroomId,
          classroomIdType: typeof studentObj.classroomId
        });
      } else {
        console.warn('getUserById - Student not found for userId:', user._id);
        result.student = null;
      }
    }

    return result;
  }

  static async getUserByEmail(email) {
    const user = await User.findOne({ email });
    if (!user) return null;

    const result = user.toObject();

    // Populate with role-specific data
    if (user.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: user._id });
      result.teacher = teacher?.toObject() || null;
    } else if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id }).populate('classroomId');
      result.student = student?.toObject() || null;
    }

    return result;
  }

  static async updateUser(userId, data) {
    const user = await User.findByIdAndUpdate(userId, data, { new: true });
    if (!user) return null;

    const result = user.toObject();

    // Populate with role-specific data
    if (user.role === 'TEACHER') {
      const teacher = await Teacher.findOne({ userId: user._id });
      result.teacher = teacher?.toObject() || null;
    } else if (user.role === 'STUDENT') {
      const student = await Student.findOne({ userId: user._id }).populate('classroomId');
      result.student = student?.toObject() || null;
    }

    return result;
  }

  // ===========================================
  // TEACHER MANAGEMENT
  // ===========================================

  static async createTeacher(teacherData) {
    return await Teacher.create({
      userId: teacherData.user_id,
      school: teacherData.school,
      name: teacherData.name,
    });
  }

  static async getTeacherByUserId(userId) {
    const teacher = await Teacher.findOne({ userId })
      .populate('userId')
      .populate('classrooms');
    return teacher?.toObject() || null;
  }

  // ===========================================
  // STUDENT MANAGEMENT
  // ===========================================

  static async createStudent(studentData) {
    return await Student.create({
      userId: studentData.user_id,
      classroomId: studentData.classroom_id,
      studentCode: studentData.student_code,
      qrCode: studentData.qr_code,
      name: studentData.name,
    });
  }

  static async getStudentByCode(studentCode) {
    const student = await Student.findOne({ studentCode })
      .populate('userId')
      .populate('classroomId');
    return student?.toObject() || null;
  }

  static async getStudentByQRCode(qrCode) {
    const student = await Student.findOne({ qrCode })
      .populate('userId')
      .populate('classroomId');
    return student?.toObject() || null;
  }

  static async getStudentById(studentId) {
    const student = await Student.findById(studentId)
      .populate('userId')
      .populate('classroomId');
    return student?.toObject() || null;
  }

  // ===========================================
  // CLASSROOM MANAGEMENT
  // ===========================================

  static async createClassroom(classroomData) {
    const classroom = await Classroom.create({
      name: classroomData.name,
      description: classroomData.description,
      teacherId: classroomData.teacher_id,
    });

    // Populate with related data
    const teacher = await Teacher.findById(classroomData.teacher_id).populate('userId');
    const students = await Student.find({ classroomId: classroom._id }).populate('userId');

    return {
      ...classroom.toObject(),
      teacher: teacher?.toObject() || null,
      students: students.map(s => s.toObject())
    };
  }

  static async getClassroomById(classroomId) {
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) return null;

    const teacher = await Teacher.findById(classroom.teacherId).populate('userId');
    const students = await Student.find({ classroomId: classroom._id }).populate('userId');
    const lessons = await Lesson.find({ classroomId: classroom._id, isActive: true })
      .sort({ orderIndex: 1 });
    const tests = await Test.find({ classroomId: classroom._id }).sort({ createdAt: -1 });
    const games = await Game.find({ classroomId: classroom._id }).sort({ createdAt: -1 });

    return {
      ...classroom.toObject(),
      teacher: teacher?.toObject() || null,
      students: students.map(s => s.toObject()),
      lessons: lessons.map(l => l.toObject()),
      tests: tests.map(t => t.toObject()),
      games: games.map(g => g.toObject())
    };
  }

  static async getClassroomsByTeacher(teacherId) {
    const classrooms = await Classroom.find({ teacherId })
      .populate('teacherId')
      .populate({ path: 'teacherId', populate: { path: 'userId' } });

    const results = await Promise.all(classrooms.map(async (classroom) => {
      const students = await Student.find({ classroomId: classroom._id });
      const lessons = await Lesson.find({ classroomId: classroom._id, isActive: true });

      return {
        ...classroom.toObject(),
        _count: {
          students: students.length,
          lessons: lessons.length,
          tests: await Test.countDocuments({ classroomId: classroom._id }),
          games: await Game.countDocuments({ classroomId: classroom._id })
        }
      };
    }));

    return results;
  }

  static async updateClassroom(classroomId, data) {
    const classroom = await Classroom.findByIdAndUpdate(classroomId, data, { new: true });
    if (!classroom) return null;

    const teacher = await Teacher.findById(classroom.teacherId);
    const students = await Student.find({ classroomId: classroom._id }).populate('userId');

    return {
      ...classroom.toObject(),
      teacher: teacher?.toObject() || null,
      students: students.map(s => s.toObject())
    };
  }

  static async deleteClassroom(classroomId) {
    // Hard delete: Delete classroom and all related data
    
    // 1. Get all students in this classroom
    const students = await Student.find({ classroomId });
    const studentIds = students.map(s => s._id);
    
    // 2. Get all lessons in this classroom
    const lessons = await Lesson.find({ classroomId });
    const lessonIds = lessons.map(l => l._id);
    
    // 3. Get all tests and games for lessons in this classroom
    const tests = await Test.find({ classroomId });
    const games = await Game.find({ classroomId });
    
    const testIds = tests.map(t => t._id);
    const gameIds = games.map(g => g._id);
    
    // 4. Delete all questions for tests
    if (testIds.length > 0) {
      await Question.deleteMany({ testId: { $in: testIds } });
    }
    
    // 5. Delete all test attempts for tests
    if (testIds.length > 0) {
      await TestAttempt.deleteMany({ testId: { $in: testIds } });
    }
    
    // 6. Delete all game attempts for games
    if (gameIds.length > 0) {
      await GameAttempt.deleteMany({ gameId: { $in: gameIds } });
    }
    
    // 7. Delete all lesson progress for lessons
    if (lessonIds.length > 0) {
      await LessonProgress.deleteMany({ lessonId: { $in: lessonIds } });
    }
    
    // 8. Delete all notifications for students
    if (studentIds.length > 0) {
      await Notification.deleteMany({ studentId: { $in: studentIds } });
    }
    
    // 9. Delete all writing attempts for students
    if (studentIds.length > 0) {
      await WritingAttempt.deleteMany({ studentId: { $in: studentIds } });
    }
    
    // 10. Delete all announcements for this classroom
    await Announcement.deleteMany({ classroomId });
    
    // 11. Delete all tests
    if (testIds.length > 0) {
      await Test.deleteMany({ _id: { $in: testIds } });
    }
    
    // 12. Delete all games
    if (gameIds.length > 0) {
      await Game.deleteMany({ _id: { $in: gameIds } });
    }
    
    // 13. Delete all lessons
    if (lessonIds.length > 0) {
      await Lesson.deleteMany({ _id: { $in: lessonIds } });
    }
    
    // 14. Delete all students (and their users)
    for (const student of students) {
      if (student.userId) {
        await User.findByIdAndDelete(student.userId);
      }
      await Student.findByIdAndDelete(student._id);
    }
    
    // 15. Finally delete the classroom itself
    return await Classroom.findByIdAndDelete(classroomId);
  }

  static async deleteTest(testId) {
    // Hard delete: Delete test and all related data
    
    // 1. Delete all questions for this test
    await Question.deleteMany({ testId });
    
    // 2. Delete all test attempts for this test
    await TestAttempt.deleteMany({ testId });
    
    // 3. Finally delete the test itself
    return await Test.findByIdAndDelete(testId);
  }

  static async deleteGame(gameId) {
    // Hard delete: Delete game and all related data
    
    // 1. Delete all game attempts for this game
    await GameAttempt.deleteMany({ gameId });
    
    // 2. Finally delete the game itself
    return await Game.findByIdAndDelete(gameId);
  }

  // ===========================================
  // LESSON MANAGEMENT
  // ===========================================

  static async createLesson(lessonData) {
    return await Lesson.create({
      title: lessonData.title,
      content: lessonData.content,
      audioUrl: lessonData.audio_url,
      imageUrl: lessonData.image_url,
      orderIndex: lessonData.order_index,
      classroomId: lessonData.classroom_id,
      teacherId: lessonData.teacher_id,
      isActive: lessonData.is_active !== false,
    });
  }

  static async getLessonById(lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) return null;

    const classroom = await Classroom.findById(lesson.classroomId);
    const teacher = await Teacher.findById(lesson.teacherId).populate('userId');

    // Get tests and their questions
    const tests = await Test.find({ lessonId: lesson._id, isActive: true })
      .sort({ createdAt: 1 });

    const testsWithQuestions = await Promise.all(tests.map(async (test) => {
      const questions = await Question.find({ testId: test._id }).sort({ orderIndex: 1 });
      return {
        ...test.toObject(),
        questions: questions.map(q => q.toObject())
      };
    }));

    const games = await Game.find({ lessonId: lesson._id, isActive: true });

    return {
      ...lesson.toObject(),
      classroom: classroom?.toObject() || null,
      teacher: teacher ? { ...teacher.toObject(), user: teacher.userId } : null,
      tests: testsWithQuestions,
      games: games.map(g => g.toObject())
    };
  }

  static async getLessonsByClassroom(classroomId) {
    const lessons = await Lesson.find({ classroomId, isActive: true })
      .sort({ orderIndex: 1 });

    const results = await Promise.all(lessons.map(async (lesson) => {
      const tests = await Test.find({ lessonId: lesson._id, isActive: true });
      const games = await Game.find({ lessonId: lesson._id, isActive: true });

      return {
        ...lesson.toObject(),
        tests: tests.map(t => t.toObject()),
        games: games.map(g => g.toObject())
      };
    }));

    return results;
  }

  static async updateLesson(lessonId, data) {
    const updateData = {};
    if (data.title) updateData.title = data.title;
    if (data.content) updateData.content = data.content;
    if (data.audio_url) updateData.audioUrl = data.audio_url;
    if (data.image_url) updateData.imageUrl = data.image_url;
    if (data.order_index !== undefined) updateData.orderIndex = data.order_index;
    if (data.is_active !== undefined) updateData.isActive = data.is_active;

    return await Lesson.findByIdAndUpdate(lessonId, updateData, { new: true });
  }

  static async deleteLesson(lessonId) {
    // Hard delete: Delete lesson and all related data
    
    // 1. Get all tests and games for this lesson
    const tests = await Test.find({ lessonId });
    const games = await Game.find({ lessonId });
    
    const testIds = tests.map(t => t._id);
    const gameIds = games.map(g => g._id);
    
    // 2. Delete all questions for tests in this lesson
    if (testIds.length > 0) {
      await Question.deleteMany({ testId: { $in: testIds } });
    }
    
    // 3. Delete all test attempts for tests in this lesson
    if (testIds.length > 0) {
      await TestAttempt.deleteMany({ testId: { $in: testIds } });
    }
    
    // 4. Delete all game attempts for games in this lesson
    if (gameIds.length > 0) {
      await GameAttempt.deleteMany({ gameId: { $in: gameIds } });
    }
    
    // 5. Delete all lesson progress for this lesson
    await LessonProgress.deleteMany({ lessonId });
    
    // 6. Delete all tests
    if (testIds.length > 0) {
      await Test.deleteMany({ _id: { $in: testIds } });
    }
    
    // 7. Delete all games
    if (gameIds.length > 0) {
      await Game.deleteMany({ _id: { $in: gameIds } });
    }
    
    // 8. Finally delete the lesson itself
    return await Lesson.findByIdAndDelete(lessonId);
  }

  // ===========================================
  // TEST MANAGEMENT
  // ===========================================

  static async createTest(testData) {
    return await Test.create({
      title: testData.title,
      type: testData.type,
      timeLimit: testData.time_limit,
      lessonId: testData.lesson_id,
      classroomId: testData.classroom_id,
      teacherId: testData.teacher_id,
      passingScore: testData.passing_score || 60,
      isActive: testData.is_active !== false,
    });
  }

  static async getTestById(testId) {
    const test = await Test.findById(testId);
    if (!test) return null;

    const questions = await Question.find({ testId: test._id }).sort({ orderIndex: 1 });
    const lesson = await Lesson.findById(test.lessonId);

    return {
      ...test.toObject(),
      questions: questions.map(q => q.toObject()),
      lesson: lesson?.toObject() || null
    };
  }

  static async createQuestion(questionData) {
    return await Question.create({
      testId: questionData.test_id,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correct_answer,
      explanation: questionData.explanation,
      imageUrl: questionData.image_url,
      audioUrl: questionData.audio_url,
      isMultipleChoice: questionData.is_multiple_choice || false,
      orderIndex: questionData.order_index,
    });
  }

  // ===========================================
  // GAME MANAGEMENT
  // ===========================================

  static async createGame(gameData) {
    return await Game.create({
      title: gameData.title,
      type: gameData.type,
      settings: gameData.settings,
      lessonId: gameData.lesson_id,
      classroomId: gameData.classroom_id,
      teacherId: gameData.teacher_id,
      isActive: gameData.is_active !== false,
    });
  }

  static async getGameById(gameId) {
    const game = await Game.findById(gameId);
    if (!game) return null;

    const lesson = await Lesson.findById(game.lessonId);

    return {
      ...game.toObject(),
      lesson: lesson?.toObject() || null
    };
  }

  // ===========================================
  // PROGRESS & ATTEMPTS
  // ===========================================

  static async createLessonProgress(progressData) {
    const existingProgress = await LessonProgress.findOne({
      studentId: progressData.student_id,
      lessonId: progressData.lesson_id
    });

    if (existingProgress) {
      existingProgress.isCompleted = progressData.is_completed;
      existingProgress.hasPassedPreTest = progressData.has_passed_pre_test;
      existingProgress.hasPassedPostTest = progressData.has_passed_post_test;
      existingProgress.completedAt = progressData.completed_at;
      existingProgress.timeSpent = progressData.time_spent;
      await existingProgress.save();
      return existingProgress.toObject();
    }

    return await LessonProgress.create({
      studentId: progressData.student_id,
      lessonId: progressData.lesson_id,
      isCompleted: progressData.is_completed || false,
      hasPassedPreTest: progressData.has_passed_pre_test || false,
      hasPassedPostTest: progressData.has_passed_post_test || false,
      completedAt: progressData.completed_at,
      timeSpent: progressData.time_spent || 0,
    });
  }

  static async createTestAttempt(attemptData) {
    return await TestAttempt.create({
      studentId: attemptData.student_id,
      testId: attemptData.test_id,
      answers: attemptData.answers,
      score: attemptData.score,
      isPassed: attemptData.is_passed,
      attemptNumber: attemptData.attempt_number || 1,
      timeSpent: attemptData.time_spent,
      completedAt: attemptData.completed_at || new Date(),
    });
  }

  static async createGameAttempt(attemptData) {
    return await GameAttempt.create({
      studentId: attemptData.student_id,
      gameId: attemptData.game_id,
      score: attemptData.score,
      level: attemptData.level || 1,
      isPassed: attemptData.is_passed,
      attemptNumber: attemptData.attempt_number || 1,
      timeSpent: attemptData.time_spent,
      data: attemptData.data,
      completedAt: attemptData.completed_at || new Date(),
    });
  }

  // ===========================================
  // NOTIFICATIONS
  // ===========================================

  static async createNotification(notificationData) {
    return await Notification.create({
      studentId: notificationData.student_id,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type || 'INFO',
      isRead: false,
    });
  }

  static async getNotificationsByStudent(studentId, unreadOnly = false) {
    const mongoose = (await import('mongoose')).default;

    // Convert studentId to ObjectId if it's a string
    let studentObjectId = studentId;
    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    } else if (studentId && typeof studentId === 'object' && studentId._id) {
      studentObjectId = studentId._id;
    }

    const query = { studentId: studentObjectId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(20);
    return notifications.map(n => n.toObject());
  }

  static async markNotificationAsRead(studentId, notificationId) {
    const mongoose = (await import('mongoose')).default;

    // Convert notificationId to ObjectId if it's a string
    let notificationObjectId = notificationId;
    if (typeof notificationId === 'string' && mongoose.Types.ObjectId.isValid(notificationId)) {
      notificationObjectId = new mongoose.Types.ObjectId(notificationId);
    }

    // Convert studentId to ObjectId if it's a string
    let studentObjectId = studentId;
    if (typeof studentId === 'string' && mongoose.Types.ObjectId.isValid(studentId)) {
      studentObjectId = new mongoose.Types.ObjectId(studentId);
    }

    // Find and update the notification
    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationObjectId,
        studentId: studentObjectId
      },
      {
        isRead: true,
        updatedAt: new Date()
      },
      {
        new: true // Return updated document
      }
    );

    if (!notification) {
      throw new Error('ไม่พบการแจ้งเตือน');
    }

    return notification.toObject();
  }

  // ===========================================
  // ANNOUNCEMENTS
  // ===========================================

  static async createAnnouncement(announcementData) {
    return await Announcement.create({
      classroomId: announcementData.classroom_id,
      teacherId: announcementData.teacher_id,
      title: announcementData.title,
      message: announcementData.message,
    });
  }
}
