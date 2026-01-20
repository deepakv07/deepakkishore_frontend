import express, { Request, Response } from 'express';
import User from '../models/User';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const router = express.Router();

// Student Login (Password required)
router.post('/student/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            });
        }

        const user = await User.findOne({ email: email.toLowerCase(), role: 'student' });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Account not found. Please sign up first.',
            });
        }

        // Verify password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        console.log(`✅ User logged in: ${user.email} (${user.role})`);
        console.log(`📝 User found in MongoDB users collection`);

        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: user.password,
                    enrolledCourses: user.enrolledCourses || 0,
                },
                token,
            },
        });
    } catch (error: any) {
        console.error('Student login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Admin Login (Password required)
router.post('/admin/login', async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required',
            });
        }

        let user = await User.findOne({ email: email.toLowerCase(), role: 'admin' });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        // Verify password
        const isMatch = await comparePassword(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
            });
        }

        console.log(`✅ Admin logged in: ${user.email}`);
        console.log(`📝 Admin found in MongoDB users collection`);

        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: user.password,
                    permissions: user.permissions || [],
                },
                token,
            },
        });
    } catch (error: any) {
        console.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Google OAuth Login (Auto-register if new)
router.post('/google/login', async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Normalize email (lowercase and trim)
        const normalizedEmail = email.toLowerCase().trim();
        console.log(`🔐 Google OAuth login/register attempt for: ${normalizedEmail}`);

        // Check if user exists - try exact match first
        let user = await User.findOne({
            email: normalizedEmail
        });

        // If not found, try case-insensitive regex search
        if (!user) {
            user = await User.findOne({
                email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
            });
        }

        // If still not found, try with trimmed email from DB
        if (!user) {
            const allUsers = await User.find();
            const foundUser = allUsers.find(u => u.email.toLowerCase().trim() === normalizedEmail);
            if (foundUser) {
                user = foundUser;
            }
        }

        if (!user) {
            console.log(`👤 User not found, creating new account for: ${normalizedEmail}`);

            // Validate name for registration
            if (!name) {
                // If name is missing for a new user, we can't register them effectively unless we fallback
                console.log('⚠️ Name not provided for new user, using part of email');
            }

            // Create new user with Google OAuth
            const randomPassword = 'google_oauth_' + Math.random().toString(36).slice(-12) + '_' + Date.now();
            const hashedPassword = await hashPassword(randomPassword);

            user = new User({
                name: name || normalizedEmail.split('@')[0],
                email: normalizedEmail,
                password: hashedPassword,
                role: 'student',
            });
            await user.save();
            console.log(`✅ Google OAuth user newly registered: ${user.email}`);
        } else {
            console.log(`✅ Found existing user: ${user.email}`);
        }

        // User exists or was created, generate token
        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        console.log(`✅ Google OAuth login successful: ${user.email} (ID: ${user._id})`);

        res.json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    password: user.password,
                    enrolledCourses: user.enrolledCourses || 0,
                },
                token,
            },
        });
    } catch (error: any) {
        console.error('❌ Google OAuth login error:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Google OAuth Signup
router.post('/google/signup', async (req: Request, res: Response) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            return res.status(400).json({
                success: false,
                message: 'Email and name are required',
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Account already exists. Please login instead.',
            });
        }

        // Create new user with Google OAuth
        const randomPassword = 'google_oauth_' + Math.random().toString(36).slice(-12) + '_' + Date.now();
        const hashedPassword = await hashPassword(randomPassword);

        const user = new User({
            name: name || email.split('@')[0],
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'student',
        });
        await user.save();

        console.log(`✅ Google OAuth user registered: ${user.email}`);

        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    enrolledCourses: 0,
                },
                token,
            },
        });
    } catch (error: any) {
        console.error('Google OAuth signup error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Register (Student Signup)
router.post('/register', async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and password are required',
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Validate password length
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters',
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists. Please login instead.',
            });
        }

        const hashedPassword = await hashPassword(password);
        const user = new User({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'student', // Only allow student registration
        });

        await user.save();

        console.log(`✅ New user registered: ${user.email} (${user.role})`);
        console.log(`📝 User saved to MongoDB users collection`);

        const token = generateToken({
            id: user._id.toString(),
            email: user.email,
            role: user.role,
        });

        res.status(201).json({
            success: true,
            data: {
                user: {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    enrolledCourses: 0,
                },
                token,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

export default router;
