import { DatabaseService } from './databaseService.js';
import { AuthService } from './authService.js';
import { Student } from '../models/Student.js';
import { User } from '../models/User.js';
import { LessonProgress } from '../models/LessonProgress.js';
import { TestAttempt } from '../models/TestAttempt.js';
import { GameAttempt } from '../models/GameAttempt.js';
import { Lesson } from '../models/Lesson.js';
import { Test } from '../models/Test.js';
import { Game } from '../models/Game.js';

export class ClassroomService {
  static async createClassroom(teacherId, classroomData) {
    return await DatabaseService.createClassroom({
      name: classroomData.name,
      description: classroomData.description,
      teacher_id: teacherId
    });
  }

  static async getClassroomsByTeacher(teacherId) {
    const classrooms = await DatabaseService.getClassroomsByTeacher(teacherId);

    // Format response to match expected structure
    return classrooms.map(classroom => ({
      ...classroom,
      students: [{ count: classroom._count?.students || 0 }],
      lessons: [{ count: classroom._count?.lessons || 0 }]
    }));
  }

  static async getClassroomById(classroomId) {
    return await DatabaseService.getClassroomById(classroomId);
  }

  static async updateClassroom(classroomId, teacherId, classroomData) {
    // Verify ownership
    const classroom = await DatabaseService.getClassroomById(classroomId);
    if (!classroom) {
      throw new Error('ไม่พบห้องเรียน');
    }
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      throw new Error('คุณไม่มีสิทธิ์แก้ไขห้องเรียนนี้');
    }

