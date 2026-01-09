export class ResponseHelper {
  static success(res, message, data = null, statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      ...(data && { data })
    });
  }

  static error(res, message, statusCode = 500, error = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(error && process.env.NODE_ENV === 'development' && { error: error.message })
    });
  }

  static validationError(res, errors) {
    return res.status(400).json({
      success: false,
      message: 'ข้อมูลไม่ถูกต้อง',
      errors
    });
  }

  static unauthorized(res, message = 'ไม่ได้รับอนุญาต') {
    return res.status(401).json({
      success: false,
      message
    });
  }

  static forbidden(res, message = 'ไม่มีสิทธิ์เข้าถึง') {
    return res.status(403).json({
      success: false,
      message
    });
  }

  static notFound(res, message = 'ไม่พบข้อมูลที่ต้องการ') {
    return res.status(404).json({
      success: false,
      message
    });
  }

  static conflict(res, message = 'ข้อมูลซ้ำซ้อน') {
    return res.status(409).json({
      success: false,
      message
    });
  }

  static tooManyRequests(res, message = 'คำขอมากเกินไป') {
    return res.status(429).json({
      success: false,
      message
    });
  }

  static internalError(res, message = 'เกิดข้อผิดพลาดในระบบ') {
    return res.status(500).json({
      success: false,
      message
    });
  }
}
