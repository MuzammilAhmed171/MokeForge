# MockForge - Professional Portfolio Mockup Studio

A full-stack web application for creating professional portfolio mockups with advanced design features, AI-powered generation, and seamless deployment.

![MockForge](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Build](https://img.shields.io/badge/build-passing-brightgreen)

## 🌟 Features

### Design & Mockup
- **125+ Device Models**: Laptops, phones, tablets, browsers, monitors
- **Advanced Editor**: Drag & drop, resize, rotate, layer management
- **Smart Backgrounds**: Procedural, image, and hybrid backgrounds (50+ presets)
- **AI Design Generation**: Mood-based themes and unlimited variations
- **Professional Export**: High-quality PNG, JPG, WebP with custom sizes

### User Management
- **Authentication**: JWT-based secure login/signup
- **Email Verification**: OTP-based email verification with Google SMTP
- **Password Recovery**: Secure password reset flow
- **Multi-tenant**: Each user has isolated workspace

### Technical
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js, Express, MongoDB, JWT
- **Email**: Google SMTP with professional HTML templates
- **Deployment**: Vercel-ready with production configurations

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (free)
- Google Account (for SMTP)
- Vercel account (free)

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/mockforge.git
cd mockforge
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env` with your credentials:
- MongoDB URI (from MongoDB Atlas)
- JWT Secret (generate strong random string)
- Google SMTP credentials (from Google App Passwords)

### 3. Setup Frontend
```bash
cd ..
npm install
cp .env.example .env
```

Edit `.env` with your backend URL:
```env
VITE_API_URL=http://localhost:5000/api
```

### 4. Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit: `http://localhost:5173`

## 📖 Complete Setup Guide

For detailed setup instructions including:
- MongoDB Atlas setup
- Google SMTP configuration
- Vercel deployment
- Production configuration

👉 **[Read Complete Deployment Guide](DEPLOYMENT.md)**

## 🏗️ Project Structure

```
mockforge/
├── backend/                 # Node.js Express API
│   ├── config/             # Database configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & error middleware
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API routes
│   ├── services/          # Email service
│   ├── server.js          # Entry point
│   └── .env.example       # Environment template
├── src/                    # React Frontend
│   ├── auth/              # Authentication context
│   ├── components/        # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── store/             # Zustand state
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── DEPLOYMENT.md          # Deployment guide
├── vercel.json            # Frontend Vercel config
└── README.md              # This file
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify-email` - Verify email with OTP
- `POST /api/auth/resend-otp` - Resend verification OTP
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Projects
- `GET /api/projects` - Get all user projects
- `GET /api/projects/:id` - Get single project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project
- `POST /api/projects/:id/duplicate` - Duplicate project

## 🌐 Deployment

### Deploy to Vercel

**Backend:**
1. Push to GitHub
2. Import to Vercel
3. Set root directory: `backend`
4. Add environment variables
5. Deploy

**Frontend:**
1. Import same repo to Vercel
2. Set root directory: `./`
3. Add `VITE_API_URL` environment variable
4. Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed instructions.

## 🔐 Environment Variables

### Backend (backend/.env)
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FRONTEND_URL=https://your-app.vercel.app
```

### Frontend (.env)
```env
VITE_API_URL=https://your-backend.vercel.app/api
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **React Router** - Routing
- **Canvas API** - Design rendering

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service
- **Helmet** - Security
- **CORS** - Cross-origin support

## 📱 Features in Detail

### Canvas Image System
- Drag & drop images to canvas
- Independent image placement
- Resize, rotate, position controls
- Corner radius customization
- Layer management
- Grid alignment guides

### Device Mockups
- 25 models per device type
- Realistic frames and shadows
- Screenshot placement
- Perspective controls
- Material customization

### Design Generation
- 16 mood presets
- 50+ compositions
- Background variations
- Icon placement
- Decoration system

### Export System
- Multiple formats (PNG, JPG, WebP)
- Custom resolutions
- Transparency support
- Quality controls

## 🔒 Security

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API
- CORS protection
- Input validation
- MongoDB injection protection
- Environment variable protection

## 📊 Database Schema

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

### OTP
- user (reference)
- otp, type, expiresAt
- attempts, createdAt

## 🐛 Troubleshooting

### MongoDB Connection Failed
- Check MONGODB_URI format
- Verify network access in Atlas
- Check IP whitelist (0.0.0.0/0)

### SMTP Not Working
- Verify app password (no spaces)
- Check 2FA is enabled
- Test credentials manually

### CORS Errors
- Update FRONTEND_URL in backend
- Check allowed origins in server.js
- Verify exact URL match

### Build Issues
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

## 📝 Scripts

```bash
# Frontend
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Backend
cd backend
npm run dev          # Start with nodemon
npm start            # Production start
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📄 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Muzammil Ahmed**
- GitHub: [@yourusername](https://github.com/yourusername)
- Email: your@email.com

## 🙏 Acknowledgments

- Device mockup designs inspired by professional design tools
- Icons from various open-source libraries
- Font families from Google Fonts

## 📞 Support

For issues and questions:
- Open GitHub issue
- Check [DEPLOYMENT.md](DEPLOYMENT.md)
- Review API documentation

---

**Built with ❤️ for designers and developers**

Star ⭐ this repo if you find it useful!
