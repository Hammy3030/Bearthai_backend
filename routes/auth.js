import express from 'express';
import { validate, loginSchema, registerSchema } from '../middleware/validation.js';
import { AuthController } from '../controllers/authController.js';

const router = express.Router();

// Register
router.post('/register', validate(registerSchema), AuthController.register);

// Login
router.post('/login', validate(loginSchema), AuthController.login);

// Verify email
router.get('/verify-email', AuthController.verifyEmail);

// Get current user profile
router.get('/profile', AuthController.getProfile);

export default router;
