import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.resolve(__dirname, '.env') });

const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;

console.log('🧪 Testing MongoDB Connection...');
console.log('URL:', MONGODB_URI ? MONGODB_URI.replace(/:([^:@]+)@/, ':****@') : '❌ Not Set');

if (!MONGODB_URI) {
    console.error('❌ DATABASE_URL is missing in .env');
    process.exit(1);
}

async function testConnection() {
    try {
        console.log('⏳ Connecting...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connection Successful!');
        console.log('Host:', mongoose.connection.host);
        console.log('Port:', mongoose.connection.port);
        console.log('Name:', mongoose.connection.name);
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        if (error.cause) {
            console.error('Cause:', error.cause);
        }
        console.error('Full Error:', error);
    }
}

testConnection();
