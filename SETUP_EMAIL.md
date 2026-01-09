# 📧 Email Setup Guide

This guide will help you set up email notifications using Gmail SMTP.

## ⚠️ Important Notes

1. **Email is optional** - The application works fine without it
2. **Set `EMAIL_ENABLED=false`** if you don't want to use email
3. For Gmail, you need to use an **App Password**, not your regular password

## 🔧 Setup Steps

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable "2-Step Verification"
3. Follow the instructions to set it up

### Step 2: Generate App Password

1. Go back to [Google Account Security](https://myaccount.google.com/security)
2. Search for "App passwords" or go to [App Passwords](https://myaccount.google.com/apppasswords)
3. Select "Mail" and "Other (Custom name)"
4. Enter "BearThai API" as the name
5. Click "Generate"
6. **Copy the 16-character password** (you'll use this in .env)

### Step 3: Update .env File

Add these lines to your `api/.env` file:

```env
# Email Configuration
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=BearThai@gmail.com
APP_NAME=BearThai
```

**Important:** Replace:
- `your-email@gmail.com` with your actual Gmail address
- `your-16-char-app-password` with the app password from Step 2

### Step 4: Test Email Configuration

Restart your API server:

```bash
npm run dev
```

When you register a new user, you should see:
```
✅ Confirmation email sent to user@example.com: <message-id>
```

## 🧪 Testing

1. Go to your registration page
2. Register a new teacher account
3. Check the console for email status
4. Check the user's inbox for the confirmation email

## 🐛 Troubleshooting

### Error: "Invalid login"
→ Your app password is incorrect. Generate a new one in Step 2.

### Error: "Timeout"
→ Check your internet connection or firewall settings.

### Warning: "⚠️ Email transporter not available"
→ Check that `EMAIL_ENABLED=true` and all SMTP_* variables are set correctly.

### Email goes to Spam
→ This is common for new email servers. Consider:
- Setting up SPF records for your domain
- Using a dedicated email service like SendGrid or Mailgun

## 🔒 Security Best Practices

1. **Never commit `.env` to git** - It's already in `.gitignore`
2. **Use App Passwords** - Never use your main Gmail password
3. **Rotate passwords** - Change app passwords periodically
4. **Use environment-specific accounts** - Different Gmail accounts for dev/prod

## 📝 Alternative Email Services

If Gmail doesn't work for you, here are other options:

### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

### Mailtrap (for testing only)
```env
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-pass
```

---

**Need help?** Check the server logs for detailed error messages.
