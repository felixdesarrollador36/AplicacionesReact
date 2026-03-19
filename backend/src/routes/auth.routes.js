import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { asyncHandler } from '../utils/asyncHandler.js';
import { authMiddleware } from '../middleware/auth.js';
import { User } from '../models/index.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signToken = (user) =>
  jwt.sign(
    {
      id: user.id || user._id?.toString(),
      email: user.email,
      name: user.name,
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' },
  );

router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const exists = await User.exists({ email: normalizedEmail });
    if (exists) {
      return res.status(409).json({ message: 'El correo ya esta registrado' });
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    const user = await User.create({
      name: payload.name,
      email: normalizedEmail,
      passwordHash,
    });

    const token = signToken(user);

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  }),
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const payload = loginSchema.parse(req.body);
    const normalizedEmail = payload.email.toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).lean();

    if (!user) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const isValidPassword = await bcrypt.compare(payload.password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ message: 'Credenciales invalidas' });
    }

    const token = signToken(user);

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  }),
);

router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id)
      .select({ name: 1, email: 1, createdAt: 1 })
      .lean();

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    return res.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        created_at: user.createdAt,
      },
    });
  }),
);

export default router;
