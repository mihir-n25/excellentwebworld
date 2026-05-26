import { Router } from "express";
import { login, logout, refreshAccessToken, getUsers } from "../controllers/authController";
import { protect, adminOnly } from "../middleware/auth";

const router = Router();

router.post("/login", login);
router.post("/logout", logout);
router.post("/refresh", refreshAccessToken);
router.get("/users", protect, adminOnly, getUsers);

export default router;
