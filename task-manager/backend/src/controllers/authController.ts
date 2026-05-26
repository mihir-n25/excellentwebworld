import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";

// In-memory refresh token store (use Redis in production)
const refreshTokens = new Map<string, { userId: string; expiresAt: number }>();

const generateAccessToken = (userId: string, role: string): string => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET as string,
    { expiresIn: "15m" } // Short-lived access token
  );
};

const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString("hex");
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).json({ message: "Invalid credentials" });
      return;
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken();

    // Store refresh token (7 days expiry)
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    refreshTokens.set(refreshToken, {
      userId: user._id.toString(),
      expiresAt,
    });

    // Set HttpOnly cookie for refresh token
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/",
    });

    res.json({
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    res.status(401).json({ message: "Refresh token not found" });
    return;
  }

  const tokenData = refreshTokens.get(refreshToken);

  if (!tokenData) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }

  if (Date.now() > tokenData.expiresAt) {
    refreshTokens.delete(refreshToken);
    res.status(401).json({ message: "Refresh token expired" });
    return;
  }

  try {
    const user = await User.findById(tokenData.userId);
    if (!user) {
      refreshTokens.delete(refreshToken);
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Generate new tokens (token rotation)
    const newAccessToken = generateAccessToken(user._id.toString(), user.role);
    const newRefreshToken = generateRefreshToken();

    // Remove old refresh token
    refreshTokens.delete(refreshToken);

    // Store new refresh token
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    refreshTokens.set(newRefreshToken, {
      userId: user._id.toString(),
      expiresAt,
    });

    // Set new HttpOnly cookie
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.json({
      accessToken: newAccessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.cookies;

  if (refreshToken) {
    refreshTokens.delete(refreshToken);
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
  });

  res.json({ message: "Logged out successfully" });
};

export const getUsers = async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await User.find({ role: "user" }).select("-password");
    res.json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
