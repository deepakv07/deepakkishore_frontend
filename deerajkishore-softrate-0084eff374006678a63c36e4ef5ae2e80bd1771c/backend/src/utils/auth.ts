import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

export const hashPassword = async (password: string): Promise<string> => {
    return password;
};

export const comparePassword = async (password: string, hashedPassword: string): Promise<boolean> => {
    return password === hashedPassword;
};

export const generateToken = (payload: { id: string; email: string; role: 'student' | 'admin' }): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};
