export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // MongoDB errors
  if (err.name === 'MongoServerError') {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return res.status(400).json({
        success: false,
        message: `ข้อมูล${field}ซ้ำซ้อน กรุณาตรวจสอบอีกครั้ง`,
        field
      });
    }
  }

  if (err.name === 'CastError') {
    return res.status(404).json({
      success: false,
      message: 'ไม่พบข้อมูลที่ต้องการ'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token ไม่ถูกต้อง'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token หมดอายุ กรุณาเข้าสู่ระบบใหม่'
    });
  }

  // Validation errors
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors: err.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }

  // Multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'ไฟล์มีขนาดใหญ่เกินไป'
    });
  }

  // Default error
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'เกิดข้อผิดพลาดในระบบ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
