import mongoose, { Schema, Document } from 'mongoose';

export interface IAnswer {
    questionId: string;
    answer: string;
}

export interface IQuizSubmission extends Document {
    quizId: mongoose.Types.ObjectId;
    studentId: mongoose.Types.ObjectId;
    answers: IAnswer[];
    score: number;
    totalPoints: number;
    percentage: number;
    passed: boolean;
    correctAnswers: number;
    incorrectAnswers: number;
    questionTimings?: Record<string, number>;
    submittedAt: Date;
    createdAt: Date;
    updatedAt: Date;
    aiProcessed?: boolean;
    aiReportId?: mongoose.Types.ObjectId;
    estimatedLPA?: string;
    jobReadiness?: any;
}

const AnswerSchema: Schema = new Schema({
    questionId: {
        type: String,
        required: true,
    },
    answer: {
        type: String,
        required: true,
    },
    timeSpent: {
        type: Number,
        default: 0,
    },
});

const QuizSubmissionSchema: Schema = new Schema(
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
        answers: [AnswerSchema],
        score: {
            type: Number,
            default: 0,
        },
        totalPoints: {
            type: Number,
            default: 0,
        },
        percentage: {
            type: Number,
            default: 0,
        },
        passed: {
            type: Boolean,
            default: false,
        },
        correctAnswers: {
            type: Number,
            default: 0,
        },
        incorrectAnswers: {
            type: Number,
            default: 0,
        },
        questionTimings: {
            type: Map,
            of: Number,
            default: {},
        },
        submittedAt: {
            type: Date,
            default: Date.now,
        },
        // AI Integration Fields
        aiProcessed: {
            type: Boolean,
            default: false
        },
        aiReportId: {
            type: Schema.Types.ObjectId,
            required: false
        },
        estimatedLPA: {
            type: String,
            required: false
        },
        jobReadiness: {
            type: Schema.Types.Mixed,
            required: false
        }
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
QuizSubmissionSchema.index({ quizId: 1, studentId: 1 });

export default mongoose.model<IQuizSubmission>('QuizSubmission', QuizSubmissionSchema);
