# MockForge - Complete Setup & Deployment Guide

## 🎯 Quick Summary

MockForge is a full-stack portfolio mockup studio with:
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + MongoDB
- **Email**: Google SMTP with professional templates
- **Deployment**: Vercel-ready

---

## 📋 What You Need

### 1. MongoDB Atlas (Free)
- **Website**: https://www.mongodb.com/cloud/atlas/register
- **Time**: 5 minutes
- **Cost**: Free (M0 tier)
- **You'll get**: MongoDB connection string

### 2. Google Account (Free)
- **Website**: https://myaccount.google.com/
- **Time**: 3 minutes
- **Cost**: Free
- **You'll get**: App Password for SMTP

### 3. Vercel Account (Free)
- **Website**: https://vercel.com/signup
- **Time**: 2 minutes
- **Cost**: Free
- **You'll get**: Deployment platform

### 4. GitHub Account (Free)
- **Website**: https://github.com/signup
- **Time**: 2 minutes
- **Cost**: Free
- **You'll get**: Code hosting

---

## 🚀 Step-by-Step Setup

### Step 1: MongoDB Atlas Setup (5 min)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas/register
   - Sign up with email or Google

2. **Create Cluster**
   - Click "Build a Database"
   - Choose "M0 FREE" tier
   - Select cloud provider & region (closest to you)
   - Click "Create Cluster"
   - Wait 2-3 minutes

3. **Create Database User**
   - Click "Database Access" (left sidebar)
   - Click "Add New Database User"
   - Username: `mockforge_user`
   - Password: Click "Autogenerate" (COPY THIS PASSWORD!)
   - Role: "Read and write to any database"
   - Click "Add User"

4. **Setup Network Access**
   - Click "Network Access" (left sidebar)
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Click "Confirm"

5. **Get Connection String**
   - Click "Database" (left sidebar)
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string (looks like):
     ```
     mongodb+srv://mockforge_user:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - Replace `<password>` with your actual password
   - Add database name: `mockforge`
   - Final format:
     ```
     mongodb+srv://mockforge_user:YourPassword123@cluster0.xxxxx.mongodb.net/mockforge?retryWrites=true&w=majority
     ```

**SAVE THIS CONNECTION STRING!** You'll need it for `MONGODB_URI`

---

### Step 2: Google SMTP Setup (3 min)

1. **Enable 2-Step Verification**
   - Go to https://myaccount.google.com/security
   - Find "2-Step Verification"
   - Click "Get Started"
   - Follow setup (phone number required)
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Sign in if prompted
   - Under "Select app", choose "Mail"
   - Under "Select device", choose "Other (Custom name)"
   - Enter name: `MockForge Backend`
   - Click "Generate"
   - Copy the 16-character password (e.g., `abcd efgh ijkl mnop`)
   - **Remove spaces**: `abcdefghijklmnop`

**SAVE THIS PASSWORD!** You'll need it for `SMTP_PASS`

---

### Step 3: Local Setup (5 min)

1. **Clone/Download Project**
   ```bash
   # If you have Git
   git clone https://github.com/yourusername/mockforge.git
   cd mockforge
   
   # OR download ZIP and extract
   ```

2. **Run Setup Script**
   
   **Windows:**
   ```cmd
   setup.bat
   ```
   
   **Mac/Linux:**
   ```bash
   chmod +x setup.sh
   bash setup.sh
   ```
   
   **OR Manual Setup:**
   ```bash
   # Install frontend dependencies
   npm install
   
   # Install backend dependencies
   cd backend
   npm install
   cd ..
   
   # Create environment files
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. **Configure Frontend .env**
   
   Edit `.env` file:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```

4. **Configure Backend .env**
   
   Edit `backend/.env` file:
   ```env
   # MongoDB (from Step 1)
   MONGODB_URI=mongodb+srv://mockforge_user:YourPassword@cluster0.xxxxx.mongodb.net/mockforge
   
   # JWT Secret (generate random 32+ character string)
   # Use: https://www.random.org/strings/
   JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
   
   # Google SMTP (from Step 2)
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=abcdefghijklmnop
   
   # Frontend URL
   FRONTEND_URL=http://localhost:5173
   ```

5. **Start Development Servers**
   
   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```
   You should see:
   ```
   ✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
   🚀 Server running on port 5000
   ```
   
   **Terminal 2 - Frontend:**
   ```bash
   npm run dev
   ```
   You should see:
   ```
   VITE ready in 500 ms
   ➜  Local:   http://localhost:5173/
   ```

