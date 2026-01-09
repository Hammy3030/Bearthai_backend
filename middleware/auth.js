import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/databaseService.js';
import { JWT_CONFIG } from '../config/jwt.js';

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'ไม่พบ Token กรุณาเข้าสู่ระบบ' 
      });
    }

    const decoded = jwt.verify(token, JWT_CONFIG.SECRET);
    
    // Get user with role-specific data
    const user = await DatabaseService.getUserById(decoded.userId);

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'ผู้ใช้ไม่ถูกต้อง' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token ไม่ถูกต้อง' 
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่' 
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในระบบ' 
    });
  }
};

// Teacher only middleware
export const teacherOnly = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาเข้าสู่ระบบ' 
    });
  }

  if (req.user.role !== 'TEACHER') {
    return res.status(403).json({ 
      success: false, 
      message: 'เฉพาะครูเท่านั้นที่สามารถเข้าถึงได้' 
    });
  }

  // Check if teacher data is populated
  if (!req.user.teacher) {
    return res.status(400).json({ 
      success: false, 
      message: 'ไม่พบข้อมูลครู กรุณาติดต่อผู้ดูแลระบบ' 
    });
  }

  next();
};

// Student only middleware
export const studentOnly = (req, res, next) => {
  console.log('studentOnly middleware - req.user.role:', req.user?.role);
  if (!req.user) {
    return res.status(401).json({ 
      success: false, 
      message: 'กรุณาเข้าสู่ระบบ' 
    });
  }
  if (req.user.role !== 'STUDENT') {
    return res.status(403).json({ 
      success: false, 
      message: 'เฉพาะนักเรียนเท่านั้นที่สามารถเข้าถึงได้' 
    });
  }
  next();
};

// Classroom access middleware
export const classroomAccess = async (req, res, next) => {
  try {
    const classroomId = req.params.classroomId || req.body.classroomId;
    
    if (!classroomId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ไม่พบ ID ห้องเรียน' 
      });
    }

    // Check if teacher owns this classroom or student belongs to this classroom
    if (req.user.role === 'TEACHER') {
      const classroom = await DatabaseService.getClassroomById(classroomId);
      // Convert to string for comparison - teacherId can be ObjectId or string
      const classroomTeacherId = classroom?.teacherId?.toString() || classroom?.teacherId;
      const userTeacherId = req.user.teacher?.id?.toString() || req.user.teacher?.id;
      
      if (!classroom || classroomTeacherId !== userTeacherId) {
        return res.status(403).json({ 
          success: false, 
          message: 'คุณไม่มีสิทธิ์เข้าถึงห้องเรียนนี้' 
        });
      }
    } else if (req.user.role === 'STUDENT') {
      if (req.user.student?.classroomId !== classroomId) {
        return res.status(403).json({ 
          success: false, 
          message: 'คุณไม่ได้อยู่ในห้องเรียนนี้' 
        });
      }
    }

    req.classroomId = classroomId;
    next();
  } catch (error) {
    console.error('Classroom access middleware error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'เกิดข้อผิดพลาดในระบบ' 
    });
  }
};
