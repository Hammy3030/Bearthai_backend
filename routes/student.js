import express from 'express';
import { studentOnly, authMiddleware } from '../middleware/auth.js';
import { StudentController } from '../controllers/studentController.js';

const router = express.Router();

// Debug endpoint to check authentication status (before studentOnly middleware)
router.get('/auth-status', authMiddleware, StudentController.checkAuthStatus);

// Get student's lessons
router.get('/lessons', studentOnly, StudentController.getLessons);

// Get lesson pre-test status
router.get('/lessons/:lessonId/pre-test-status', studentOnly, StudentController.getPreTestStatus);

// Get lesson post-test status
router.get('/lessons/:lessonId/post-test-status', studentOnly, StudentController.getPostTestStatus);

// Complete lesson
router.post('/lessons/:lessonId/complete', studentOnly, StudentController.completeLesson);

// Submit activity result
router.post('/lessons/:lessonId/activities/:activityId/submit', studentOnly, StudentController.submitActivity);

// Get student's tests
router.get('/tests', studentOnly, StudentController.getTests);

// Submit test attempt
router.post('/tests/:testId/submit', studentOnly, StudentController.submitTest);

// Get student's games
router.get('/games', studentOnly, StudentController.getGames);

// Submit game attempt
router.post('/games/:gameId/submit', studentOnly, StudentController.submitGame);

// Get student's progress
router.get('/progress', studentOnly, StudentController.getProgress);

// Get student's notifications
router.get('/notifications', studentOnly, StudentController.getNotifications);

// Mark notification as read
router.put('/notifications/:notificationId/read', studentOnly, StudentController.markNotificationAsRead);

// AI handwriting detection (NEW - Save and Detect)
router.post('/writing/save-and-detect', studentOnly, StudentController.saveAndDetectHandwriting);

// AI handwriting detection (Legacy - without saving)
router.post('/writing/detect', studentOnly, StudentController.detectHandwriting);

// Get writing history
router.get('/writing/history', studentOnly, StudentController.getWritingHistory);

export default router;
