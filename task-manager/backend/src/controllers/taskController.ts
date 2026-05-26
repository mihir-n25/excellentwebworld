import { Response } from "express";
import Task from "../models/Task";
import { AuthRequest } from "../middleware/auth";

let emitTaskAssigned: ((userId: string, task: object) => void) | null = null;

export const setEmitter = (fn: (userId: string, task: object) => void) => {
  emitTaskAssigned = fn;
};

export const createTask = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { title, assignedTo } = req.body;

  try {
    const task = await Task.create({ title, assignedTo });
    const populated = await task.populate("assignedTo", "name email");

    if (emitTaskAssigned) {
      emitTaskAssigned(assignedTo, populated.toObject());
    }

    res.status(201).json(populated);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const getTasks = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    let tasks;

    if (req.user?.role === "admin") {
      tasks = await Task.find().populate("assignedTo", "name email");
    } else {
      tasks = await Task.find({ assignedTo: req.user?.id }).populate(
        "assignedTo",
        "name email"
      );
    }

    res.json(tasks);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

export const updateTaskStatus = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const task = await Task.findById(id);

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    if (task.assignedTo.toString() !== req.user?.id) {
      res.status(403).json({ message: "Not authorized to update this task" });
      return;
    }

    task.status = status;
    await task.save();

    res.json(task);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