6. **Test Locally**
   - Visit http://localhost:5173
   - Sign up with your email
   - Check email for OTP
   - Verify account
   - Create project
   - Test editor

---

### Step 4: GitHub Setup (3 min)

1. **Create GitHub Repository**
   - Go to https://github.com/new
   - Repository name: `mockforge`
   - Make it Private (recommended)
   - DON'T initialize with README
   - Click "Create repository"

2. **Push Code to GitHub**
   ```bash
   # Initialize git (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit - MockForge full stack app"
   
   # Add remote
   git remote add origin https://github.com/yourusername/mockforge.git
   
   # Push
   git branch -M main
   git push -u origin main
   ```

---

### Step 5: Deploy Backend to Vercel (5 min)

1. **Login to Vercel**
   - Go to https://vercel.com
   - Click "Sign Up" or "Login"
   - Choose "Continue with GitHub"

2. **Import Backend**
   - Click "Add New..." → "Project"
   - Import your `mockforge` repository
   - **Root Directory**: `backend`
   - Framework Preset: `Other`
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
   - Click "Continue"

3. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   MONGODB_URI = mongodb+srv://mockforge_user:YourPassword@cluster0.xxxxx.mongodb.net/mockforge
   
   JWT_SECRET = your_super_secret_jwt_key_minimum_32_characters
   
   SMTP_HOST = smtp.gmail.com
   SMTP_PORT = 587
   SMTP_SECURE = false
   SMTP_USER = your_email@gmail.com
   SMTP_PASS = abcdefghijklmnop
   SMTP_FROM_NAME = MockForge
   SMTP_FROM_EMAIL = noreply@mockforge.com
   
   FRONTEND_URL = (will add after frontend deployment)
   
   NODE_ENV = production
   PORT = 5000
   
   RATE_LIMIT_WINDOW_MS = 900000
   RATE_LIMIT_MAX_REQUESTS = 100
   
   OTP_LENGTH = 6
   OTP_EXPIRE_MINUTES = 10
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your backend URL (e.g., `https://mockforge-backend.vercel.app`)

5. **Test Backend**
   - Visit: `https://mockforge-backend.vercel.app/api/health`
   - Should see:
     ```json
     {
       "status": "ok",
       "message": "MockForge API is running",
       "timestamp": "..."
     }
     ```

---

### Step 6: Deploy Frontend to Vercel (5 min)

1. **Import Frontend**
   - Go to https://vercel.com/dashboard
   - Click "Add New..." → "Project"
   - Import same `mockforge` repository
   - **Root Directory**: `./` (leave as is)
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Click "Continue"

2. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   VITE_API_URL = https://mockforge-backend.vercel.app/api
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Copy your frontend URL (e.g., `https://mockforge.vercel.app`)

4. **Update Backend CORS**
   - Go to backend project in Vercel
   - Click "Settings" → "Environment Variables"
   - Update `FRONTEND_URL`:
     ```
     FRONTEND_URL = https://mockforge.vercel.app
     ```
   - Click "Save"
   - Go to "Deployments" tab
   - Click "..." → "Redeploy" on latest deployment

---

### Step 7: Final Testing (5 min)

1. **Test Complete Flow**
   - Visit your frontend URL
   - Click "Sign Up"
   - Create account with your email
   - Check email for OTP
   - Enter OTP to verify
   - Login
   - Create new project
   - Test editor features
   - Export mockup

2. **Test Email Delivery**
   - Sign up with different email
   - Check if OTP arrives
   - If not, check:
     - SMTP credentials in backend .env
     - Vercel backend logs
     - Spam folder

