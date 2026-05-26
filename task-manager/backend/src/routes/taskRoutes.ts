import { Router } from "express";
import {
  createTask,
  getTasks,
  updateTaskStatus,
} from "../controllers/taskController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

router.post("/", protect, adminOnly, createTask);
router.get("/", protect, getTasks);
router.patch("/:id/status", protect, updateTaskStatus);

export default router;
