# Digital Talent Management System

Full stack internship project built with Next.js, Express, and MongoDB for authentication, task management, role-based access, employee profiles, and dashboard analytics.

## Overview

This application was developed sprint by sprint as an individual build:

- Sprint 1: project setup, authentication, and database connection
- Sprint 2: task management module and basic dashboard
- Sprint 3: admin/user access control and analytics
- Sprint 4: profile flow, UI refinement, password reset flow, and deployment readiness

## Core Features

- Shared landing page with register/login card
- JWT-based authentication
- Protected dashboard
- Role-based task access for Admin and User
- Task create, edit, delete, search, filter, and status tracking
- Employee profile management
- Dashboard analytics for progress and workload
- Forgot password and reset password flow

## Tech Stack

- Frontend: Next.js
- Backend: Node.js + Express
- Database: MongoDB
- Authentication: JWT + bcryptjs

## Project Structure

```text
digital-talent-management-system/
  client/
  server/
```

## Local Setup

### 1. Backend

```powershell
cd server
npm.cmd install
```

Create `server/.env` from `server/.env.example`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dtms
JWT_SECRET=replace_with_a_secure_secret
FRONTEND_URL=http://localhost:3000
EXPOSE_RESET_URL=true
```

Run the backend:

```powershell
node server.js
```

Expected output:

```text
Server running on port 5000
MongoDB connected
```

### 2. Frontend

```powershell
cd client
npm.cmd install
```

Create `client/.env.local` from `client/.env.local.example` if needed:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the frontend:

```powershell
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Auth Flow

- `/` is the main landing page and auth entry point
- register and login are handled inside the same auth card
- `/login` redirects to `/?mode=login`
- `/register` redirects to `/`
- logout returns the user to `/`

## Main API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Health

- `GET /api/health`

## Testing Checklist

- Register from the landing page
- Login from the landing page
- Confirm dashboard opens after login
- Refresh dashboard and confirm session is preserved
- Logout and confirm user returns to home
- Create a task
- Edit a task
- Delete a task
- Change task status
- Search and filter tasks
- Verify Admin and User role differences
- Update profile fields
- Verify analytics update properly
- Test forgot password and reset password flow

## Deployment Notes

### Backend

- Deploy backend first
- Set:
  - `PORT`
  - `MONGO_URI`
  - `JWT_SECRET`
  - `FRONTEND_URL`
  - `EXPOSE_RESET_URL=false` for production

### Frontend

- Set `NEXT_PUBLIC_API_URL` to the deployed backend URL
- Re-test:
  - landing page auth flow
  - dashboard
  - profile
  - task CRUD
  - role-based access
  - password reset

## Current Status

The project is feature-complete through Sprint 4 and is in final deployment/testing stage.
