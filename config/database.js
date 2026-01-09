import mongoose from 'mongoose';

// MongoDB connection configuration
// Fallback to default MongoDB Atlas connection if .env is not configured
const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI || 'mongodb+srv://bearthai:bearthai123@bearthai.vhek1d9.mongodb.net/bearthai?retryWrites=true&w=majority';

if (!MONGODB_URI) {
  console.error('❌ Error: DATABASE_URL or MONGODB_URI is required!');
  console.error('📝 Please set DATABASE_URL in your .env file');
  console.error('   Format: mongodb+srv://username:password@cluster.mongodb.net/dbname');
  throw new Error('DATABASE_URL environment variable is not set');
}

// Connection options for Mongoose 8+
// Note: bufferCommands is deprecated in Mongoose 8+, buffering is automatically disabled
const connectionOptions = {
  serverSelectionTimeoutMS: 10000, // How long to try selecting a server (10 seconds)
  socketTimeoutMS: 45000, // How long to wait for a response (45 seconds)
};

// Create and cache connection
const globalForMongoose = globalThis;

let cached = globalForMongoose.mongoose;

if (!cached) {
  cached = globalForMongoose.mongoose = { conn: null, promise: null };
}

// Connect to MongoDB
async function connectDB() {
  // If already connected, return existing connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If connection is in progress, wait for it
  if (cached.promise) {
    return await cached.promise;
  }

  // Start new connection
  cached.promise = mongoose.connect(MONGODB_URI, connectionOptions)
    .then((mongooseInstance) => {
      console.log('✅ Connected to MongoDB');
      cached.conn = mongooseInstance;
      return cached.conn;
    })
    .catch((error) => {
      console.error('❌ MongoDB connection error:', error.message);
      cached.promise = null; // Reset promise on error so we can retry
      throw error;
    });

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
}

// Initialize connection
// Initialize connection - REMOVED immediate call
// connectDB();

mongoose.connection.on('connected', () => {
  console.log('📚 MongoDB connected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

export default connectDB;
export { connectDB, mongoose };
