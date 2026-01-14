export interface User {
    id: number;
    name: string;
    email: string;
    role: 'student' | 'admin';
    avatar?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    department?: string;
    yearOfStudy?: string;
    degree?: string;
}

export interface Student extends User {
    role: 'student';
    grade?: string;
    enrolledCourses: number;
}

export interface Admin extends User {
    role: 'admin';
    permissions: string[];
}

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData {
    name: string;
    email: string;
    password: string;
    role: 'student';
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface Question {
    id: number;
    _id?: string | number;
    text: string;
    type: 'mcq' | 'aptitude' | 'programming';
    options?: string[];
    correctAnswer?: string;
    points: number;
}

export interface Quiz {
    id: number;
    _id?: string | number;
    title: string;
    courseId: number;
    description: string;
    questions: Question[];
    durationMinutes: number;
    isCompleted?: boolean;
    score?: number;
    passed?: boolean;
}

export interface Course {
    id: number;
    title: string;
    instructor: string;
    progress: number;
    thumbnail?: string;
    totalQuizzes: number;
    completedQuizzes: number;
}

export interface StudentDashboardData {
    user: Student;
    stats: {
        totalCourses: number;
        hoursLearned: number;
        quizzesCompleted: number;
        pendingQuizzes: number;
        totalAvailableQuizzes?: number;
        averageScore?: number;
        growth?: number;
    };
    recentActivity: Activity[];
    aiJobPrediction: JobPrediction;
}

export interface AdminDashboardStats {
    totalStudents: number;
    activeCourses: number;
    avgQuizScore: number;
    totalEnrollments: number;
}

export interface Activity {
    id: number | string;
    type: 'quiz_completed' | 'course_enrolled' | 'badge_earned';
    title: string;
    timestamp: string;
    score?: number;
    startTime?: string;
    endTime?: string;
    details?: string;
}

export interface JobPrediction {
    role: string;
    confidence: number;
    salaryRange: {
        min: number;
        max: number;
    };
}

export interface SkillReport {
    studentId: number;
    skills: {
        name: string;
        score: number;
        level: 'Beginner' | 'Intermediate' | 'Advanced';
    }[];
    recommendations: string[];
}

export interface AnalyticsData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
    }[];
}

export interface APIResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface QuizSubmission {
    quizId: number | string;
    answers: {
        questionId: string;
        answer: string;
    }[];
    questionTimings?: Record<string, number>;
}

export interface QuizResult {
    quizId: number;
    studentName?: string;
    score: number;
    totalPoints: number;
    percentage: number;
    percentile?: number;
    passed: boolean;
    correctAnswers: number;
    incorrectAnswers: number;
    submittedAt?: string;
    completedDate?: string;
    timeSpent?: string;
    totalTimeSpent?: string;
    avgTime?: string;
    attempts?: number;
    timePerQuestion?: number[];
    questionTimings?: Record<string, number>;
    sectionBreakdown?: {
        name: string;
        correct: number;
        total: number;
        color: string;
    }[];
    performanceAnalysis?: {
        strongAreas: string[];
        toImprove: string[];
    };
    careerPrediction?: {
        role: string;
        salaryRange: string;
        confidence: number;
    };
    questions?: {
        id: string;
        text: string;
        userAnswer: string;
        correctAnswer: string;
        isCorrect: boolean;
        type: string;
        points: number;
        explanation?: string;
    }[];
}
