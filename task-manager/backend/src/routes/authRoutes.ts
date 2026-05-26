import { Router } from "express";
import { login, getUsers } from "../controllers/authController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.get("/users", protect, adminOnly, getUsers);

export default router;
