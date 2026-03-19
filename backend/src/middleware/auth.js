import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export const authMiddleware = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No autorizado' });
  }

  const token = header.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!mongoose.isValidObjectId(payload.id)) {
      return res.status(401).json({ message: 'Token invalido o expirado' });
    }

    req.user = { id: payload.id, email: payload.email, name: payload.name };
    next();
  } catch {
    return res.status(401).json({ message: 'Token invalido o expirado' });
  }
};
