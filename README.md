# Digital Talent Management System

Full stack internship project for authentication, task management, role-based access, profile management, and dashboard analytics.

## Scope

### Sprint 1

- Setup frontend and backend architecture
- Implement user registration and login
- Connect the backend to MongoDB

### Sprint 2

- Build Task Management module
- Implement create, edit, and delete tasks
- Develop basic dashboard

### Sprint 3

- Implement role-based access for Admin and User
- Add task status tracking improvements
- Develop basic analytics such as task count and completion rate

### Sprint 4

- Refine dashboard and profile experience
- Improve final UI polish and usability
- Prepare frontend and backend for deployment

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

## Features Added In Sprint 1

- User registration API
- User login API
- Protected `GET /api/auth/me` route
- Local MongoDB connection
- Frontend register page
- Frontend login page
- Protected dashboard page

## Features Added In Sprint 2

- Task model and protected task APIs
- Create task form in dashboard
- Task listing in dashboard
- Edit task functionality
- Delete task functionality
- Task status update
- Task search and status filtering
- Basic dashboard overview cards

## Features Added In Sprint 3

- Admin and user role-based task access
- Admin visibility of all tasks with owner information
- Status-only control for admin on tasks owned by other users
- Basic analytics for total, pending, completed, in-progress, and overdue tasks
- Completion rate and progress overview in the dashboard

## Features Added In Sprint 4

- Employee profile page with department, designation, skills, and joined date
- Profile-aware dashboard sections and talent profile snapshot
- Forgot password and reset password flow
- Refined dashboard layout, task filtering, spacing, and action handling
- Deployment-ready frontend and backend environment examples

## Backend Setup

Go to the `server` folder and install dependencies:

```powershell
cd server
npm.cmd install
```

Create a `.env` file inside the `server` folder from `server/.env.example` and add:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/dtms
JWT_SECRET=mySuperSecretKeyForSprint1Auth2026
FRONTEND_URL=http://localhost:3000
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

### Login

`POST /api/auth/login`

### Current User

`GET /api/auth/me`

Header:

```text
Authorization: Bearer YOUR_TOKEN_HERE
```

### Profile

`PUT /api/auth/profile`

### Password Recovery

`POST /api/auth/forgot-password`

`POST /api/auth/reset-password`

### Tasks

`GET /api/tasks`

`POST /api/tasks`

`PUT /api/tasks/:id`

`DELETE /api/tasks/:id`

### Health Check

`GET /api/health`

## Testing Checklist

- Register a new user
- Login with the same user
- Confirm JWT token is returned
- Open the dashboard after login
- Refresh the dashboard and confirm the user stays authenticated
- Logout and confirm dashboard access is removed
- Create a task
- Edit a task
- Delete a task
- Change task status
- Use search and status filters in the dashboard
- Verify Admin and User role differences
- Verify task analytics and completion rate
- Verify profile update flow
- Verify forgot password and reset password flow

## Deployment Notes

- Deploy the backend first and set `FRONTEND_URL` to the live frontend URL.
- Set `NEXT_PUBLIC_API_URL` in the frontend to the deployed backend URL.
- Re-test login, dashboard, profile, tasks, and password reset after both deployments are live.
