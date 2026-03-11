import { randomUUID, createHash } from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  createRefreshToken,
  createUser,
  deleteExpiredRefreshTokens,
  deleteRefreshToken,
  findRefreshToken,
  findUserByEmail,
  findUserById,
} from "./auth.repository";
import { JwtPayload, LoginInput, LogoutInput, RefreshInput, RegisterInput } from "./auth.types";

type TokenExpiry = "15m" | "7d" | "1h" | "30m";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "access_secret";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "refresh_secret";
const ACCESS_EXPIRES_IN: TokenExpiry = (process.env.JWT_ACCESS_EXPIRES_IN as TokenExpiry) || "15m";

const REFRESH_EXPIRES_IN: TokenExpiry = (process.env.JWT_REFRESH_EXPIRES_IN as TokenExpiry) || "7d";

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getRefreshTokenExpiryDate() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  return expiresAt;
}

function signAccessToken(payload: JwtPayload) {
  return jwt.sign(payload, ACCESS_SECRET as string, {
    expiresIn: ACCESS_EXPIRES_IN,
  });
}

function signRefreshToken(payload: JwtPayload) {
  return jwt.sign(payload, REFRESH_SECRET as string, {
    expiresIn: REFRESH_EXPIRES_IN,
  });
}

export async function registerUser(data: RegisterInput) {
  const existingUser = await findUserByEmail(data.email);

  if (existingUser) {
    throw new Error("Email is already registered");
  }

  const passwordHash = await bcrypt.hash(data.password, 10);

  const user = await createUser({
    id: randomUUID(),
    email: data.email,
    password_hash: passwordHash,
  });

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await createRefreshToken({
    id: randomUUID(),
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshTokenExpiryDate(),
  });

  return {
    user,
    accessToken,
    refreshToken,
  };
}

export async function loginUser(data: LoginInput) {
  const user = await findUserByEmail(data.email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(data.password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await deleteExpiredRefreshTokens();

  await createRefreshToken({
    id: randomUUID(),
    user_id: user.id,
    token_hash: hashToken(refreshToken),
    expires_at: getRefreshTokenExpiryDate(),
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at,
    },
    accessToken,
    refreshToken,
  };
}

export async function refreshUserToken(data: RefreshInput) {
  let decoded: JwtPayload;

  try {
    decoded = jwt.verify(data.refreshToken, REFRESH_SECRET) as JwtPayload;
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const storedToken = await findRefreshToken(hashToken(data.refreshToken));

  if (!storedToken) {
    throw new Error("Refresh token not found");
  }

  if (new Date(storedToken.expires_at) < new Date()) {
    await deleteRefreshToken(hashToken(data.refreshToken));
    throw new Error("Refresh token expired");
  }

  const user = await findUserById(decoded.userId);

  if (!user) {
    throw new Error("User not found");
  }

  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
  };

  const accessToken = signAccessToken(payload);

  return {
    accessToken,
  };
}

export async function logoutUser(data: LogoutInput) {
  const deleted = await deleteRefreshToken(hashToken(data.refreshToken));

  if (!deleted) {
    throw new Error("Refresh token not found");
  }

  return {
    success: true,
  };
}

export async function getCurrentUser(userId: string) {
  const user = await findUserById(userId);

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
