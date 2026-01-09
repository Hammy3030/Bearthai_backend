import express from 'express';
import { teacherOnly } from '../middleware/auth.js';
import { AdminController } from '../controllers/adminController.js';

const router = express.Router();

// Dangerous: clear all data (dev/maintenance only)
router.post('/clear-all', teacherOnly, AdminController.clearAllData);

export default router;

