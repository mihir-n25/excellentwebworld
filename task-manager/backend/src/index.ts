import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db";
import authRoutes from "./routes/authRoutes";
import taskRoutes from "./routes/taskRoutes";
import { setEmitter } from "./controllers/taskController";
import User from "./models/User";
import bcrypt from "bcryptjs";

dotenv.config();
connectDB();

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
    credentials: true,
  },
});

const userSocketMap: Record<string, string> = {};

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  socket.on("disconnect", () => {
    if (userId) {
      delete userSocketMap[userId];
    }
  });
});

setEmitter((userId: string, task: object) => {
  const socketId = userSocketMap[userId];
  if (socketId) {
    io.to(socketId).emit("task:assigned", task);
  }
});

app.use(cors({ 
  origin: "http://localhost:5173",
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const seedUsers = async () => {
  try {
    const adminExists = await User.findOne({ email: "admin@test.com" });
    if (!adminExists) {
      const hashedAdmin = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Admin",
        email: "admin@test.com",
        password: hashedAdmin,
        role: "admin",
      });
    }

    const userExists = await User.findOne({ email: "user@test.com" });
    if (!userExists) {
      const hashedUser = await bcrypt.hash("user123", 10);
      await User.create({
        name: "John Doe",
        email: "user@test.com",
        password: hashedUser,
        role: "user",
      });
    }

    const user2Exists = await User.findOne({ email: "user2@test.com" });
    if (!user2Exists) {
      const hashedUser2 = await bcrypt.hash("user123", 10);
      await User.create({
        name: "Jane Smith",
        email: "user2@test.com",
        password: hashedUser2,
        role: "user",
      });
    }

    console.log("Seed users ready");
  } catch (error) {
    console.error("Seeding error:", error);
  }
};

seedUsers();

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
