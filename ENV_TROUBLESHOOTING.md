# 🔧 แก้ปัญหา .env ไม่ถูกโหลด

## 📋 สาเหตุหลักที่ .env ไม่ถูกอ่าน

### 1. ✅ **ตรวจสอบว่า dotenv ถูกโหลดหรือไม่**

โปรเจ็กต์นี้มีการโหลด dotenv ใน `server.js` แล้ว:

```javascript
import dotenv from 'dotenv';
dotenv.config();
```

**หากต้องการตรวจสอบ:**
- ตรวจสอบ console log เมื่อเริ่ม server ควรเห็น:
  ```
  ✅ Loaded .env from: C:\path\to\api\.env
  ```

### 2. 📂 **ตรวจสอบ Path ของ .env**

**ไฟล์ `.env` ต้องอยู่ในโฟลเดอร์ `api/`:**

```
api/
├── .env          ← ต้องอยู่ที่นี่!
├── server.js
├── config/
└── ...
```

**ตรวจสอบว่าไฟล์อยู่ที่ถูกต้อง:**
```powershell
# ในโฟลเดอร์ api/
Get-ChildItem .env
```

### 3. 🔍 **ตรวจสอบรูปแบบไฟล์ .env**

**❌ ผิด:**
```env
SMTP_HOST = smtp.gmail.com    # มีช่องว่างรอบ =
SMTP_HOST="smtp.gmail.com"    # ไม่จำเป็นต้องใช้ "" หากไม่มีช่องว่าง
SMTP_HOST='smtp.gmail.com'    # ใช้ ' แทน " 
```

**✅ ถูกต้อง:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_ENABLED=true
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/db
```

**📝 หลักการ:**
- **ไม่มีช่องว่าง** รอบเครื่องหมาย `=`
- **ไม่ใช้ quote** (`"` หรือ `'`) เว้นแต่ค่ามีช่องว่างหรือตัวอักษรพิเศษ
- **ใช้ `true`/`false`** สำหรับ boolean (ไม่ใช่ `"true"` หรือ `'true'`)

### 4. 🔐 **ตรวจสอบ Environment Variables ที่ต้องมี**

**ไฟล์ `.env` ควรมีค่าต่อไปนี้:**

```env
# Database
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname

# JWT
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email (Optional)
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com
```

### 5. 🛠️ **วิธีแก้ปัญหา**

#### ขั้นตอนที่ 1: ตรวจสอบว่าไฟล์ `.env` มีอยู่จริง

```powershell
cd api
Test-Path .env  # ควรแสดง True
```

#### ขั้นตอนที่ 2: ตรวจสอบเนื้อหาของไฟล์

```powershell
Get-Content .env | Select-Object -First 10
```

**ตรวจสอบว่า:**
- ไม่มีช่องว่างรอบ `=`
- ไม่มี quote ที่ไม่จำเป็น
- ค่า boolean เป็น `true`/`false` (ไม่ใช่ string)

#### ขั้นตอนที่ 3: สร้างไฟล์ใหม่จาก template

```powershell
cd api
Copy-Item env.example .env
```

แล้วแก้ไขไฟล์ `.env` ด้วย editor ของคุณ

#### ขั้นตอนที่ 4: ตรวจสอบว่า dotenv โหลดสำเร็จ

เมื่อเริ่ม server ควรเห็น:
```
✅ Loaded .env from: C:\path\to\api\.env
```

หากเห็น:
```
⚠️  Warning: Could not load .env file
```

ให้ตรวจสอบ:
1. ไฟล์ `.env` อยู่ในโฟลเดอร์ `api/` หรือไม่
2. ชื่อไฟล์เป็น `.env` (มีจุดหน้า) ไม่ใช่ `env` หรือ `.env.txt`
3. ไฟล์ไม่ถูกซ่อน (Hidden file)

### 6. 🐛 **Debug: ตรวจสอบว่าตัวแปรถูกโหลดหรือไม่**

เพิ่ม code นี้ใน `server.js` ชั่วคราวเพื่อ debug:

```javascript
// หลังจาก dotenv.config()
console.log('🔍 Environment Variables Check:');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');
console.log('EMAIL_ENABLED:', process.env.EMAIL_ENABLED);
console.log('SMTP_HOST:', process.env.SMTP_HOST);
```

### 7. ⚠️ **ปัญหาที่พบบ่อย**

#### ปัญหา: "DATABASE_URL environment variable is not set"
**แก้ไข:**
- ตรวจสอบว่ามี `DATABASE_URL=...` ใน `.env`
- ตรวจสอบว่าไม่มีช่องว่างรอบ `=`
- ตรวจสอบว่าไฟล์ `.env` อยู่ในโฟลเดอร์ `api/`

#### ปัญหา: Email ไม่ส่ง (EMAIL_ENABLED ถูก ignore)
**แก้ไข:**
```env
# ❌ ผิด
EMAIL_ENABLED = true
EMAIL_ENABLED="true"
EMAIL_ENABLED='true'

# ✅ ถูกต้อง
EMAIL_ENABLED=true
```

#### ปัญหา: รันจากโฟลเดอร์อื่น
**แก้ไข:**
- รันคำสั่งจากโฟลเดอร์ `api/`:
  ```powershell
  cd api
  npm run dev
  ```

### 8. 📝 **ตัวอย่างไฟล์ .env ที่ถูกต้อง**

```env
# MongoDB Configuration
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=your-email@gmail.com
```

### 9. ✅ **เช็คลิสต์ก่อน Deploy**

- [ ] ไฟล์ `.env` มีอยู่ในโฟลเดอร์ `api/`
- [ ] ไฟล์ `.env` ไม่ถูก commit ไป git (ตรวจสอบ `.gitignore`)
- [ ] ทุก environment variable ที่จำเป็นมีค่าแล้ว
- [ ] ไม่มีช่องว่างรอบ `=`
- [ ] ค่า boolean เป็น `true`/`false` (ไม่ใช่ string)
- [ ] สำหรับ production: ตั้งค่า environment variables ใน Vercel/Railway/etc.

---

**💡 Tip:** ใช้ `env.example` เป็น template และ copy ไปเป็น `.env` แล้วแก้ไขค่าที่จำเป็น

