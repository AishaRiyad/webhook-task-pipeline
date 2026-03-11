import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JwtPayload } from "../../modules/auth/auth.types";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  const token = authHeader.substring(7);

  if (!token) {
    return res.status(401).json({
      message: "Authorization token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    if (
      typeof decoded !== "object" ||
      !("userId" in decoded) ||
      !("email" in decoded)
    ) {
      return res.status(401).json({
        message: "Invalid token payload",
      });
    }

    req.user = {
      userId: String(decoded.userId),
      email: String(decoded.email),
    };

    return next();
  } catch {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
}