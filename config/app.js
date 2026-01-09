export const APP_CONFIG = {
  PORT: Number.parseInt(process.env.PORT) || 3000,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
  UPLOAD_PATH: process.env.UPLOAD_PATH || './public/uploads',
  MAX_FILE_SIZE: Number.parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  QR_CODE_SIZE: Number.parseInt(process.env.QR_CODE_SIZE) || 200
};
