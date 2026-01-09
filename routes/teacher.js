import express from 'express';
import { validate, classroomSchema, bulkStudentSchema, lessonSchema, testSchema, gameSchema } from '../middleware/validation.js';
import { teacherOnly, classroomAccess } from '../middleware/auth.js';
import { TeacherController } from '../controllers/teacherController.js';

const router = express.Router();

// Get teacher's classrooms
router.get('/classrooms', teacherOnly, TeacherController.getClassrooms);

// Create new classroom
router.post('/classrooms', teacherOnly, validate(classroomSchema), TeacherController.createClassroom);

// Get classroom details
router.get('/classrooms/:classroomId', teacherOnly, classroomAccess, TeacherController.getClassroom);

// Update classroom
router.put('/classrooms/:classroomId', teacherOnly, classroomAccess, validate(classroomSchema), TeacherController.updateClassroom);

// Delete classroom
router.delete('/classrooms/:classroomId', teacherOnly, classroomAccess, TeacherController.deleteClassroom);

// Search students
router.get('/students/search', teacherOnly, TeacherController.searchStudents);

// Create students (with or without classroom)
router.post('/students', teacherOnly, validate(bulkStudentSchema), TeacherController.createStudents);

// Add students to classroom (bulk)
router.post('/classrooms/:classroomId/students', teacherOnly, classroomAccess, validate(bulkStudentSchema), TeacherController.addStudents);

// Assign existing students to classroom
router.post('/classrooms/:classroomId/students/assign', teacherOnly, classroomAccess, TeacherController.assignStudents);

// Remove student from classroom
router.delete('/classrooms/:classroomId/students/:studentId', teacherOnly, classroomAccess, TeacherController.removeStudent);

// Reset student password
router.post('/classrooms/:classroomId/students/:studentId/reset-password', teacherOnly, classroomAccess, TeacherController.resetStudentPassword);

// Get classroom reports
router.get('/classrooms/:classroomId/reports', teacherOnly, classroomAccess, TeacherController.getClassroomReports);

// Create announcement
router.post('/classrooms/:classroomId/announcements', teacherOnly, classroomAccess, TeacherController.createAnnouncement);

// Get lessons for classroom
router.get('/classrooms/:classroomId/lessons', teacherOnly, classroomAccess, TeacherController.getLessons);

// Create lesson
router.post('/classrooms/:classroomId/lessons', teacherOnly, classroomAccess, validate(lessonSchema), TeacherController.createLesson);

// Reorder lessons (must be before /lessons/:lessonId route)
router.put('/lessons/reorder', teacherOnly, TeacherController.reorderLessons);

// Update lesson
router.put('/lessons/:lessonId', teacherOnly, validate(lessonSchema), TeacherController.updateLesson);

// Delete lesson
router.delete('/lessons/:lessonId', teacherOnly, TeacherController.deleteLesson);

// Delete test
router.delete('/tests/:testId', teacherOnly, TeacherController.deleteTest);

// Delete game
router.delete('/games/:gameId', teacherOnly, TeacherController.deleteGame);

// Generate lessons for all classrooms
router.post('/lessons/generate-all', teacherOnly, TeacherController.generateLessonsForAllClassrooms);

// Generate tests for lesson
router.post('/lessons/:lessonId/tests/generate', teacherOnly, TeacherController.generateTests);

// Generate games for lesson
router.post('/lessons/:lessonId/games/generate', teacherOnly, TeacherController.generateGames);

// Create test for lesson
router.post('/lessons/:lessonId/tests', teacherOnly, validate(testSchema), TeacherController.createTest);

// Add question to test
router.post('/tests/:testId/questions', teacherOnly, validate(testSchema), TeacherController.addQuestion);

// Create game for lesson
router.post('/lessons/:lessonId/games', teacherOnly, validate(gameSchema), TeacherController.createGame);



// Generate default lessons for classroom
router.post('/classrooms/:classroomId/lessons/generate', teacherOnly, classroomAccess, TeacherController.generateLessons);

// Update lesson order
router.put('/lessons/:lessonId/order', teacherOnly, TeacherController.updateLessonOrder);

export default router;
