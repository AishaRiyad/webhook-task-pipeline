
import { Router } from "express";
import {
  loginHandler,
  logoutHandler,
  meHandler,
  refreshTokenHandler,
  registerHandler,
} from "./auth.controller";
import { authenticate } from "../../shared/middleware/authMiddleware";

const router = Router();


/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 */
router.post("/register", registerHandler);
/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login and receive access token
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginHandler);
router.post("/refresh", refreshTokenHandler);
router.post("/logout", logoutHandler);
router.get("/me", authenticate, meHandler);

export default router;

