// Vercel Serverless Function Handler
// This file is the entry point for Vercel deployments

import app from './server.js';
import { connectDB } from './config/database.js';

// Connect to database on cold start (cache connection)
let dbConnected = false;

const connectDatabase = async () => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log('✅ Database connected for Vercel function');
    } catch (error) {
      console.error('❌ Database connection error:', error);
      // Don't throw - allow function to continue (connection might be cached)
    }
  }
};

// Vercel serverless function handler
export default async function handler(req, res) {
  // Connect to database if not already connected
  await connectDatabase();

  // Return the Express app handler
  return app(req, res);
}
