# MockForge Backend API

Professional backend server for MockForge - Portfolio Mockup Studio

## 🚀 Features

- **Authentication**: JWT-based auth with email verification
- **Multi-tenant Architecture**: Each user has isolated workspace
- **MongoDB Database**: Scalable data storage
- **Google SMTP**: Professional email templates for verification
- **RESTful API**: Clean, well-structured endpoints
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, input validation

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB (local or Atlas)
- Google Account (for SMTP)

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

### 3. Configure Environment Variables

Edit `.env` file with your credentials:

```env
# Server
PORT=5000
NODE_ENV=production

# MongoDB (Get from MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/mockforge

# JWT Secret (Generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d

# Google SMTP (Get from Google Account)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
SMTP_FROM_NAME=MockForge
SMTP_FROM_EMAIL=noreply@mockforge.com

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# OTP
OTP_LENGTH=6
OTP_EXPIRE_MINUTES=10
```

### 4. Get Google App Password

1. Go to [Google Account](https://myaccount.google.com/)
2. Enable 2-Factor Authentication
3. Go to Security → App Passwords
4. Generate new app password for "Mail"
5. Use this password in `SMTP_PASS`

### 5. Get MongoDB URI

**Option A: MongoDB Atlas (Recommended)**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string
4. Replace `<password>` with your database password

**Option B: Local MongoDB**
```env
MONGODB_URI=mongodb://localhost:27017/mockforge
```

## 🏃 Running the Server

### Development Mode

```bash
npm run dev
```

Server will run on `http://localhost:5000`

### Production Mode

```bash
npm start
```

## 📡 API Endpoints

### Authentication

```
POST   /api/auth/signup          - Register new user
POST   /api/auth/login           - Login user
POST   /api/auth/verify-email    - Verify email with OTP
POST   /api/auth/resend-otp      - Resend verification OTP
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password with OTP
GET    /api/auth/me              - Get current user
PUT    /api/auth/profile         - Update profile
POST   /api/auth/logout          - Logout user
```

### Projects

```
GET    /api/projects             - Get all user projects
GET    /api/projects/:id         - Get single project
POST   /api/projects             - Create new project
PUT    /api/projects/:id         - Update project
DELETE /api/projects/:id         - Delete project
POST   /api/projects/:id/duplicate - Duplicate project
PUT    /api/projects/:id/thumbnail - Update thumbnail
PUT    /api/projects/:id/export  - Increment export count
```

### Health Check

```
GET    /api/health               - Check server status
```

## 🔐 Authentication Flow

1. **Signup**: User registers → OTP sent to email
2. **Verify Email**: User enters OTP → Email verified
3. **Login**: User logs in → JWT token returned
4. **Protected Routes**: Token required in header
5. **Logout**: Token removed from frontend

### Token Usage

Include token in all protected requests:

```javascript
headers: {
  'Authorization': 'Bearer YOUR_JWT_TOKEN'
}
```

## 📧 Email Templates

Professional HTML email templates for:
- Email Verification
- Password Reset

Features:
- Responsive design
- Dark theme
- MockForge branding
- Clear OTP display

## 🗄️ Database Models

### User
- name, email, password (hashed)
- emailVerified, avatar
- createdAt, lastLogin

### Project
- user (reference)
- name, type, canvas
- assets, devices, background
- text, logo, decoration
- accents, thumbnail
- exportCount, decos, mood
- icons, textboxes, canvasImages
- createdAt, updatedAt

### OTP
- user (reference)
- otp, type, expiresAt
- attempts, createdAt

## 🌐 CORS Configuration

Update `FRONTEND_URL` in `.env`:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

For multiple origins, modify `server.js`:

```javascript
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  credentials: true
}));
```

## 🚢 Deployment

### Vercel Deployment

1. Push backend to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import GitHub repository
4. Add environment variables
5. Deploy

### Railway Deployment

1. Go to [Railway](https://railway.app)
2. New Project → Deploy from GitHub
3. Add environment variables
4. Deploy

### Render Deployment

1. Go to [Render](https://render.com)
2. New Web Service
3. Connect GitHub repository
4. Add environment variables
5. Deploy

## 🔒 Security Best Practices

1. **Never commit `.env` file**
2. **Use strong JWT_SECRET** (min 32 characters)
3. **Enable HTTPS in production**
4. **Use MongoDB Atlas with IP whitelist**
5. **Rotate JWT_SECRET periodically**
6. **Monitor rate limiting logs**
7. **Keep dependencies updated**

## 📊 Monitoring

### Logs

Server logs all requests:
```
GET /api/projects
POST /api/auth/login
```

### Error Tracking

All errors logged with stack traces in development.

## 🧪 Testing API

### Using cURL

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'

# Get Projects (with token)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman

1. Import API collection
2. Set environment variables
3. Test all endpoints

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check `MONGODB_URI` in `.env`
- Verify MongoDB is running
- Check network connectivity

### SMTP Not Working
- Verify Google App Password
- Check SMTP settings
- Ensure 2FA is enabled

### CORS Errors
- Update `FRONTEND_URL` in `.env`
- Check frontend origin matches
- Restart server after changes

### Token Expired
- Check `JWT_EXPIRE` setting
- Verify token in request header
- Login again to get new token

## 📝 License

MIT

## 👨‍💻 Author

MockForge Team

## 🤝 Support

For issues and questions:
- GitHub Issues
- Email: support@mockforge.com

---

**Built with ❤️ for professional designers**