3. **Test Project Persistence**
   - Create project
   - Add devices, screenshots
   - Refresh page
   - Project should still be there
   - Logout and login again
   - Project should still be there

---

## 🔍 Troubleshooting

### MongoDB Connection Failed
**Error**: `MongoDB Connection Error`

**Solution**:
1. Check `MONGODB_URI` format is correct
2. Verify password has no special characters issues
3. Check Network Access allows 0.0.0.0/0
4. Check Vercel backend logs for detailed error

### SMTP Not Working
**Error**: Emails not sending

**Solution**:
1. Verify 2FA is enabled on Google account
2. Check App Password has no spaces
3. Verify SMTP_USER is correct Gmail
4. Check Vercel backend logs
5. Try resending OTP

### CORS Errors
**Error**: `CORS policy does not allow access`

**Solution**:
1. Update `FRONTEND_URL` in backend .env
2. Redeploy backend
3. Check exact URL match (including https://)
4. Clear browser cache

### Build Failed
**Error**: Build errors

**Solution**:
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### Backend Not Connecting
**Error**: API calls failing

**Solution**:
1. Check `VITE_API_URL` in frontend .env
2. Verify backend is deployed and running
3. Check backend URL in browser
4. Check Vercel deployment logs

---

## 📊 Your Production URLs

After deployment, you'll have:

- **Frontend**: `https://mockforge.vercel.app`
- **Backend API**: `https://mockforge-backend.vercel.app`
- **API Health**: `https://mockforge-backend.vercel.app/api/health`
- **GitHub**: `https://github.com/yourusername/mockforge`

---

## 🎯 What's Working

✅ Landing page with professional design
✅ User authentication (signup, login, logout)
✅ Email verification with OTP
✅ Password reset flow
✅ Multi-tenant architecture (each user has own workspace)
✅ Project CRUD operations
✅ Canvas image system
✅ Device mockups (125+ models)
✅ Design generation
✅ Export system
✅ Layer management
✅ Professional email templates
✅ MongoDB data persistence
✅ JWT security
✅ Rate limiting
✅ CORS protection
✅ Vercel deployment ready

---

## 🔄 Making Changes

### Update Frontend
```bash
# Make changes
git add .
git commit -m "Update description"
git push
```
Vercel will auto-deploy!

### Update Backend
```bash
cd backend
# Make changes
git add .
git commit -m "Update description"
git push
```
Vercel will auto-deploy!

### Update Environment Variables
1. Go to Vercel project
2. Settings → Environment Variables
3. Update variable
4. Redeploy

---

## 📞 Support

If you encounter issues:

1. **Check Logs**
   - Vercel: Dashboard → Your Project → Deployments → View Logs
   - MongoDB Atlas: Clusters → Logs

2. **Check Documentation**
   - [DEPLOYMENT.md](DEPLOYMENT.md) - Detailed deployment guide
   - [backend/README.md](backend/README.md) - Backend API docs
   - [README.md](README.md) - Project overview

3. **Common Issues**
   - MongoDB: Check connection string format
   - SMTP: Verify app password (no spaces)
   - CORS: Ensure FRONTEND_URL matches exactly
   - Build: Clear node_modules and reinstall

---

## 🎉 You're Done!

Your MockForge app is now:
- ✅ Running locally
- ✅ Deployed to Vercel
- ✅ Connected to MongoDB
- ✅ Sending emails via Google SMTP
- ✅ Ready for users!

**Share your app**: `https://mockforge.vercel.app`

---

## 📝 Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Google 2FA enabled
- [ ] App password generated
- [ ] Frontend .env configured
- [ ] Backend .env configured
- [ ] Local testing successful
- [ ] GitHub repository created
- [ ] Code pushed to GitHub
- [ ] Backend deployed to Vercel
- [ ] Frontend deployed to Vercel
- [ ] CORS updated with frontend URL
- [ ] Production testing successful
- [ ] Email delivery verified

---

**Built with ❤️ for designers and developers**

Need help? Check [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions!
