import { Request, Response } from "express";
import { ZodError } from "zod";
import {
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshUserToken,
  registerUser,
} from "./auth.service";
import {
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
} from "./auth.types";
import { AuthenticatedRequest } from "../../shared/middleware/authMiddleware";

export async function registerHandler(req: Request, res: Response) {
  try {
    const validatedData = registerSchema.parse(req.body);
    const result = await registerUser(validatedData);

    return res.status(201).json({
      message: "User registered successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(400).json({
      message: "Registration failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function loginHandler(req: Request, res: Response) {
  try {
    const validatedData = loginSchema.parse(req.body);
    const result = await loginUser(validatedData);

    return res.status(200).json({
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(401).json({
      message: "Login failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function refreshTokenHandler(req: Request, res: Response) {
  try {
    const validatedData = refreshSchema.parse(req.body);
    const result = await refreshUserToken(validatedData);

    return res.status(200).json({
      message: "Token refreshed successfully",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(401).json({
      message: "Refresh failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  try {
    const validatedData = logoutSchema.parse(req.body);
    const result = await logoutUser(validatedData);

    return res.status(200).json({
      message: "Logout successful",
      data: result,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({
        message: "Validation error",
        errors: error.flatten(),
      });
    }

    return res.status(400).json({
      message: "Logout failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}

export async function meHandler(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await getCurrentUser(req.user.userId);

    return res.status(200).json({
      data: user,
    });
  } catch (error) {
    return res.status(404).json({
      message: "Failed to fetch current user",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}