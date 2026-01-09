import { ClassroomService } from '../services/classroomService.js';
import { LessonService } from '../services/lessonService.js';
import QRCode from 'qrcode';
import { DatabaseService } from '../services/databaseService.js';

export class TeacherController {
  static async getClassrooms(req, res) {
    try {
      // Check if teacher data exists
      if (!req.user.teacher || !req.user.teacher.id) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลครู กรุณาติดต่อผู้ดูแลระบบ'
        });
      }

      const classrooms = await ClassroomService.getClassroomsByTeacher(req.user.teacher.id);

      res.json({
        success: true,
        data: { classrooms }
      });
    } catch (error) {
      console.error('Get classrooms error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องเรียน'
      });
    }
  }

  static async createClassroom(req, res) {
    try {
      // Check if teacher data exists
      if (!req.user.teacher || !req.user.teacher.id) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบข้อมูลครู กรุณาติดต่อผู้ดูแลระบบ'
        });
      }

      const { name, description } = req.body;

      const classroom = await ClassroomService.createClassroom(req.user.teacher.id, {
        name,
        description: description || ''
      });

      res.status(201).json({
        success: true,
        message: 'สร้างห้องเรียนสำเร็จ',
        data: { classroom }
      });
    } catch (error) {
      console.error('Create classroom error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างห้องเรียน'
      });
    }
  }

  static async getClassroom(req, res) {
    try {
      const classroom = await ClassroomService.getClassroomById(req.classroomId);

      if (!classroom) {
        return res.status(404).json({
          success: false,
          message: 'ไม่พบห้องเรียน'
        });
      }

      res.json({
        success: true,
        data: { classroom }
      });
    } catch (error) {
      console.error('Get classroom error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลห้องเรียน'
      });
    }
  }

  static async updateClassroom(req, res) {
    try {
      const { classroomId } = req.params;
      const { name, description } = req.body;

      const classroom = await ClassroomService.updateClassroom(
        classroomId,
        req.user.teacher.id,
        { name, description: description || '' }
      );

      res.json({
        success: true,
        message: 'อัปเดตห้องเรียนสำเร็จ',
        data: { classroom }
      });
    } catch (error) {
      console.error('Update classroom error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตห้องเรียน'
      });
    }
  }

  static async deleteClassroom(req, res) {
    try {
      const { classroomId } = req.params;

      await ClassroomService.deleteClassroom(classroomId, req.user.teacher.id);

      res.json({
        success: true,
        message: 'ลบห้องเรียนสำเร็จ'
      });
    } catch (error) {
      console.error('Delete classroom error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบห้องเรียน'
      });
    }
  }

  static async addStudents(req, res) {
    try {
      const { students } = req.body;

      const createdStudents = await ClassroomService.addStudentsToClassroom(req.classroomId, students);

      // Generate QR codes for all students
      const studentsWithQR = await Promise.all(
        createdStudents.map(async (student) => {
          const qrCodeImage = await QRCode.toDataURL(student.qrCode, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          return {
            ...student,
            qrCodeImage
          };
        })
      );

      res.status(201).json({
        success: true,
        message: `เพิ่มนักเรียน ${createdStudents.length} คนสำเร็จ`,
        data: { students: studentsWithQR }
      });
    } catch (error) {
      console.error('Add students error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเพิ่มนักเรียน'
      });
    }
  }

  static async createStudents(req, res) {
    try {
      const { students, classroomId } = req.body;
      const teacherId = req.user.teacher.id;

      let createdStudents;

      if (classroomId) {
        // Create students and add to classroom
        createdStudents = await ClassroomService.addStudentsToClassroom(classroomId, students);
      } else {
        // Create students without classroom
        createdStudents = await ClassroomService.createStudentsWithoutClassroom(teacherId, students);
      }

      // Generate QR codes for all students
      const studentsWithQR = await Promise.all(
        createdStudents.map(async (student) => {
          const qrCodeImage = await QRCode.toDataURL(student.qrCode, {
            width: 200,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            }
          });

          return {
            ...student,
            qrCodeImage
          };
        })
      );

      res.status(201).json({
        success: true,
        message: `สร้างบัญชีนักเรียน ${createdStudents.length} คนสำเร็จ`,
        data: { students: studentsWithQR }
      });
    } catch (error) {
      console.error('Create students error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างบัญชีนักเรียน'
      });
    }
  }

  static async searchStudents(req, res) {
    try {
      const { query } = req.query;
      const students = await ClassroomService.searchStudents(query);
      res.json({
        success: true,
        data: { students }
      });
    } catch (error) {
      console.error('Search students error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการค้นหานักเรียน'
      });
    }
  }

  static async assignStudents(req, res) {
    try {
      const { studentIds } = req.body;
      if (!studentIds || !Array.isArray(studentIds)) {
        return res.status(400).json({
          success: false,
          message: 'ข้อมูลนักเรียนไม่ถูกต้อง'
        });
      }

      const result = await ClassroomService.assignStudentsToClassroom(req.classroomId, studentIds);

      res.json({
        success: true,
        message: `เพิ่มนักเรียน ${result.results.length} คนเข้าห้องเรียนสำเร็จ`,
        data: result
      });
    } catch (error) {
      console.error('Assign students error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการเพิ่มนักเรียนเข้าห้องเรียน'
      });
    }
  }

  static async removeStudent(req, res) {
    try {
      const { studentId } = req.params;

      await ClassroomService.removeStudentFromClassroom(req.classroomId, studentId);

      res.json({
        success: true,
        message: 'ลบนักเรียนสำเร็จ'
      });
    } catch (error) {
      console.error('Remove student error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบนักเรียน'
      });
    }
  }

  static async resetStudentPassword(req, res) {
    try {
      const { studentId } = req.params;

      const newPassword = await ClassroomService.resetStudentPassword(req.classroomId, studentId);

      res.json({
        success: true,
        message: 'รีเซ็ตรหัสผ่านสำเร็จ',
        data: { newPassword }
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน'
      });
    }
  }

  static async getClassroomReports(req, res) {
    try {
      const { type = 'overview' } = req.query;

      const report = await ClassroomService.getClassroomReports(req.classroomId, type);

      res.json({
        success: true,
        data: { report }
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการดึงรายงาน'
      });
    }
  }

  static async createAnnouncement(req, res) {
    try {
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'กรุณากรอกหัวข้อและเนื้อหา'
        });
      }

      // Create announcement
      const announcement = await DatabaseService.createAnnouncement({
        classroom_id: req.classroomId,
        teacher_id: req.user.teacher.id,
        title,
        message: content
      });

      // Get all students in classroom
      const { Student } = await import('../models/Student.js');
      const students = await Student.find({ classroomId: req.classroomId });

      // Create notifications for all students
      if (students && students.length > 0) {
        const notifications = students.map(student => ({
          studentId: student._id,
          title: 'ประกาศใหม่',
          message: title,
          type: 'INFO'
        }));

        // Create notifications using DatabaseService
        for (const notification of notifications) {
          await DatabaseService.createNotification({
            student_id: notification.studentId,
            title: notification.title,
            message: notification.message,
            type: notification.type
          });
        }
      }

      res.status(201).json({
        success: true,
        message: 'ส่งประกาศสำเร็จ',
        data: { announcement }
      });
    } catch (error) {
      console.error('Create announcement error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการส่งประกาศ'
      });
    }
  }

  static async getLessons(req, res) {
    try {
      const lessons = await LessonService.getLessonsByClassroom(req.classroomId, req.user.teacher.id);

      res.json({
        success: true,
        data: { lessons }
      });
    } catch (error) {
      console.error('Get lessons error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบทเรียน'
      });
    }
  }

  static async createLesson(req, res) {
    try {
      const lessonData = {
        ...req.body,
        classroomId: req.classroomId,
        teacherId: req.user.teacher.id
      };

      const lesson = await LessonService.createLesson(lessonData);

      res.status(201).json({
        success: true,
        message: 'สร้างบทเรียนสำเร็จ',
        data: { lesson }
      });
    } catch (error) {
      console.error('Create lesson error:', error);
      res.status(500).json({
        success: false,
        message: 'เกิดข้อผิดพลาดในการสร้างบทเรียน'
      });
    }
  }

  static async reorderLessons(req, res) {
    try {
      const { lessonOrders } = req.body; // Array of { lessonId, orderIndex }

      if (!Array.isArray(lessonOrders)) {
        return res.status(400).json({
          success: false,
          message: 'lessonOrders ต้องเป็น array'
        });
      }

      const { Lesson } = await import('../models/Lesson.js');
      const teacherId = req.user.teacher.id;

      // Update all lessons in parallel
      const updatePromises = lessonOrders.map(({ lessonId, orderIndex }) => {
        return Lesson.findOneAndUpdate(
          { _id: lessonId, teacherId },
          { orderIndex },
          { new: true }
        );
      });

      await Promise.all(updatePromises);

      res.json({
        success: true,
        message: 'อัปเดตลำดับบทเรียนสำเร็จ'
      });
    } catch (error) {
      console.error('Reorder lessons error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตลำดับบทเรียน'
      });
    }
  }

  static async updateLesson(req, res) {
    try {
      const { lessonId } = req.params;
      const lesson = await LessonService.updateLesson(lessonId, req.user.teacher.id, req.body);

      res.json({
        success: true,
        message: 'อัปเดตบทเรียนสำเร็จ',
        data: { lesson }
      });
    } catch (error) {
      console.error('Update lesson error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตบทเรียน'
      });
    }
  }

  static async deleteLesson(req, res) {
    try {
      const { lessonId } = req.params;
      await LessonService.deleteLesson(lessonId, req.user.teacher.id);

      res.json({
        success: true,
        message: 'ลบบทเรียนสำเร็จ'
      });
    } catch (error) {
      console.error('Delete lesson error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบบทเรียน'
      });
    }
  }

  static async generateTests(req, res) {
    try {
      const { lessonId } = req.params;
      const teacherId = req.user.teacher.id;

      const tests = await LessonService.generateDefaultTests(lessonId, teacherId);

      res.json({
        success: true,
        message: `สร้างแบบทดสอบอัตโนมัติสำเร็จ (${tests.length} แบบทดสอบ)`,
        data: { tests }
      });
    } catch (error) {
      console.error('Generate tests error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบอัตโนมัติ'
      });
    }
  }

  static async generateGames(req, res) {
    try {
      const { lessonId } = req.params;
      const teacherId = req.user.teacher.id;

      const games = await LessonService.generateDefaultGames(lessonId, teacherId);

      res.json({
        success: true,
        message: `สร้างเกมอัตโนมัติสำเร็จ (${games.length} เกม)`,
        data: { games }
      });
    } catch (error) {
      console.error('Generate games error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างเกมอัตโนมัติ'
      });
    }
  }

  static async deleteTest(req, res) {
    try {
      const { testId } = req.params;
      await LessonService.deleteTest(testId, req.user.teacher.id);

      res.json({
        success: true,
        message: 'ลบแบบทดสอบสำเร็จ'
      });
    } catch (error) {
      console.error('Delete test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบแบบทดสอบ'
      });
    }
  }

  static async deleteGame(req, res) {
    try {
      const { gameId } = req.params;
      await LessonService.deleteGame(gameId, req.user.teacher.id);

      res.json({
        success: true,
        message: 'ลบเกมสำเร็จ'
      });
    } catch (error) {
      console.error('Delete game error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบเกม'
      });
    }
  }

  static async generateLessonsForAllClassrooms(req, res) {
    try {
      // Use _id (ObjectId) instead of id (string) for database queries
      const teacherId = req.user.teacher._id || req.user.teacher.id;
      const { Classroom } = await import('../models/Classroom.js');
      const { Lesson } = await import('../models/Lesson.js');
      const mongoose = await import('mongoose');

      // Get all classrooms for this teacher
      // Convert teacherId to ObjectId if it's a string
      let teacherObjectId = teacherId;
      if (typeof teacherId === 'string' && mongoose.Types.ObjectId.isValid(teacherId)) {
        teacherObjectId = new mongoose.Types.ObjectId(teacherId);
      }

      const classrooms = await Classroom.find({ teacherId: teacherObjectId });

      console.log(`Found ${classrooms.length} classrooms for teacher: ${teacherObjectId}`);

      if (classrooms.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'คุณยังไม่มีห้องเรียน'
        });
      }

      let totalCreated = 0;
      let totalSkipped = 0;

      // Generate lessons for each classroom
      for (const classroom of classrooms) {
        try {
          // Check if lessons already exist (same check as generateDefaultLessons)
          const existingLessons = await Lesson.find({
            classroomId: classroom._id,
            teacherId: teacherObjectId
          });

          console.log(`Checking classroom: ${classroom.name} (${classroom._id}), existing lessons: ${existingLessons.length}, teacherId: ${teacherObjectId}`);

          if (existingLessons.length === 0) {
            // No lessons exist, create default lessons
            console.log(`Creating lessons for classroom: ${classroom.name}...`);
            const createdLessons = await LessonService.generateDefaultLessons(classroom._id, teacherObjectId);
            console.log(`✅ Created ${createdLessons?.length || 0} lessons for classroom: ${classroom.name}`);
            totalCreated++;
          } else {
            // Lessons already exist, skip
            console.log(`⏭️  Skipped classroom: ${classroom.name} (already has ${existingLessons.length} lessons)`);
            totalSkipped++;
          }
        } catch (error) {
          console.error(`❌ Error processing classroom ${classroom.name}:`, error);
          console.error('Error details:', error.message, error.stack);
          // Continue with next classroom
        }
      }

      res.json({
        success: true,
        message: `สร้างบทเรียนอัตโนมัติให้ทุกห้องเรียนสำเร็จ (สร้างใหม่: ${totalCreated} ห้อง, ข้าม: ${totalSkipped} ห้อง)`,
        data: {
          totalClassrooms: classrooms.length,
          created: totalCreated,
          skipped: totalSkipped
        }
      });
    } catch (error) {
      console.error('Generate lessons for all classrooms error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างบทเรียนอัตโนมัติ'
      });
    }
  }

  static async createTest(req, res) {
    try {
      const { lessonId } = req.params;
      const test = await LessonService.createTest(lessonId, req.user.teacher.id, req.body);

      res.status(201).json({
        success: true,
        message: 'สร้างแบบทดสอบสำเร็จ',
        data: { test }
      });
    } catch (error) {
      console.error('Create test error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างแบบทดสอบ'
      });
    }
  }

  static async addQuestion(req, res) {
    try {
      const { testId } = req.params;
      const question = await LessonService.createQuestion(testId, req.user.teacher.id, req.body);

      res.status(201).json({
        success: true,
        message: 'เพิ่มคำถามสำเร็จ',
        data: { question }
      });
    } catch (error) {
      console.error('Add question error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการเพิ่มคำถาม'
      });
    }
  }

  static async createGame(req, res) {
    try {
      const { lessonId } = req.params;
      const game = await LessonService.createGame(lessonId, req.user.teacher.id, req.body);

      res.status(201).json({
        success: true,
        message: 'สร้างเกมสำเร็จ',
        data: { game }
      });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างเกม'
      });
    }
  }

  static async generateDefaultLessons(req, res) {
    try {
      const lessons = await LessonService.generateDefaultLessons(req.classroomId, req.user.teacher.id);

      res.status(201).json({
        success: true,
        message: `สร้างบทเรียนอัตโนมัติ ${lessons.length} บทสำเร็จ`,
        data: { lessons }
      });
    } catch (error) {
      console.error('Generate default lessons error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างบทเรียนอัตโนมัติ'
      });
    }
  }

  static async updateLessonOrder(req, res) {
    try {
      const { lessonId } = req.params;
      const { order } = req.body;

      const lesson = await LessonService.updateLessonOrder(lessonId, order, req.user.teacher.id);

      res.json({
        success: true,
        message: 'อัปเดตลำดับบทเรียนสำเร็จ',
        data: { lesson }
      });
    } catch (error) {
      console.error('Update lesson order error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการอัปเดตลำดับบทเรียน'
      });
    }
  }

  static async generateLessonsForAllClassrooms(req, res) {
    try {
      const teacherId = req.user.teacher.id;
      const { Classroom } = await import('../models/Classroom.js');
      const { LessonService } = await import('../services/lessonService.js');

      // Get all classrooms for this teacher
      const classrooms = await Classroom.find({ teacherId });

      if (classrooms.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'ไม่พบห้องเรียนใดๆ'
        });
      }

      const results = [];

      // Generate lessons for each classroom
      for (const classroom of classrooms) {
        try {
          const lessons = await LessonService.generateDefaultLessons(classroom._id.toString(), teacherId);
          results.push({
            classroomId: classroom._id.toString(),
            classroomName: classroom.name,
            lessonsCreated: lessons.length,
            success: true
          });
        } catch (error) {
          console.error(`Error generating lessons for classroom ${classroom._id}:`, error);
          results.push({
            classroomId: classroom._id.toString(),
            classroomName: classroom.name,
            lessonsCreated: 0,
            success: false,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        message: `สร้างบทเรียนให้ห้องเรียนทั้งหมด ${classrooms.length} ห้องแล้ว`,
        data: { results }
      });
    } catch (error) {
      console.error('Generate lessons for all classrooms error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างบทเรียน'
      });
    }
  }



  static async generateLessons(req, res) {
    try {
      const { classroomId } = req.params;
      const teacherId = req.user.teacher.id;

      const lessons = await LessonService.generateDefaultLessons(classroomId, teacherId);

      res.json({
        success: true,
        message: 'สร้างบทเรียนอัตโนมัติสำเร็จ',
        data: { lessons }
      });
    } catch (error) {
      console.error('Generate lessons error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการสร้างบทเรียน'
      });
    }
  }
}
