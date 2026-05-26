# MERN Stack Task Management Application

A full-stack Task Management application with JWT authentication, role-based access control (Admin / User), and real-time Socket.io notifications.

## Stack
- **Backend**: Node.js · Express · TypeScript · MongoDB · Socket.io · JWT
- **Frontend**: React · TypeScript · Tailwind CSS · Vite · Socket.io Client

## Project Structure
```
task-manager/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.ts
│   │   ├── middleware/
│   │   │   └── auth.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   └── Task.ts
│   │   ├── routes/
│   │   │   ├── authRoutes.ts
│   │   │   └── taskRoutes.ts
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   └── taskController.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── api/
    │   │   └── axios.ts
    │   ├── components/
    │   │   ├── LoginPage.tsx
    │   │   ├── TaskList.tsx
    │   │   ├── CreateTaskModal.tsx
    │   │   └── Notification.tsx
    │   ├── context/
    │   │   └── AuthContext.tsx
    │   ├── socket/
    │   │   └── socket.ts
    │   ├── types/
    │   │   └── index.ts
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── index.html
    ├── package.json
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.ts
```

## Prerequisites
- Node.js (v18 or higher)
- MongoDB (running locally on port 27017)
- npm or yarn

## Installation & Setup

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Configure Environment Variables
The `.env` file is already created in the backend folder with:
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/taskmanager
JWT_SECRET=supersecretkey123
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Windows (if installed as service)
net start MongoDB

# Or start manually
mongod
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
npm run dev
```
Backend runs on **http://localhost:5000**

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```
Frontend runs on **http://localhost:5173**

## Test Credentials

The application auto-seeds three test users on first startup:

| Role  | Email              | Password  |
|-------|-------------------|-----------|
| Admin | admin@test.com    | admin123  |
| User  | user@test.com     | user123   |
| User  | user2@test.com    | user123   |

## Testing the Real-Time Features

1. **Open two browser tabs** (or use normal + incognito mode)
2. **Tab 1**: Log in as `user@test.com` / `user123`
3. **Tab 2**: Log in as `admin@test.com` / `admin123`
4. In the **admin tab**, click **+ New Task**
5. Enter a task title, assign to **User 1** (John Doe), and click **Create Task**
6. The **user tab** will immediately show a **real-time notification** via Socket.io
7. The assigned task appears in User 1's task list
8. User 1 can change the task status using the dropdown
9. Admin sees all tasks; users see only their own

## API Reference

### Authentication
- `POST /api/auth/login` - Login, returns JWT + user object
- `GET /api/auth/users` - List all users with role "user" (Admin only)

### Tasks
- `POST /api/tasks` - Create and assign a task (Admin only)
- `GET /api/tasks` - Get tasks (Admin: all tasks / User: assigned only)
- `PATCH /api/tasks/:id/status` - Update task status (Assigned user only)

## Socket.io Events

### Server → Client
- `task:assigned` - Emitted when a task is assigned to a user
  - Payload: Full task object with assignedTo populated
  - Only the assigned user's socket receives this event

## Features

✅ JWT-based authentication  
✅ Role-based access control (Admin / User)  
✅ Real-time notifications with Socket.io  
✅ Task creation and assignment (Admin only)  
✅ Task status updates (Assigned user only)  
✅ Responsive UI with Tailwind CSS  
✅ TypeScript for type safety  
✅ Auto-seeded test users  

## Build for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm run preview
```

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongod` or `net start MongoDB`
- Check the connection string in `.env`

### Port Already in Use
- Backend: Change `PORT` in `.env`
- Frontend: Vite will prompt to use a different port

### Socket.io Not Connecting
- Ensure backend is running on port 5000
- Check CORS settings in `backend/src/index.ts`

## License
MIT
