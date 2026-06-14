import jwt from 'jsonwebtoken';

const SECRET = process.env.SECRET_KEY || process.env.JWT_SECRET || 'dev-secret';
const EXPIRES = `${process.env.JWT_EXPIRES_MIN || 1440}m`;

export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
}

export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}