    return await DatabaseService.updateClassroom(classroomId, {
      name: classroomData.name,
      description: classroomData.description
    });
  }

  static async deleteClassroom(classroomId, teacherId) {
    // Verify ownership
    const classroom = await DatabaseService.getClassroomById(classroomId);
    if (!classroom) {
      throw new Error('ไม่พบห้องเรียน');
    }
    if (classroom.teacherId.toString() !== teacherId.toString()) {
      throw new Error('คุณไม่มีสิทธิ์ลบห้องเรียนนี้');
    }

    const { Classroom } = await import('../models/Classroom.js');
    await Classroom.findByIdAndDelete(classroomId);
    return { success: true };
  }

  static async addStudentsToClassroom(classroomId, studentsData) {
    const createdStudents = [];

    // Get total student count across all classrooms to generate sequential student codes
    const existingStudentsCount = await Student.countDocuments();

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];

      // Generate sequential student code: STU followed by 3-digit sequential number (e.g., STU001, STU002)
      const studentCodeNumber = String(existingStudentsCount + i + 1).padStart(3, '0');
      const studentCode = `STU${studentCodeNumber}`;
      
      // Use same code for QR code
      const qrCode = studentCode;

      // Create user with default password
      const defaultPassword = 'default123';
      const hashedPassword = await AuthService.hashPassword(defaultPassword);

      // Create user - auto-verify email for students created by teachers
      const user = await DatabaseService.createUser({
        email: `${studentCode}@bearthai.local`,
        password: hashedPassword,
        role: 'STUDENT',
        name: studentData.name,
        school: studentData.school,
        isEmailVerified: true // Auto-verify students created by teachers
      });

      // Create student profile
      const student = await DatabaseService.createStudent({
        user_id: user._id || user.id,
        classroom_id: classroomId,
        student_code: studentCode,
        qr_code: qrCode,
        name: studentData.name
      });

      createdStudents.push({
        ...student,
        qrCode
      });
    }

    return createdStudents;
  }

  static async createStudentsWithoutClassroom(teacherId, studentsData) {
    const createdStudents = [];

    // Get total student count across all classrooms to generate sequential student codes
    const existingStudentsCount = await Student.countDocuments();

    for (let i = 0; i < studentsData.length; i++) {
      const studentData = studentsData[i];

      // Generate sequential student code: STU followed by 3-digit sequential number (e.g., STU001, STU002)
      const studentCodeNumber = String(existingStudentsCount + i + 1).padStart(3, '0');
      const studentCode = `STU${studentCodeNumber}`;
      
      // Use same code for QR code
      const qrCode = studentCode;

      // Create user with default password
      const defaultPassword = 'default123';
      const hashedPassword = await AuthService.hashPassword(defaultPassword);

      // Create user - auto-verify email for students created by teachers
      const user = await DatabaseService.createUser({
        email: `${studentCode}@bearthai.local`,
        password: hashedPassword,
        role: 'STUDENT',
        name: studentData.name,
        school: studentData.school,
        isEmailVerified: true // Auto-verify students created by teachers
      });

      // Create student profile without classroom (classroomId is optional)
      const student = await DatabaseService.createStudent({
        user_id: user._id || user.id,
        classroom_id: null, // No classroom assigned
        student_code: studentCode,
        qr_code: qrCode,
        name: studentData.name
      });

      createdStudents.push({
        ...student,
        qrCode
      });
    }

    return createdStudents;
  }

  static async searchStudents(query) {
    const { Student } = await import('../models/Student.js');

    // Safety check for empty query
    if (!query || query.trim().length === 0) return [];

    const searchRegex = new RegExp(query, 'i');

    // Search by name, student code, or QR code
    const students = await Student.find({
      $or: [
        { name: searchRegex },
        { studentCode: searchRegex },
        { qrCode: searchRegex }
      ]
    }).populate('classroomId', 'name');

    return students.map(s => s.toObject());
  }

  static async assignStudentsToClassroom(classroomId, studentIds) {
    const { Student } = await import('../models/Student.js');
    const { Classroom } = await import('../models/Classroom.js');

    // Verify classroom exists
    const classroom = await Classroom.findById(classroomId);
    if (!classroom) {
      throw new Error('ไม่พบห้องเรียน');
    }

    const results = [];
    const errors = [];

    for (const studentId of studentIds) {
      try {
        const student = await Student.findByIdAndUpdate(
          studentId,
          { classroomId: classroom._id },
          { new: true }
        );

        if (student) {
          results.push(student.toObject());
        } else {
          errors.push(`Student not found: ${studentId}`);
        }
      } catch (error) {
        errors.push(`Error assigning student ${studentId}: ${error.message}`);
      }
    }

    return { results, errors };
  }

  static async removeStudentFromClassroom(classroomId, studentId) {
    // Hard delete: Remove student completely from database and all related data
    const { WritingAttempt } = await import('../models/WritingAttempt.js');
    const { LessonProgress } = await import('../models/LessonProgress.js');
    const { TestAttempt } = await import('../models/TestAttempt.js');
    const { GameAttempt } = await import('../models/GameAttempt.js');
    const { Notification } = await import('../models/Notification.js');
    const { User } = await import('../models/User.js');
    
    const student = await Student.findById(studentId);
    if (!student) {
      throw new Error('ไม่พบนักเรียน');
    }

    // 1. Delete all writing attempts
    await WritingAttempt.deleteMany({ studentId });

    // 2. Delete all lesson progress
    await LessonProgress.deleteMany({ studentId });

    // 3. Delete all test attempts
    await TestAttempt.deleteMany({ studentId });

    // 4. Delete all game attempts
    await GameAttempt.deleteMany({ studentId });

    // 5. Delete all notifications
    await Notification.deleteMany({ studentId });

    // 6. Delete associated user
    if (student.userId) {
      await User.findByIdAndDelete(student.userId);
    }

    // 7. Finally delete student
    await Student.findByIdAndDelete(studentId);

    return { success: true };
  }

  static async resetStudentPassword(classroomId, studentId) {
    // Generate new password
    const newPassword = Math.random().toString(36).substr(2, 8);
    const hashedPassword = await AuthService.hashPassword(newPassword);

    // Get student to find user_id
    const student = await Student.findById(studentId);

    if (!student) {
      throw new Error('ไม่พบนักเรียน');
    }

    // Update password in users table
    await User.findByIdAndUpdate(student.userId, { password: hashedPassword });

    return newPassword;
  }

  static async getClassroomReports(classroomId, type = 'overview') {
    const classroom = await this.getClassroomById(classroomId);

    if (type === 'overview') {
      // Get students with their progress summary
      const students = await Student.find({ classroomId }).populate('userId');

      const studentsWithCounts = await Promise.all(students.map(async (student) => {
        const lessonProgressCount = await LessonProgress.countDocuments({ studentId: student._id });
        const testAttemptsCount = await TestAttempt.countDocuments({ studentId: student._id });
        const gameAttemptsCount = await GameAttempt.countDocuments({ studentId: student._id });

        return {
          id: student._id.toString(),
          name: student.name,
          student_code: student.studentCode,
          lesson_progress: [{ count: lessonProgressCount }],
          test_attempts: [{ count: testAttemptsCount }],
          game_attempts: [{ count: gameAttemptsCount }]
        };
      }));

      return {
        ...classroom,
        students: studentsWithCounts
      };
    } else if (type === 'detailed') {
      // Get detailed progress for each student
      const students = await Student.find({ classroomId }).populate('userId');

      const studentsWithProgress = await Promise.all(students.map(async (student) => {
        const lessonProgress = await LessonProgress.find({ studentId: student._id }).populate('lessonId');
        const testAttempts = await TestAttempt.find({ studentId: student._id }).populate('testId');
        const gameAttempts = await GameAttempt.find({ studentId: student._id }).populate('gameId');

        return {
          ...student.toObject(),
          lessonProgress: lessonProgress.map(lp => lp.toObject()),
          testAttempts: testAttempts.map(ta => ta.toObject()),
          gameAttempts: gameAttempts.map(ga => ga.toObject())
        };
      }));

      return {
        ...classroom,
        students: studentsWithProgress
      };
    }

    throw new Error('ประเภทรายงานไม่ถูกต้อง');
  }
}
