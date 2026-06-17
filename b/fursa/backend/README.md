# فُرَص - Fursa Job Platform
## Complete Backend — Node.js + Express + PostgreSQL

---

## 📁 Project Structure

```
fursa/
└── backend/
    ├── src/
    │   ├── config/
    │   │   ├── database.js      # PostgreSQL connection pool
    │   │   ├── migrate.js       # Creates all database tables
    │   │   └── seed.js          # Seeds admin + categories
    │   │
    │   ├── controllers/         # Handle request → call service → send response
    │   │   ├── auth.controller.js
    │   │   ├── job.controller.js
    │   │   ├── application.controller.js
    │   │   └── admin.controller.js
    │   │
    │   ├── services/            # All database logic lives here
    │   │   ├── auth.service.js
    │   │   ├── job.service.js
    │   │   ├── application.service.js
    │   │   └── admin.service.js
    │   │
    │   ├── middleware/
    │   │   ├── auth.js          # JWT authentication + role authorization
    │   │   ├── validate.js      # express-validator error checker
    │   │   ├── upload.js        # multer CV file upload
    │   │   └── errorHandler.js  # Global error handler
    │   │
    │   ├── routes/
    │   │   ├── auth.routes.js
    │   │   ├── job.routes.js
    │   │   ├── application.routes.js
    │   │   ├── admin.routes.js
    │   │   └── category.routes.js
    │   │
    │   ├── validators/          # Input validation rules
    │   │   ├── auth.validators.js
    │   │   ├── job.validators.js
    │   │   └── application.validators.js
    │   │
    │   ├── utils/
    │   │   ├── jwt.js           # Generate + verify tokens
    │   │   └── response.js      # Standardized API responses
    │   │
    │   └── server.js            # App entry point
    │
    ├── uploads/
    │   └── cvs/                 # Uploaded CV files stored here
    │
    ├── .env.example             # Environment variables template
    ├── .gitignore
    ├── package.json
    └── render.yaml              # Deploy to Render.com
```

---

## 🗄️ Database Schema

```
users
  id, name, email, password (hashed), role, is_active, created_at

job_seeker_profiles
  id, user_id → users, phone, city, major, experience, cv_filename, bio

employer_profiles
  id, user_id → users, company_name, company_city, website, about, phone, is_verified

categories
  id, name, name_ar, icon, is_active

jobs
  id, employer_id → users, category_id → categories,
  title, company_name, city, description, requirements,
  job_type, deadline, status (pending|approved|rejected|closed),
  rejection_reason, views_count

applications
  id, job_id → jobs, applicant_id → users,
  full_name, email, phone, major, experience,
  cover_letter, cv_filename, cv_path,
  status (pending|reviewed|accepted|rejected)
```

---

## ⚡ Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ installed locally

### Step 1: Install dependencies
```bash
cd backend
npm install
```

### Step 2: Create PostgreSQL database
```bash
# Open PostgreSQL shell
psql -U postgres

# Create the database
CREATE DATABASE fursa_db;
\q
```

### Step 3: Set up environment variables
```bash
cp .env.example .env
```
Edit `.env`:
```
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/fursa_db
JWT_SECRET=any_long_random_string_here_minimum_32_chars
NODE_ENV=development
```

### Step 4: Create database tables
```bash
npm run db:migrate
```

### Step 5: Seed default data
```bash
npm run db:seed
```
This creates:
- Admin account: `admin@fursa.sy` / `Admin@123456`
- 12 job categories

### Step 6: Start the server
```bash
npm run dev
```
Server runs at: `http://localhost:5000`

### Step 7: Test it works
```bash
curl http://localhost:5000/health
# Should return: { "status": "ok" }

curl http://localhost:5000/api/categories
# Should return the 12 categories
```

---

## 🚀 Deploy to Render.com (Free)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial backend"
git remote add origin https://github.com/yourusername/fursa.git
git push -u origin main
```

### Step 2: Create Render account
Go to https://render.com and sign up (free)

### Step 3: Create PostgreSQL database
- Click "New" → "PostgreSQL"
- Name: `fursa-db`
- Plan: Free
- Click "Create Database"
- Copy the "Internal Database URL"

### Step 4: Create Web Service
- Click "New" → "Web Service"
- Connect your GitHub repository
- Settings:
  - Root Directory: `backend`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Plan: Free

### Step 5: Add Environment Variables
In Render dashboard → Environment:
```
DATABASE_URL    = (paste the Internal Database URL from step 3)
JWT_SECRET      = (any long random string)
NODE_ENV        = production
FRONTEND_URL    = https://your-frontend.vercel.app
```

### Step 6: Run migrations on Render
After deployment, go to your service → Shell:
```bash
npm run db:migrate
npm run db:seed
```

---

## 🔐 Security Features
- Passwords hashed with bcrypt (cost 12)
- JWT tokens expire in 7 days
- Rate limiting: 100 req/15min globally, 10 req/15min on auth
- Helmet.js for secure HTTP headers
- CORS restricted to frontend URL
- Role-based access control (RBAC)
- Input validation on all endpoints
- SQL injection protected (parameterized queries)
- File type validation for CV uploads

---

## 📖 API Documentation
See `docs/API.md` for the complete list of all endpoints.
