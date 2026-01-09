# 🚀 Setup Guide

## ⚠️ CRITICAL: Create `.env` file first!

You **MUST** create a `.env` file before running the server.

## Quick Setup

### Step 1: Create `.env` File

Open PowerShell in the `api/` folder and run:

```powershell
Copy-Item env.example .env
```

Or manually create `.env` file with this content:

```env
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@bearthai.vhek1d9.mongodb.net/bearthai?retryWrites=true&w=majority"
JWT_SECRET="bearthai-secret-key-2024"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Step 2: Replace MongoDB Credentials

⚠️ **IMPORTANT:** Replace `USERNAME` and `PASSWORD` with your actual MongoDB Atlas credentials!

Example:
```env
DATABASE_URL="mongodb+srv://admin:mypassword123@bearthai.vhek1d9.mongodb.net/bearthai?retryWrites=true&w=majority"
```

### Step 3: Run Server

```bash
npm install
npm run dev
```

## Expected Output

When successful, you'll see:

```
✅ Connected to MongoDB
📚 MongoDB connected
🚀 BearThai API Server is running on port 3000
```

## Troubleshooting

### Error: "DATABASE_URL environment variable is not set"
→ You didn't create `.env` file or it's in the wrong location

### Error: "buffering timed out"
→ Wrong MongoDB username/password or no internet connection

### Error: "Authentication failed"
→ Wrong credentials in DATABASE_URL

## Need Help?

1. Make sure `.env` file exists in the `api/` folder
2. Check that DATABASE_URL is correct (no spaces, proper format)
3. Verify your MongoDB Atlas credentials
4. Check your internet connection

---

**Ready?** Start the server with `npm run dev`! 🎉

