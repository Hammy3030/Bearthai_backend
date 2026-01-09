import { StudentService } from '../services/studentService.js';
import { WritingAttempt } from '../models/WritingAttempt.js';
import { APP_CONFIG } from '../config/app.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class StudentController {
  // Debug endpoint to check student authentication status
  static async checkAuthStatus(req, res) {
    try {
      const student = req.user.student;

      let classroomIdValue = null;
      if (student?.classroomId) {
        if (typeof student.classroomId === 'object' && student.classroomId._id) {
          classroomIdValue = student.classroomId._id.toString();
        } else {
          classroomIdValue = student.classroomId.toString();
        }
      }

      let message = 'Student record not found';
      if (student) {
        message = student.classroomId
          ? 'Student has classroom'
          : 'Student exists but no classroom assigned';
      }

      return res.json({
        success: true,
        data: {
          user: {
            id: req.user.id,
            role: req.user.role,
            email: req.user.email
          },
          student: student ? {
            id: student._id || student.id,
            classroomId: student.classroomId,
            classroomIdType: typeof student.classroomId,
            hasClassroomId: !!student.classroomId,
            classroomIdValue
          } : null,
          message
        }
      });
    } catch (error) {
      console.error('Check auth status error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะ'
      });
    }
  }

  static async getLessons(req, res) {
    try {
      const student = req.user.student;

      // Debug logging
      console.log('=== getLessons Request ===');
      console.log('req.user.id:', req.user?.id);
      console.log('req.user.role:', req.user?.role);
      console.log('req.user.student exists:', !!req.user?.student);
      if (req.user?.student) {
        console.log('student._id:', req.user.student._id);
        console.log('student.id:', req.user.student.id);
        console.log('student.classroomId:', req.user.student.classroomId);
        console.log('student.classroomId type:', typeof req.user.student.classroomId);
        if (req.user.student.classroomId && typeof req.user.student.classroomId === 'object') {
          console.log('student.classroomId._id:', req.user.student.classroomId._id);
          console.log('student.classroomId.toString():', req.user.student.classroomId.toString());
        }
      }
      console.log('========================');

      // Check if student exists
      if (!student) {
        console.error('getLessons - Student not found for user:', req.user.id);
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลนักเรียน'
        });
      }

      // Get classroomId - handle both ObjectId and string formats
      // classroomId might be populated (object with _id) or direct ObjectId
      let classroomId = student.classroomId;
      if (classroomId) {
        // If it's a populated object, get the _id
        if (typeof classroomId === 'object' && classroomId._id) {
          classroomId = classroomId._id;
        }
        // Convert to string if it's an ObjectId
        if (typeof classroomId === 'object' && classroomId.toString) {
          classroomId = classroomId.toString();
        }
        // If it's already a string, keep it as is
      }

      if (!classroomId) {
        console.error('getLessons - No classroomId for student:', student.id || student._id);
        return res.status(400).json({
          success: false,
          message: 'นักเรียนยังไม่ได้อยู่ในห้องเรียนใด'
        });
      }

      // Get studentId - handle both _id and id
      let studentId = student._id || student.id;
      if (studentId && typeof studentId === 'object' && studentId.toString) {
        studentId = studentId.toString();
      }

      if (!studentId) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบ ID นักเรียน'
        });
      }

      console.log('getLessons - Using studentId:', studentId, 'classroomId:', classroomId);

      const lessons = await StudentService.getStudentLessons(studentId, classroomId);

      res.json({
        success: true,
        data: { lessons }
      });
    } catch (error) {
      console.error('Get lessons error:', error);
      console.error('Error details:', error.message, error.stack);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลบทเรียน'
      });
    }
  }

  static async getPreTestStatus(req, res) {
    try {
      const { lessonId } = req.params;
      const student = req.user.student;

      // Get studentId - handle both _id and id
      let studentId = student._id || student.id;
      if (studentId && typeof studentId === 'object' && studentId.toString) {
        studentId = studentId.toString();
      }

      console.log('getPreTestStatus controller - studentId:', studentId, 'lessonId:', lessonId);

      const status = await StudentService.getPreTestStatus(studentId, lessonId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get pre-test status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะแบบทดสอบก่อนเรียน'
      });
    }
  }

  static async getPostTestStatus(req, res) {
    try {
      const { lessonId } = req.params;
      const student = req.user.student;

      const status = await StudentService.getPostTestStatus(student.id, lessonId);

      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get post-test status error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบสถานะแบบทดสอบหลังเรียน'
      });
    }
  }

  static async completeLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const student = req.user.student;

      const lessonProgress = await StudentService.completeLesson(student.id, lessonId);

      res.json({
        success: true,
        message: 'เรียนจบบทเรียนแล้ว',
        data: { lessonProgress }
      });
    } catch (error) {
      console.error('Complete lesson error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกความคืบหน้า'
      });
    }
  }

  static async submitActivity(req, res) {
    try {
      const { lessonId, activityId } = req.params;
      const student = req.user.student;
      const { answer, isCorrect, score, timeSpent } = req.body;

      const activityResult = await StudentService.submitActivity(student.id, lessonId, activityId, {
        answer,
        isCorrect,
        score,
        timeSpent
      });

      res.json({
        success: true,
        message: 'บันทึกผลกิจกรรมสำเร็จ',
        data: { activityResult }
      });
    } catch (error) {
      console.error('Submit activity error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกผลกิจกรรม'
      });
    }
  }

  static async getTests(req, res) {
    try {
      const student = req.user.student;
      const { lessonId, type } = req.query;

      const tests = await StudentService.getStudentTests(student.id, student.classroomId, {
        lessonId,
        type
      });

      res.json({
        success: true,
        data: { tests }
      });
    } catch (error) {
      console.error('Get tests error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลแบบทดสอบ'
      });
    }
  }

  static async submitTest(req, res) {
    try {
      const { testId } = req.params;
      const { answers, timeSpent } = req.body;
      const student = req.user.student;

      // Get studentId - handle both _id and id
      let studentId = student._id || student.id;
      if (studentId && typeof studentId === 'object' && studentId.toString) {
        studentId = studentId.toString();
      }

      console.log('submitTest controller - studentId:', studentId, 'testId:', testId);

      const result = await StudentService.submitTest(studentId, testId, answers, timeSpent);

      // Note: Score calculation is now handled in StudentService.submitTest
      // Result already contains score, correctAnswers, totalQuestions

      res.json({
        success: true,
        message: 'ส่งคำตอบสำเร็จ',
        data: {
          testAttempt: result,
          score: result.score,
          correctAnswers: result.correctAnswers,
          totalQuestions: result.totalQuestions
        }
      });
    } catch (error) {
      console.error('Submit test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการส่งคำตอบ'
      });
    }
  }

  static async getGames(req, res) {
    try {
      const student = req.user.student;
      const { lessonId, type } = req.query;

      const games = await StudentService.getStudentGames(student.id, student.classroomId, {
        lessonId,
        type
      });

      res.json({
        success: true,
        data: { games }
      });
    } catch (error) {
      console.error('Get games error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลเกม'
      });
    }
  }

  static async submitGame(req, res) {
    try {
      const { gameId } = req.params;
      const { score, level, timeSpent, data } = req.body;
      const student = req.user.student;

      const gameAttempt = await StudentService.submitGame(student.id, gameId, {
        score,
        level: level || 1,
        timeSpent,
        data
      });

      res.json({
        success: true,
        message: 'บันทึกผลเกมสำเร็จ',
        data: { gameAttempt }
      });
    } catch (error) {
      console.error('Submit game error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกผลเกม'
      });
    }
  }

  static async getProgress(req, res) {
    try {
      const student = req.user.student;

      const progress = await StudentService.getStudentProgress(student.id);

      res.json({
        success: true,
        data: progress
      });
    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลความคืบหน้า'
      });
    }
  }

  static async getNotifications(req, res) {
    try {
      const student = req.user.student;
      const { unreadOnly = false } = req.query;

      const notifications = await StudentService.getStudentNotifications(student.id, unreadOnly === 'true');

      res.json({
        success: true,
        data: { notifications }
      });
    } catch (error) {
      console.error('Get notifications error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน'
      });
    }
  }

  static async markNotificationAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const student = req.user.student;

      await StudentService.markNotificationAsRead(student.id, notificationId);

      res.json({
        success: true,
        message: 'อัปเดตสถานะการแจ้งเตือนแล้ว'
      });
    } catch (error) {
      console.error('Mark notification read error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตสถานะ'
      });
    }
  }

  /**
   * Save image and detect handwriting (NEW - Recommended)
   */
  static async saveAndDetectHandwriting(req, res) {
    try {
      const { imageData, targetWord } = req.body;
      const student = req.user.student;

      console.log('=== Save and Detect Handwriting Request ===');
      console.log('Has imageData:', !!imageData);
      console.log('ImageData length:', imageData?.length);
      console.log('Target word:', targetWord);
      console.log('Student ID:', student?._id || student?.id);

      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาส่งรูปภาพ'
        });
      }

      if (!targetWord) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุคำที่ต้องการตรวจสอบ'
        });
      }

      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลนักเรียน'
        });
      }

      // Validate imageData format
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'รูปแบบรูปภาพไม่ถูกต้อง'
        });
      }

      // Check for empty canvas (very small base64 data)
      const base64Data = imageData.split(',')[1];
      if (!base64Data || base64Data.length < 100) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเขียนอักษรบนกระดานก่อนตรวจสอบ'
        });
      }

      // Get student ID
      const studentId = student._id || student.id;

      // Check if we're on Vercel (read-only filesystem)
      const isVercel = process.env.VERCEL || process.env.NODE_ENV === 'production';
      
      let filePath = null;
      let imageUrl = null;

      // 1. Save image to disk (only if not on Vercel)
      if (!isVercel) {
        try {
          const uploadDir = path.join(__dirname, '..', APP_CONFIG.UPLOAD_PATH || 'public/uploads');
          const writingDir = path.join(uploadDir, 'writing');
          
          // Create directories if they don't exist
          await fs.mkdir(writingDir, { recursive: true });

          // Generate unique filename
          const timestamp = Date.now();
          const randomStr = Math.random().toString(36).substring(2, 8);
          const filename = `writing_${studentId}_${targetWord}_${timestamp}_${randomStr}.png`;
          filePath = path.join(writingDir, filename);

          // Convert base64 to buffer and save
          const imageBuffer = Buffer.from(base64Data, 'base64');
          await fs.writeFile(filePath, imageBuffer);

          // Generate URL (relative path for serving)
          imageUrl = `/uploads/writing/${filename}`;

          console.log('✅ Image saved to disk:', filePath);
          console.log('📷 Image URL:', imageUrl);
        } catch (fileError) {
          console.warn('⚠️ Failed to save image to disk:', fileError.message);
          // Continue without saving to disk - will store base64 in DB instead
        }
      } else {
        console.log('☁️ Running on Vercel - skipping file save (read-only filesystem)');
      }

      // 2. Detect handwriting using AI
      console.log('🤖 Calling AI detection service...');
      const result = await StudentService.detectHandwritingAI(imageData, targetWord);

      console.log('✅ Detection result:', result);

      // 3. Save attempt to database
      const writingAttempt = new WritingAttempt({
        studentId,
        targetWord,
        imagePath: filePath || null, // Only set if file was saved
        imageUrl: imageUrl || null, // Only set if file was saved
        imageData: isVercel ? imageData : null, // Store base64 only on Vercel to save DB space
        detectedText: result.detectedText || '',
        isCorrect: result.isCorrect || false,
        confidence: result.confidence || 0,
        explanation: result.explanation || '',
        method: result.method || 'Gemini'
      });

      await writingAttempt.save();
      console.log('💾 Writing attempt saved to database');

      // 4. Return response
      res.json({
        success: true,
        data: {
          detectedText: result.detectedText,
          isCorrect: result.isCorrect,
          targetWord,
          confidence: result.confidence || 0,
          explanation: result.explanation || '',
          imageUrl: imageUrl || null, // May be null on Vercel
          imageData: isVercel ? imageData : null, // Include base64 if on Vercel
          attemptId: writingAttempt._id,
          method: result.method || 'Gemini'
        }
      });
    } catch (error) {
      console.error('=== Save and Detect Handwriting ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการบันทึกและตรวจสอบลายมือ',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Detect handwriting (Legacy - without saving)
   */
  static async detectHandwriting(req, res) {
    try {
      const { imageData, targetWord } = req.body;

      console.log('=== Detect Handwriting Request ===');
      console.log('Has imageData:', !!imageData);
      console.log('ImageData length:', imageData?.length);
      console.log('Target word:', targetWord);

      if (!imageData) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาส่งรูปภาพ'
        });
      }

      if (!targetWord) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาระบุคำที่ต้องการตรวจสอบ'
        });
      }

      // Validate imageData format
      if (!imageData.startsWith('data:image/')) {
        return res.status(400).json({
          success: false,
          message: 'รูปแบบรูปภาพไม่ถูกต้อง'
        });
      }

      // Check for empty canvas (very small base64 data)
      const base64Data = imageData.split(',')[1];
      if (!base64Data || base64Data.length < 100) {
        return res.status(400).json({
          success: false,
          message: 'กรุณาเขียนอักษรบนกระดานก่อนตรวจสอบ'
        });
      }

      console.log('Calling Claude API service...');

      // Call AI detection service (Claude API)
      const result = await StudentService.detectHandwritingAI(imageData, targetWord);

      console.log('Claude API returned:', result);

      // If detection returns empty string, it means validation failed
      if (!result.detectedText) {
        return res.status(400).json({
          success: false,
          message: result.explanation || 'ไม่สามารถตรวจจับตัวอักษรได้ กรุณาเขียนให้ชัดเจนขึ้น'
        });
      }

      console.log('Detection result:', result);

      res.json({
        success: true,
        data: {
          detectedText: result.detectedText,
          isCorrect: result.isCorrect,
          targetWord,
          confidence: result.confidence || 0,
          explanation: result.explanation || ''
        }
      });
    } catch (error) {
      console.error('=== Detect Handwriting ERROR ===');
      console.error('Error:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);

      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการตรวจสอบลายมือ',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Get writing attempts history
   */
  static async getWritingHistory(req, res) {
    try {
      const student = req.user.student;
      const { limit = 50, offset = 0 } = req.query;

      if (!student) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลนักเรียน'
        });
      }

      const studentId = student._id || student.id;

      const attempts = await WritingAttempt.find({ studentId })
        .sort({ createdAt: -1 })
        .limit(Number.parseInt(limit))
        .skip(Number.parseInt(offset))
        .lean();

      // Include imageData for attempts that don't have imageUrl (Vercel storage)
      const attemptsWithImages = attempts.map(attempt => ({
        ...attempt,
        // If no imageUrl but has imageData, include it for frontend to display
        imageData: attempt.imageData || null
      }));

      const total = await WritingAttempt.countDocuments({ studentId });

      res.json({
        success: true,
        data: {
          attempts: attemptsWithImages,
          total,
          limit: Number.parseInt(limit),
          offset: Number.parseInt(offset)
        }
      });
    } catch (error) {
      console.error('Get writing history error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการดึงประวัติการเขียน'
      });
    }
  }

  /**
   * Compare YOLO vs Claude detection
   */
}
