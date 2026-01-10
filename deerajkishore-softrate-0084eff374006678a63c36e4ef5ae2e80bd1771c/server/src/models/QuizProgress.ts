import mongoose, { Schema, Document } from 'mongoose';

export interface IQuizProgress extends Document {
    quizId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    warnings: number;
    lastWarningAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const QuizProgressSchema: Schema = new Schema(
    {
        quizId: {
            type: Schema.Types.ObjectId,
            ref: 'Quiz',
            required: true,
        },
        studentId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        warnings: {
            type: Number,
            default: 0,
        },
        lastWarningAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
QuizProgressSchema.index({ quizId: 1, studentId: 1 }, { unique: true });

export default mongoose.model<IQuizProgress>('QuizProgress', QuizProgressSchema);
