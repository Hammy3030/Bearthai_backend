# BearThai API - Backend Server

Backend API สำหรับระบบ Web CAI ภาษาไทย ป.1 สร้างด้วย Node.js + Express + MongoDB

## 📋 สารบัญ

- [คุณสมบัติ](#คุณสมบัติ)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [การใช้งาน](#การใช้งาน)
- [API Endpoints](#api-endpoints)
- [Database Schema](#database-schema)
- [Authentication](#authentication)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## ✨ คุณสมบัติ

- 🔐 JWT Authentication
- 👥 User Management (Teacher, Student)
- 🏫 Classroom Management
- 📚 Lesson Management
- 📝 Test & Question Management
- 🎮 Game Management
- 📊 Progress Tracking
- 🔔 Notification System
- 📈 Reports & Analytics
- 🔄 Auto Content Generation
- 🎯 Unlock Rules System

## 🛠️ ความต้องการของระบบ

- **Node.js** >= 16.x
- **npm** >= 8.x หรือ **yarn** >= 1.x
- **MongoDB** (MongoDB Atlas หรือ Local MongoDB)

## 📦 การติดตั้ง

### 1. Clone Repository

```bash
git clone <repository-url>
cd api
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

หรือ

```bash
yarn install
```

## ⚙️ การตั้งค่า

### 1. สร้างไฟล์ `.env`

```bash
# Windows PowerShell
Copy-Item env.example .env

# Mac/Linux
cp env.example .env
```

### 2. แก้ไขไฟล์ `.env`

เปิดไฟล์ `.env` และตั้งค่าตามนี้:

```env
# MongoDB Configuration
# สำหรับ MongoDB Atlas (Cloud)
DATABASE_URL="mongodb+srv://USERNAME:PASSWORD@bearthai.vhek1d9.mongodb.net/bearthai?retryWrites=true&w=majority"

# หรือสำหรับ Local MongoDB
# DATABASE_URL="mongodb://localhost:27017/bearthai"

# JWT Configuration
JWT_SECRET="your_jwt_secret_key_here_change_this_in_production"
JWT_EXPIRES_IN="7d"

# Server Configuration
PORT=3000
NODE_ENV=development

# Frontend URL (สำหรับ CORS)
FRONTEND_URL=http://localhost:5173

# Email Configuration (Optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BearThai@gmail.com
APP_NAME=BearThai
```

**สำคัญ:** 
- ต้องเปลี่ยน `USERNAME` และ `PASSWORD` ใน `DATABASE_URL` เป็น credentials จริง
- ต้องเปลี่ยน `JWT_SECRET` เป็นค่าที่ปลอดภัยใน Production

### 3. ตั้งค่า MongoDB Atlas (ถ้าใช้ Cloud)

1. สร้าง Account ที่ [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. สร้าง Cluster ใหม่
3. สร้าง Database User
4. Whitelist IP Address (หรือใช้ `0.0.0.0/0` สำหรับ Development)
5. Copy Connection String และใส่ใน `.env`

## 🚀 การใช้งาน

### Development Mode

```bash
npm run dev
```

หรือ

```bash
yarn dev
```

Server จะรันที่ `http://localhost:3000`

คุณควรเห็น:
```
✅ Connected to MongoDB
📚 MongoDB connected
🚀 BearThai API Server is running on port 3000
```

### Production Mode

```bash
npm start
```

## 📁 โครงสร้างโปรเจค

```
api/
├── config/                 # Configuration Files
│   ├── database.js        # MongoDB Connection
│   └── jwt.js             # JWT Configuration
├── controllers/           # Route Controllers
│   ├── authController.js
│   ├── teacherController.js
│   └── studentController.js
├── services/              # Business Logic
│   ├── authService.js
│   ├── databaseService.js
│   ├── classroomService.js
│   ├── lessonService.js
│   └── studentService.js
├── middleware/            # Express Middleware
│   ├── auth.js           # Authentication Middleware
│   ├── validation.js     # Input Validation
│   └── errorHandler.js   # Error Handling
├── models/               # Mongoose Models
│   ├── User.js
│   ├── Teacher.js
│   ├── Student.js
│   ├── Classroom.js
│   ├── Lesson.js
│   ├── Test.js
│   ├── Question.js
│   ├── Game.js
│   ├── LessonProgress.js
│   ├── TestAttempt.js
│   ├── GameAttempt.js
│   ├── Notification.js
│   └── Announcement.js
├── routes/               # API Routes
│   ├── auth.js
│   ├── teacher.js
│   └── student.js
├── helpers/              # Utility Functions
├── public/               # Static Files
├── server.js             # Main Server File
├── package.json
└── .env                  # Environment Variables (ไม่ commit)
```

## 🔌 API Endpoints

### Authentication

```
POST   /api/auth/register          # สมัครสมาชิก
POST   /api/auth/login             # เข้าสู่ระบบ
POST   /api/auth/qr-login          # เข้าสู่ระบบด้วย QR Code
GET    /api/auth/profile           # ดูข้อมูลโปรไฟล์
```

### Teacher Routes

```
# Classrooms
GET    /api/teacher/classrooms                    # รายการห้องเรียน
POST   /api/teacher/classrooms                    # สร้างห้องเรียน
GET    /api/teacher/classrooms/:id                # ข้อมูลห้องเรียน
PUT    /api/teacher/classrooms/:id                # แก้ไขห้องเรียน
DELETE /api/teacher/classrooms/:id                # ลบห้องเรียน

# Students
POST   /api/teacher/students                      # สร้างนักเรียน (ไม่ต้องมีห้องเรียน)
POST   /api/teacher/classrooms/:id/students       # เพิ่มนักเรียนเข้าห้องเรียน
DELETE /api/teacher/classrooms/:id/students/:sid  # ลบนักเรียน
POST   /api/teacher/classrooms/:id/students/:sid/reset-password  # รีเซ็ตรหัสผ่าน

# Lessons
GET    /api/teacher/classrooms/:id/lessons        # รายการบทเรียน
POST   /api/teacher/classrooms/:id/lessons        # สร้างบทเรียน
POST   /api/teacher/lessons/generate-all          # สร้างบทเรียนอัตโนมัติ (ทุกห้อง)
POST   /api/teacher/classrooms/:id/lessons/generate  # สร้างบทเรียนอัตโนมัติ (ห้องเดียว)
PUT    /api/teacher/lessons/:id                   # แก้ไขบทเรียน
DELETE /api/teacher/lessons/:id                   # ลบบทเรียน
PUT    /api/teacher/lessons/reorder               # เรียงลำดับบทเรียน

# Tests
POST   /api/teacher/lessons/:id/tests/generate    # สร้างแบบทดสอบอัตโนมัติ
POST   /api/teacher/lessons/:id/tests             # สร้างแบบทดสอบ
POST   /api/teacher/tests/:id/questions           # เพิ่มคำถาม

# Games
POST   /api/teacher/lessons/:id/games/generate    # สร้างเกมอัตโนมัติ
POST   /api/teacher/lessons/:id/games             # สร้างเกม

# Reports
GET    /api/teacher/classrooms/:id/reports        # รายงานผล
```

### Student Routes

```
# Lessons
GET    /api/student/lessons                       # รายการบทเรียน
GET    /api/student/lessons/:id/pre-test-status   # ตรวจสอบ Pre-test
GET    /api/student/lessons/:id/post-test-status  # ตรวจสอบ Post-test
POST   /api/student/lessons/:id/complete          # บันทึกความคืบหน้า
POST   /api/student/lessons/:id/activities/:aid/submit  # ส่งผลกิจกรรม

# Tests
GET    /api/student/tests                         # รายการแบบทดสอบ
POST   /api/student/tests/:id/submit              # ส่งคำตอบ

# Games
GET    /api/student/games                         # รายการเกม
POST   /api/student/games/:id/submit              # ส่งผลเกม

# Progress
GET    /api/student/progress                      # ความคืบหน้า

# Notifications
GET    /api/student/notifications                 # รายการการแจ้งเตือน
PUT    /api/student/notifications/:id/read        # Mark as read
```

## 🗄️ Database Schema

### User
```javascript
{
  email: String (unique, required)
  password: String (hashed, required)
  role: String (TEACHER | STUDENT, required)
  name: String (required)
  school: String (optional)
}
```

### Teacher
```javascript
{
  userId: ObjectId (ref: User)
  school: String
  name: String
}
```

### Student
```javascript
{
  userId: ObjectId (ref: User)
  classroomId: ObjectId (ref: Classroom, optional)
  studentCode: String (unique)
  qrCode: String (unique)
  name: String
}
```

### Classroom
```javascript
{
  name: String (required)
  description: String
  teacherId: ObjectId (ref: Teacher)
}
```

### Lesson
```javascript
{
  title: String (required)
  content: Object (required)
  orderIndex: Number
  classroomId: ObjectId (ref: Classroom)
  teacherId: ObjectId (ref: Teacher)
  isActive: Boolean
}
```

### Test
```javascript
{
  title: String (required)
  type: String (PRE_TEST | POST_TEST | PRACTICE)
  lessonId: ObjectId (ref: Lesson)
  passingScore: Number
  timeLimit: Number (minutes)
  isActive: Boolean
}
```

### Question
```javascript
{
  testId: ObjectId (ref: Test)
  question: String (required)
  options: [String] (required)
  correctAnswer: Number (required)
  explanation: String
}
```

## 🔐 Authentication

### JWT Token

API ใช้ JWT Token สำหรับการยืนยันตัวตน

**Headers:**
```
Authorization: Bearer <jwt_token>
```

### Token Expiration

- Default: 7 วัน
- ตั้งค่าได้ใน `.env`: `JWT_EXPIRES_IN`

### Password Hashing

- ใช้ `bcryptjs` สำหรับ hash password
- Salt rounds: 12

## 🎯 Unlock Rules

ระบบปลดล็อกตามลำดับ:

1. **Pre-test** → ต้องทำก่อนเรียน
2. **เรียน CAI** → เรียนจบแล้วปลดล็อก Post-test
3. **Post-test** → ทำเสร็จแล้วปลดล็อกเกม
4. **เกม** → เล่นได้เมื่อทำ Post-test เสร็จ

## 🔄 Auto Content Generation

### สร้างบทเรียนอัตโนมัติ

```bash
POST /api/teacher/lessons/generate-all
```

สร้างบทเรียน 14 บทอัตโนมัติให้ทุกห้องเรียน

### สร้างแบบทดสอบอัตโนมัติ

```bash
POST /api/teacher/lessons/:id/tests/generate
```

สร้าง Pre-test และ Post-test อัตโนมัติสำหรับบทเรียน

### สร้างเกมอัตโนมัติ

```bash
POST /api/teacher/lessons/:id/games/generate
```

สร้างเกมอัตโนมัติสำหรับบทเรียน

## 📊 Progress Tracking

### Lesson Progress
- บันทึกความคืบหน้าแต่ละบทเรียน
- บันทึกผลกิจกรรม (Activity Results)
- เก็บคะแนนและเวลา

### Test Attempts
- บันทึกทุกครั้งที่ทำแบบทดสอบ
- เก็บคะแนน, คำตอบ, เวลา
- คำนวณผ่าน/ไม่ผ่าน

### Game Attempts
- บันทึกผลเกม
- เก็บคะแนน, ระดับ, เวลา

## 🔔 Notification System

### Types
- `INFO` - ข้อมูลทั่วไป
- `SUCCESS` - สำเร็จ
- `WARNING` - คำเตือน
- `ERROR` - ข้อผิดพลาด

### Auto Notifications
- เมื่อผ่านแบบทดสอบ
- เมื่อได้รับดาว
- เมื่อปลดล็อกเนื้อหาใหม่

## 🧪 Testing

### Health Check

```bash
curl http://localhost:3000/health
```

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123",
    "role": "TEACHER",
    "name": "Test Teacher"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teacher@example.com",
    "password": "password123"
  }'
```

## 🚀 Deployment

### Deploy บน Vercel

1. **ติดตั้ง Vercel CLI**
```bash
npm i -g vercel
```

2. **Login Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **ตั้งค่า Environment Variables** ใน Vercel Dashboard:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `PORT`
   - `FRONTEND_URL`
   - และอื่นๆ ตามที่ต้องการ

### Deploy บน Heroku

1. **ติดตั้ง Heroku CLI**
2. **Login Heroku**
```bash
heroku login
```

3. **Create App**
```bash
heroku create your-app-name
```

4. **Set Environment Variables**
```bash
heroku config:set DATABASE_URL=your_mongodb_url
heroku config:set JWT_SECRET=your_jwt_secret
```

5. **Deploy**
```bash
git push heroku main
```

## 🐛 Troubleshooting

### Error: "DATABASE_URL environment variable is not set"

**แก้ไข:**
1. ตรวจสอบว่ามีไฟล์ `.env` ในโฟลเดอร์ `api/`
2. ตรวจสอบว่า `DATABASE_URL` ถูกตั้งค่าใน `.env`
3. Restart server

### Error: "MongoDB connection error"

**แก้ไข:**
1. ตรวจสอบ MongoDB credentials ใน `.env`
2. ตรวจสอบ Network Access ใน MongoDB Atlas (Whitelist IP)
3. ตรวจสอบ Connection String format

### Error: "buffering timed out"

**แก้ไข:**
1. ตรวจสอบว่า MongoDB URL ถูกต้อง
2. ตรวจสอบ Network connection
3. ตรวจสอบว่า MongoDB Atlas Cluster ทำงานอยู่

### Error: "JWT_SECRET is not set"

**แก้ไข:**
1. ตั้งค่า `JWT_SECRET` ในไฟล์ `.env`
2. ใช้ค่าที่ปลอดภัย (อย่างน้อย 32 characters)
3. Restart server

### Error: CORS Error

**แก้ไข:**
1. ตั้งค่า `FRONTEND_URL` ใน `.env`
2. ตรวจสอบ CORS settings ใน `server.js`
3. ตรวจสอบว่า Frontend URL ถูกต้อง

## 📝 Error Response Format

```json
{
  "success": false,
  "message": "ข้อความแสดงข้อผิดพลาด",
  "errors": [
    {
      "field": "email",
      "message": "รูปแบบอีเมลไม่ถูกต้อง"
    }
  ]
}
```

## 🔒 Security Features

- ✅ JWT Authentication
- ✅ Password Hashing (bcrypt)
- ✅ Input Validation (Joi)
- ✅ Rate Limiting
- ✅ CORS Configuration
- ✅ MongoDB Injection Protection
- ✅ Environment Variables

## 📈 Performance

- ✅ MongoDB Connection Pooling
- ✅ Query Optimization
- ✅ Indexes on frequently queried fields
- ✅ Error Logging
- ✅ Request Logging

## 📚 เอกสารเพิ่มเติม

- [Express Documentation](https://expressjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [JWT Documentation](https://jwt.io/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

BearThai Team

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา

---

**Happy Coding! 🚀**
