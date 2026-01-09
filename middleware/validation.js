import Joi from 'joi';

// Auth validation schemas
export const loginSchema = Joi.object({
  email: Joi.string().required().messages({
    'any.required': 'กรุณากรอกอีเมลหรือรหัสนักเรียน'
  }).custom((value, helpers) => {
    // Allow email format OR studentCode format (e.g., STU001)
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    const isStudentCode = /^STU\d{3}$/i.test(value);
    
    if (!isEmail && !isStudentCode) {
      return helpers.error('string.emailOrStudentCode');
    }
    
    return value;
  }).messages({
    'string.emailOrStudentCode': 'กรุณากรอกอีเมลหรือรหัสนักเรียนให้ถูกต้อง (เช่น STU001)'
  }),
  password: Joi.string().optional().allow('').messages({
    // Password is optional for student login with studentCode
  })
}).custom((obj, helpers) => {
  // If it's an email format, password is required
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email);
  if (isEmail && !obj.password) {
    return helpers.error('any.required', { message: 'กรุณากรอกรหัสผ่าน' });
  }
  return obj;
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'รูปแบบอีเมลไม่ถูกต้อง',
    'any.required': 'กรุณากรอกอีเมล'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร',
    'any.required': 'กรุณากรอกรหัสผ่าน'
  }),
  role: Joi.string().valid('TEACHER', 'STUDENT').required().messages({
    'any.only': 'บทบาทต้องเป็น TEACHER หรือ STUDENT เท่านั้น',
    'any.required': 'กรุณาระบุบทบาท'
  }),
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร',
    'string.max': 'ชื่อต้องไม่เกิน 100 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อ'
  }),
  school: Joi.string().max(200).when('role', {
    is: 'TEACHER',
    then: Joi.optional(),
    otherwise: Joi.forbidden()
  }),
  studentCode: Joi.string().when('role', {
    is: 'STUDENT',
    then: Joi.required(),
    otherwise: Joi.forbidden()
  })
});


// Classroom validation schemas
export const classroomSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'ชื่อห้องเรียนต้องมีอย่างน้อย 2 ตัวอักษร',
    'string.max': 'ชื่อห้องเรียนต้องไม่เกิน 100 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อห้องเรียน'
  }),
  description: Joi.string().max(500).optional().allow('', null).messages({
    'string.max': 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'
  })
});

// Student validation schemas
export const bulkStudentSchema = Joi.object({
  students: Joi.array().items(
    Joi.object({
      name: Joi.string().min(2).max(100).required().messages({
        'string.min': 'ชื่อนักเรียนต้องมีอย่างน้อย 2 ตัวอักษร',
        'string.max': 'ชื่อนักเรียนต้องไม่เกิน 100 ตัวอักษร',
        'any.required': 'กรุณากรอกชื่อนักเรียน'
      }),
      grade: Joi.string().default('1')
    })
  ).min(1).required().messages({
    'array.min': 'ต้องมีนักเรียนอย่างน้อย 1 คน',
    'any.required': 'กรุณาเพิ่มข้อมูลนักเรียน'
  }),
  classroomId: Joi.string().optional().allow(null, '').messages({
    'string.base': 'รหัสห้องเรียนต้องเป็นข้อความ'
  })
});

// Lesson validation schemas
export const lessonSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'ชื่อบทเรียนต้องมีอย่างน้อย 2 ตัวอักษร',
    'string.max': 'ชื่อบทเรียนต้องไม่เกิน 200 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อบทเรียน'
  }),
  content: Joi.string().min(10).required().messages({
    'string.min': 'เนื้อหาบทเรียนต้องมีอย่างน้อย 10 ตัวอักษร',
    'any.required': 'กรุณากรอกเนื้อหาบทเรียน'
  }),
  audioUrl: Joi.string().uri().optional().messages({
    'string.uri': 'URL เสียงไม่ถูกต้อง'
  }),
  imageUrl: Joi.string().uri().optional().messages({
    'string.uri': 'URL รูปภาพไม่ถูกต้อง'
  }),
  order: Joi.number().integer().min(1).required().messages({
    'number.base': 'ลำดับต้องเป็นตัวเลข',
    'number.integer': 'ลำดับต้องเป็นจำนวนเต็ม',
    'number.min': 'ลำดับต้องมากกว่า 0',
    'any.required': 'กรุณาระบุลำดับบทเรียน'
  })
});

// Test validation schemas
export const testSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'ชื่อแบบทดสอบต้องมีอย่างน้อย 2 ตัวอักษร',
    'string.max': 'ชื่อแบบทดสอบต้องไม่เกิน 200 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อแบบทดสอบ'
  }),
  type: Joi.string().valid('PRE_TEST', 'POST_TEST', 'PRACTICE').required().messages({
    'any.only': 'ประเภทแบบทดสอบต้องเป็น PRE_TEST, POST_TEST หรือ PRACTICE เท่านั้น',
    'any.required': 'กรุณาระบุประเภทแบบทดสอบ'
  }),
  timeLimit: Joi.number().integer().min(1).max(120).optional().messages({
    'number.base': 'เวลาจำกัดต้องเป็นตัวเลข',
    'number.integer': 'เวลาจำกัดต้องเป็นจำนวนเต็ม',
    'number.min': 'เวลาจำกัดต้องมากกว่า 0 นาที',
    'number.max': 'เวลาจำกัดต้องไม่เกิน 120 นาที'
  })
});

export const questionSchema = Joi.object({
  question: Joi.string().min(5).required().messages({
    'string.min': 'คำถามต้องมีอย่างน้อย 5 ตัวอักษร',
    'any.required': 'กรุณากรอกคำถาม'
  }),
  options: Joi.array().items(Joi.string().min(1)).min(2).max(6).required().messages({
    'array.min': 'ตัวเลือกต้องมีอย่างน้อย 2 ตัวเลือก',
    'array.max': 'ตัวเลือกต้องไม่เกิน 6 ตัวเลือก',
    'any.required': 'กรุณาเพิ่มตัวเลือก'
  }),
  correctAnswer: Joi.number().integer().min(0).required().messages({
    'number.base': 'คำตอบที่ถูกต้องต้องเป็นตัวเลข',
    'number.integer': 'คำตอบที่ถูกต้องต้องเป็นจำนวนเต็ม',
    'number.min': 'คำตอบที่ถูกต้องต้องเป็น 0 หรือมากกว่า',
    'any.required': 'กรุณาระบุคำตอบที่ถูกต้อง'
  }),
  explanation: Joi.string().max(500).optional().messages({
    'string.max': 'คำอธิบายต้องไม่เกิน 500 ตัวอักษร'
  })
});

// Game validation schemas
export const gameSchema = Joi.object({
  title: Joi.string().min(2).max(200).required().messages({
    'string.min': 'ชื่อเกมต้องมีอย่างน้อย 2 ตัวอักษร',
    'string.max': 'ชื่อเกมต้องไม่เกิน 200 ตัวอักษร',
    'any.required': 'กรุณากรอกชื่อเกม'
  }),
  type: Joi.string().valid('MATCHING', 'DRAG_DROP', 'WORD_CONNECT', 'MEMORY', 'QUIZ').required().messages({
    'any.only': 'ประเภทเกมต้องเป็น MATCHING, DRAG_DROP, WORD_CONNECT, MEMORY หรือ QUIZ เท่านั้น',
    'any.required': 'กรุณาระบุประเภทเกม'
  }),
  settings: Joi.object().optional()
});

// Validation middleware
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'ข้อมูลไม่ถูกต้อง',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req.body = value;
    next();
  };
};
