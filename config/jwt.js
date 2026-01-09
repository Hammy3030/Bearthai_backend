export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'bearthai-jwt-secret-key-2024-change-in-production',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  ALGORITHM: 'HS256'
};

// Warn if using default secret in production
if (JWT_CONFIG.SECRET === 'bearthai-jwt-secret-key-2024-change-in-production' && process.env.NODE_ENV === 'production') {
  console.warn('⚠️  WARNING: Using default JWT_SECRET in production is insecure!');
  console.warn('   Please set a secure JWT_SECRET in your .env file');
}
