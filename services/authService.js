import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { JWT_CONFIG } from '../config/jwt.js';
import { DatabaseService } from './databaseService.js';
import { createTransporter, EMAIL_CONFIG } from '../config/email.js';

export class AuthService {
  static async hashPassword(password) {
    return await bcrypt.hash(password, 12);
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(userId, role) {
    return jwt.sign(
      { userId, role },
      JWT_CONFIG.SECRET,
      { expiresIn: JWT_CONFIG.EXPIRES_IN, algorithm: JWT_CONFIG.ALGORITHM || 'HS256' }
    );
  }

  static verifyToken(token) {
    return jwt.verify(token, JWT_CONFIG.SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM || 'HS256']
    });
  }

  static async createUser(userData) {
    const { email, password, role, name, school, studentCode } = userData;

    try {
      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Generate email verification token
      const crypto = await import('crypto');
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpiry = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
      
      // Check if user already exists
      const existingUser = await DatabaseService.getUserByEmail(email);
      if (existingUser) {
        throw new Error('อีเมลนี้มีผู้ใช้แล้ว');
      }

      // Create user record with hashed password and verification token
      console.log('📝 Creating user with token:', verificationToken.substring(0, 20) + '...');
      const user = await DatabaseService.createUser({
        email,
        password: hashedPassword,
        role,
        name,
        school,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpiry: verificationExpiry
      });
      console.log('✅ User created with ID:', user._id?.toString() || user.id);
      console.log('🔑 Saved token:', user.emailVerificationToken?.substring(0, 20) + '...');
      
      // Use _id before toObject() conversion
      const userId = user._id || user.id;

      // Create role-specific profile
      if (role === 'TEACHER') {
        await DatabaseService.createTeacher({
          user_id: userId,
          name,
          school
        });
      } else if (role === 'STUDENT') {
        const qrCode = studentCode || `STU${Date.now()}`;
        await DatabaseService.createStudent({
          user_id: userId,
          student_code: qrCode,
          qr_code: qrCode,
          name
        });
      }

      // Get complete user profile
      const completeUser = await DatabaseService.getUserById(userId);

      // Send verification email with token
      await this.sendVerificationEmail(email, name, role, verificationToken);

      return completeUser;
    } catch (error) {
      console.error('Create user error:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status
      });
      
      // Provide better error messages
      if (error.message?.includes('already registered') || error.message?.includes('already exists') || error.message?.includes('มีผู้ใช้แล้ว')) {
        throw new Error('อีเมลนี้มีผู้ใช้แล้ว');
      } else if (error.message?.includes('password')) {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      } else if (error.message?.includes('email')) {
        throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
      }
      
      throw error;
    }
  }

  static async sendVerificationEmail(email, name, role, verificationToken) {
    try {
      // If email is not enabled, just log it
      if (!EMAIL_CONFIG.enabled) {
        console.log(`📧 Email disabled - User registered: ${email} (${role})`);
        console.log(`   Verification link: ${EMAIL_CONFIG.frontendUrl}/verify-email?token=${verificationToken}`);
        return;
      }

      // Create transporter
      const transporter = createTransporter();
      if (!transporter) {
        console.warn(`⚠️ Email transporter not available - skipping verification email to ${email}`);
        console.log(`   Verification link: ${EMAIL_CONFIG.frontendUrl}/verify-email?token=${verificationToken}`);
        return;
      }

      // Define email content
      const roleDisplayName = role === 'TEACHER' ? 'คุณครู' : 'นักเรียน';
      const verifyUrl = `${EMAIL_CONFIG.frontendUrl}/verify-email?token=${verificationToken}`;
      const subject = `ยืนยันอีเมลของคุณ - ${EMAIL_CONFIG.appName}`;
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
            .footer { background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; font-size: 12px; }
            .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📧 ยืนยันอีเมลของคุณ</h1>
            </div>
            <div class="content">
              <h2>สวัสดี ${roleDisplayName} ${name}</h2>
              <p>ขอบคุณที่สมัครสมาชิกกับเรา! กรุณาคลิกปุ่มด้านล่างเพื่อยืนยันอีเมลของคุณ</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verifyUrl}" class="button">ยืนยันอีเมล</a>
              </div>

              <div class="warning">
                <strong>⚠️ สำคัญ:</strong> ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง หากไม่ได้ยืนยันภายในเวลาที่กำหนด คุณจะต้องสมัครสมาชิกใหม่
              </div>

              <p>หากปุ่มไม่ทำงาน คุณสามารถคัดลอกลิงก์นี้ไปวางในเบราว์เซอร์:</p>
              <p style="word-break: break-all; color: #667eea; font-size: 12px;">${verifyUrl}</p>
            </div>
            <div class="footer">
              <p>&copy; 2024 ${EMAIL_CONFIG.appName} | ขอบคุณที่เชื่อถือเรา</p>
              <p style="font-size: 11px; opacity: 0.8;">หากคุณไม่ได้สมัครสมาชิก บัญชีนี้ โปรดละเว้นอีเมลนี้</p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
ยืนยันอีเมลของคุณ - ${EMAIL_CONFIG.appName}

สวัสดี ${roleDisplayName} ${name}

ขอบคุณที่สมัครสมาชิกกับเรา! กรุณาคลิกลิงก์ด้านล่างเพื่อยืนยันอีเมลของคุณ:

${verifyUrl}

⚠️ สำคัญ: ลิงก์นี้จะหมดอายุใน 24 ชั่วโมง

หากคุณไม่ได้สมัครสมาชิก บัญชีนี้ โปรดละเว้นอีเมลนี้

ขอบคุณ
ทีมงาน ${EMAIL_CONFIG.appName}
      `;

      // Send email
      const info = await transporter.sendMail({
        from: `"${EMAIL_CONFIG.appName}" <${EMAIL_CONFIG.from}>`,
        to: email,
        subject: subject,
        text: textContent,
        html: htmlContent
      });

      console.log(`✅ Verification email sent to ${email}:`, info.messageId);
    } catch (error) {
      console.error('❌ Send verification email error:', error);
      // Don't throw error - email failure shouldn't break registration
    }
  }

  static async findUserByEmail(email) {
    return await DatabaseService.getUserByEmail(email);
  }

  static async findStudentByQRCode(qrCode) {
    return await DatabaseService.getStudentByQRCode(qrCode);
  }

  static async getUserProfile(userId) {
    return await DatabaseService.getUserById(userId);
  }

  static async loginWithEmailPassword(email, password) {
    try {
      // Find user by email
      const user = await DatabaseService.getUserByEmail(email);
      
      if (!user) {
        throw new Error('ไม่พบผู้ใช้ในระบบ');
      }

      // Verify password
      if (!user.password) {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      }

      const isPasswordValid = await this.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        throw new Error('รหัสผ่านไม่ถูกต้อง');
      }
      
      // Generate JWT token
      const token = this.generateToken(user.id, user.role);

      // Remove password from user object before returning
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        token
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async validateUserSession(token) {
    try {
      // Verify JWT token
      const decoded = this.verifyToken(token);
      const user = await DatabaseService.getUserById(decoded.userId);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      console.error('Validate session error:', error);
      throw error;
    }
  }

  static async verifyEmailToken(token) {
    try {
      const { DatabaseService } = await import('./databaseService.js');
      
      // Find user by verification token
      const { User } = await import('../models/User.js');
      const user = await User.findOne({
        emailVerificationToken: token
      });

      if (!user) {
        console.log('❌ Token verification failed - user not found for token:', token.substring(0, 20) + '...');
        
        // Check total users and unverified users for debugging
        const totalUsers = await User.countDocuments();
        const unverifiedUsers = await User.countDocuments({ isEmailVerified: false });
        console.log(`📊 Total users: ${totalUsers}, Unverified: ${unverifiedUsers}`);
        
        return {
          success: false,
          message: 'Token ไม่ถูกต้องหรือหมดอายุ'
        };
      }

      // Check if token has expired
      if (user.emailVerificationExpiry && user.emailVerificationExpiry < Date.now()) {
        return {
          success: false,
          message: 'Token หมดอายุแล้ว กรุณาสมัครสมาชิกใหม่'
        };
      }

      // Check if already verified
      if (user.isEmailVerified) {
        return {
          success: false,
          message: 'อีเมลนี้ได้รับการยืนยันแล้ว'
        };
      }

      // Update user to verified
      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpiry = null;
      await user.save();

      // Get complete user profile
      const completeUser = await DatabaseService.getUserById(user._id);

      return {
        success: true,
        user: completeUser
      };
    } catch (error) {
      console.error('Verify email token error:', error);
      throw error;
    }
  }
}
