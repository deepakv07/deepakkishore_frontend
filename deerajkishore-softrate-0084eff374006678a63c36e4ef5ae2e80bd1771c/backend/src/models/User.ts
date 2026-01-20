import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'admin';
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    yearOfStudy?: string;
    degree?: string;

    enrolledCourses?: number;
    permissions?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['student', 'admin'],
            required: true,
        },
        avatar: {
            type: String,
        },
        firstName: {
            type: String,
            trim: true,
        },
        lastName: {
            type: String,
            trim: true,
        },
        phone: {
            type: String,
            trim: true,
        },
        department: {
            type: String,
            trim: true,
        },
        yearOfStudy: {
            type: String,
            trim: true,
        },
        degree: {
            type: String,
            trim: true,
        },

        enrolledCourses: {
            type: Number,
            default: 0,
        },
        permissions: {
            type: [String],
            default: [],
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<IUser>('User', UserSchema);
