import mongoose from 'mongoose';
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

export class AdminController {
  static async clearAllData(req, res) {
    try {
      // Only teachers can clear data (enforced by teacherOnly middleware)
      
      console.log('🗑️ Starting full database cleanup...');
      
      // Delete all data in the correct order (to avoid foreign key issues)
      // Start with dependent data first
      const deletedCounts = {
        writingAttempts: 0,
        gameAttempts: 0,
        testAttempts: 0,
        lessonProgress: 0,
        notifications: 0,
        questions: 0,
        games: 0,
        tests: 0,
        lessons: 0,
        students: 0,
        classrooms: 0,
        teachers: 0,
        users: 0,
        announcements: 0
      };

      // Delete dependent data first
      const writingAttemptsResult = await WritingAttempt.deleteMany({});
      deletedCounts.writingAttempts = writingAttemptsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.writingAttempts} writing attempts`);

      const gameAttemptsResult = await GameAttempt.deleteMany({});
      deletedCounts.gameAttempts = gameAttemptsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.gameAttempts} game attempts`);

      const testAttemptsResult = await TestAttempt.deleteMany({});
      deletedCounts.testAttempts = testAttemptsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.testAttempts} test attempts`);

      const lessonProgressResult = await LessonProgress.deleteMany({});
      deletedCounts.lessonProgress = lessonProgressResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.lessonProgress} lesson progress records`);

      const notificationsResult = await Notification.deleteMany({});
      deletedCounts.notifications = notificationsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.notifications} notifications`);

      // Delete questions, games, tests
      const questionsResult = await Question.deleteMany({});
      deletedCounts.questions = questionsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.questions} questions`);

      const gamesResult = await Game.deleteMany({});
      deletedCounts.games = gamesResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.games} games`);

      const testsResult = await Test.deleteMany({});
      deletedCounts.tests = testsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.tests} tests`);

      // Delete lessons
      const lessonsResult = await Lesson.deleteMany({});
      deletedCounts.lessons = lessonsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.lessons} lessons`);

      // Delete students
      const studentsResult = await Student.deleteMany({});
      deletedCounts.students = studentsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.students} students`);

      // Delete classrooms
      const classroomsResult = await Classroom.deleteMany({});
      deletedCounts.classrooms = classroomsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.classrooms} classrooms`);

      // Delete teachers
      const teachersResult = await Teacher.deleteMany({});
      deletedCounts.teachers = teachersResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.teachers} teachers`);

      // Delete announcements
      const announcementsResult = await Announcement.deleteMany({});
      deletedCounts.announcements = announcementsResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.announcements} announcements`);

      // Finally delete users (after all related data is deleted)
      const usersResult = await User.deleteMany({});
      deletedCounts.users = usersResult.deletedCount;
      console.log(`✅ Deleted ${deletedCounts.users} users`);

      const totalDeleted = Object.values(deletedCounts).reduce((sum, count) => sum + count, 0);
      console.log(`✅ Total records deleted: ${totalDeleted}`);

      return res.json({
        success: true,
        message: 'ลบข้อมูลทั้งหมดสำเร็จ',
        data: {
          deletedCounts,
          totalDeleted
        }
      });
    } catch (error) {
      console.error('Clear all data error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'เกิดข้อผิดพลาดในการลบข้อมูลทั้งหมด'
      });
    }
  }
}

