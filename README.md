# Digital Talent Management System

Full stack internship project.

## Sprint 1 Scope

- Setup frontend and backend architecture
- Implement user registration and login
- Connect the backend to MongoDB
- Prepare the codebase for GitHub submission

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

## Features Completed In Sprint 1

- User registration API
- User login API
- Protected `GET /api/auth/me` route
- Local MongoDB connection
- Frontend register page
- Frontend login page
- Protected dashboard page

## Backend Setup

Go to the `server` folder and install dependencies:

```powershell
cd server
npm.cmd install
```

Create a `.env` file inside the `server` folder and add:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dtms
JWT_SECRET=mySuperSecretKeyForSprint1Auth2026
```

Start the backend:

```powershell
node server.js
```

Expected output:

```text
Server running on port 5000
MongoDB connected
```

## Frontend Setup

Open a second terminal and go to the `client` folder:

```powershell
cd client
npm.cmd install
npm.cmd run dev
```

Optional frontend environment file:

Create `client/.env.local` from `client/.env.local.example` if you want to change the backend URL.

Open the app at:

```text
http://localhost:3000
```

## API Endpoints

### Register

`POST /api/auth/register`

Request body:

```json
{
  "name": "Mksan",
  "email": "mksan@example.com",
  "password": "123456"
}
```

### Login

`POST /api/auth/login`

Request body:

```json
{
  "email": "mksan@example.com",
  "password": "123456"
}
```

### Current User

`GET /api/auth/me`

Header:

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

## Sprint 1 Testing Checklist

- Register a new user
- Login with the same user
- Confirm JWT token is returned
- Open the dashboard after login
- Refresh the dashboard and confirm the user stays authenticated
- Logout and confirm dashboard access is removed

## GitHub Push Steps

From the project root:

```powershell
git init
git add .
git commit -m "Sprint 1 authentication setup"
git branch -M main
git remote add origin YOUR_GITHUB_REPO_URL
git push -u origin main
```

## Next Steps

- Task management module
- Create, edit, and delete tasks
- Basic dashboard improvements
