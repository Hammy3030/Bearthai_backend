# Vercel Deployment Guide

## การ Deploy Backend บน Vercel

### 1. ตั้งค่า Environment Variables ใน Vercel

ไปที่ Vercel Dashboard → Project Settings → Environment Variables และเพิ่ม:

```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-secure-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://bearthai.vercel.app
EMAIL_ENABLED=false
NODE_ENV=production
```

### 2. ตั้งค่า Frontend Environment Variables

ใน Frontend project (ThaiFun_Learn) เพิ่มใน Vercel:

```
VITE_API_URL=https://bearthai-backend.vercel.app
```

**สำคัญ:** URL ไม่ต้องมี `/api` ต่อท้าย เพราะ `apiConfig.js` จะจัดการให้อัตโนมัติ

### 3. โครงสร้างไฟล์

```
api/
├── index.js          # Vercel serverless function handler
├── server.js         # Express app (export default app)
├── vercel.json       # Vercel configuration
└── ...
```

### 4. Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "index.js"
    }
  ]
}
```

### 5. การทำงาน

- **Development:** `server.js` จะ start HTTP server
- **Vercel:** `index.js` จะเป็น serverless function handler ที่ใช้ Express app จาก `server.js`

### 6. Troubleshooting

#### Error: Function Invocation Failed
- ตรวจสอบ Environment Variables ใน Vercel
- ตรวจสอบ DATABASE_URL ว่าถูกต้อง
- ดู Vercel Function Logs

#### Error: /api/api duplication
- ตรวจสอบ `VITE_API_URL` ใน Frontend Vercel Settings
- ต้องเป็น: `https://bearthai-backend.vercel.app` (ไม่มี /api)
- `apiConfig.js` จะจัดการเพิ่ม /api อัตโนมัติ

#### Database Connection Timeout
- ตรวจสอบ MongoDB Atlas Network Access (IP Whitelist)
- ใช้ `0.0.0.0/0` สำหรับ Vercel หรือเพิ่ม Vercel IP ranges

### 7. Testing

```bash
# Test health check
curl https://bearthai-backend.vercel.app/health

# Test API endpoint
curl https://bearthai-backend.vercel.app/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
```

