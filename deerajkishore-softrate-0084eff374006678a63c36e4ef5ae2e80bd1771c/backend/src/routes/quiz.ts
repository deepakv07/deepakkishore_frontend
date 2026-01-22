import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authenticate, AuthRequest } from '../middleware/auth';
import Quiz from '../models/Quiz';
import QuizSubmission from '../models/QuizSubmission';
import QuizProgress from '../models/QuizProgress';
import Activity from '../models/Activity';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get Quiz Questions
router.get('/:id/questions', async (req: AuthRequest, res: Response) => {
    try {
        const quiz = await Quiz.findById(req.params.id);

        if (!quiz) {
            res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
            return;
        }

        // Return questions without correct answers for security
        const questions = quiz.questions.map((q, index) => ({
            id: q._id?.toString() || `q${index}`,
            text: q.text,
            type: q.type,
            options: q.options,
            points: q.points,
        }));

        res.json({
            success: true,
            data: {
                id: quiz._id.toString(),
                title: quiz.title,
                description: quiz.description,
                questions,
                durationMinutes: quiz.durationMinutes,
                scheduledAt: quiz.scheduledAt,
                expiresAt: quiz.expiresAt,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Get Quiz Progress (Warnings)
router.get('/:id/progress', async (req: AuthRequest, res: Response) => {
    try {
        const quizId = req.params.id;
        const studentId = req.user!.id;

        let progress = await QuizProgress.findOne({ quizId, studentId });

        if (!progress) {
            // Create default progress if not exists
            progress = await QuizProgress.create({
                quizId,
                studentId,
                warnings: 0
            });
        }

        res.json({
            success: true,
            data: {
                warnings: progress.warnings
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Log Quiz Warning
router.post('/:id/warning', async (req: AuthRequest, res: Response) => {
    try {
        const quizId = req.params.id;
        const studentId = req.user!.id;

        let progress = await QuizProgress.findOne({ quizId, studentId });

        if (!progress) {
            progress = new QuizProgress({
                quizId,
                studentId,
                warnings: 0
            });
        }

        progress.warnings += 1;
        progress.lastWarningAt = new Date();
        await progress.save();

        res.json({
            success: true,
            data: {
                warnings: progress.warnings
            }
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Submit Quiz
router.post('/:id/submit', async (req: AuthRequest, res: Response) => {
    try {
        const { answers, questionTimings } = req.body;
        const quizId = req.params.id;
        const studentId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
            res.status(404).json({
                success: false,
                message: 'Quiz not found',
            });
            return;
        }

        // --- STRICT AI SERVICE HANDOFF ---
        try {
            console.log('🤖 Function Call: Forwarding to AI Engine...');
            const aiPayload = {
                user_id: studentId,
                quiz_id: quizId,
                quiz_title: quiz.title,
                answers: answers
            };

            const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
            const aiResponse = await fetch(`${aiServiceUrl}/submit_quiz_bulk`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(aiPayload)
            });

            if (aiResponse.ok) {
                const aiResult = await aiResponse.json() as any;
                if (aiResult.success) {
                    console.log('✅ AI Engine processed submission successfully.');

                    // Transform AI report into local submission format (if needed)
                    // The AI Engine ALREADY saved the report to 'reports' collection and likely 
                    // should have synced with 'quizsubmissions' if configured, but let's double check.
                    // Our current server.py bulk endpoint returns { success: true, report: ..., score: ... }
                    // but DOES NOT save to 'quizsubmissions' in the bulk endpoint logic we wrote (wait, did we?).
                    // Checking the code: yes, we did NOT add the specific sync to 'quizsubmissions' 
                    // in submit_quiz_bulk, only in the interactive submit_answer. 
                    // So we MUST save to local DB here using the AI's numbers.

                    const aiReport = aiResult.report;
                    const aiScore = aiResult.score;
                    const aiPercentage = aiResult.percentage;

                    // We need to map the AI results back to our schema
                    const processedAnswers = answers.map((answer: any) => {
                        // We can't easily map correctness from bulk report without parsing it deep
                        // For now, let's keep the answer list as is, trusting the summary stats
                        return { ...answer, timeSpent: answer.timeSpent || 0 };
                    });

                    // Save submission to MongoDB quizsubmissions collection (using AI stats)
                    const submission = new QuizSubmission({
                        quizId,
                        studentId,
                        answers: processedAnswers,
                        score: aiScore,
                        totalPoints: quiz.questions.length * 10, // AI uses 10 pts per Q
                        percentage: aiPercentage,
                        passed: aiPercentage >= 60,
                        correctAnswers: Math.round((aiPercentage / 100) * quiz.questions.length), // Approx
                        incorrectAnswers: quiz.questions.length - Math.round((aiPercentage / 100) * quiz.questions.length),
                        questionTimings: questionTimings || {},
                        aiProcessed: true,
                        aiReportId: aiReport._id // If we had it
                    });

                    await submission.save();

                    console.log(`✅ AI-Enhanced Quiz submission saved.`);

                    // Create activity
                    const activity = new Activity({
                        userId: studentId,
                        quizId: quizId,
                        type: 'quiz_completed',
                        title: `Completed quiz: ${quiz.title}`,
                        details: `Score: ${aiScore} (${aiPercentage.toFixed(1)}%) - AI Analyzed`,
                    });
                    await activity.save();

                    res.json({
                        success: true,
                        data: {
                            quizId: submission.quizId.toString(),
                            score: submission.score,
                            totalPoints: submission.totalPoints,
                            percentage: submission.percentage,
                            passed: submission.passed,
                            correctAnswers: submission.correctAnswers,
                            incorrectAnswers: submission.incorrectAnswers,
                        },
                    });
                    return;
                }
            } else {
                console.warn(`⚠️ AI Service returned ${aiResponse.status}, falling back to local logic.`);
            }
        } catch (aiError) {
            console.error('❌ AI Service unreachable or failed:', aiError);
            console.log('⚠️ Falling back to legacy local grading...');
        }

        // --- FALLBACK: LOCAL CALCULATION ---

        // Calculate score
        let score = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

        console.log('📝 Evaluating quiz answers (LOCAL BACKUP)...');

        const processedAnswers = answers.map((answer: { questionId: string; answer: string; timeSpent?: number }, answerIndex: number) => {
            // Try multiple ways to find the question
            let question = quiz.questions.find(
                (q) => q._id?.toString() === answer.questionId
            );

            // If not found by _id, try by index
            if (!question && answer.questionId.startsWith('q')) {
                const indexMatch = answer.questionId.match(/q(\d+)/);
                if (indexMatch) {
                    const index = parseInt(indexMatch[1]);
                    question = quiz.questions[index];
                }
            }

            // If still not found, try by array index
            if (!question && answerIndex < quiz.questions.length) {
                question = quiz.questions[answerIndex];
            }

            let isCorrect = false;

            if (question) {
                // For MCQ questions
                if (question.type === 'mcq' && question.options && question.options.length > 0) {
                    const correctAnswerValue = question.correctAnswer;

                    // Check if correctAnswer is a letter (A, B, C, D)
                    if (correctAnswerValue && ['A', 'B', 'C', 'D'].includes(correctAnswerValue)) {
                        const optionIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswerValue);
                        if (optionIndex >= 0 && optionIndex < question.options.length) {
                            const correctOptionText = question.options[optionIndex];
                            // Compare both the option text and the letter
                            isCorrect = correctOptionText === answer.answer ||
                                correctAnswerValue === answer.answer ||
                                answer.answer === correctOptionText;
                        }
                    } else if (correctAnswerValue) {
                        // CorrectAnswer is the actual option text - compare directly
                        isCorrect = correctAnswerValue.trim() === answer.answer.trim() ||
                            question.options.some(opt => opt.trim() === answer.answer.trim() && opt.trim() === correctAnswerValue.trim());
                    }
                } else if (question.type === 'aptitude') {
                    // For aptitude questions, compare directly (case-insensitive, trimmed)
                    if (question.correctAnswer && answer.answer) {
                        const correctAnswer = question.correctAnswer.trim().toLowerCase();
                        const studentAnswer = answer.answer.trim().toLowerCase();
                        isCorrect = correctAnswer === studentAnswer;
                    }
                } else if (question.type === 'descriptive') {
                    // For descriptive questions in local fallback
                    if (question.correctAnswer && answer.answer) {
                        const correctAnswer = question.correctAnswer.trim().toLowerCase();
                        const studentAnswer = answer.answer.trim().toLowerCase();
                        isCorrect = studentAnswer.includes(correctAnswer) || correctAnswer.includes(studentAnswer);
                    }
                }

                if (isCorrect) {
                    score += question.points;
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            } else {
                incorrectAnswers++;
            }

            return {
                ...answer,
                timeSpent: answer.timeSpent || 0
            };
        });

        const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
        const passed = percentage >= 60;

        // Save submission to MongoDB quizsubmissions collection
        const submission = new QuizSubmission({
            quizId,
            studentId,
            answers: processedAnswers,
            score,
            totalPoints,
            percentage,
            passed,
            correctAnswers,
            incorrectAnswers,
            questionTimings: questionTimings || {},
        });
        await submission.save();

        console.log(`✅ (Local) Quiz submission saved to MongoDB quizsubmissions collection`);

        // Create activity
        const activity = new Activity({
            userId: studentId,
            quizId: quizId,
            type: 'quiz_completed',
            title: `Completed quiz: ${quiz.title}`,
            details: `Score: ${score}/${totalPoints} (${percentage.toFixed(1)}%)`,
        });
        await activity.save();

        res.json({
            success: true,
            data: {
                quizId: submission.quizId.toString(),
                score: submission.score,
                totalPoints: submission.totalPoints,
                percentage: submission.percentage,
                passed: submission.passed,
                correctAnswers: submission.correctAnswers,
                incorrectAnswers: submission.incorrectAnswers,
            },
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            message: error.message || 'Server error',
        });
    }
});

// Get Quiz Results
router.get('/:id/results', async (req: AuthRequest, res: Response) => {
    try {
        const quizId = req.params.id;
        const studentId = req.user!.id;

        const quiz = await Quiz.findById(quizId);
        const submission = await QuizSubmission.findOne({ quizId, studentId });

        if (!quiz || !submission) {
            res.status(404).json({
                success: false,
                message: 'Quiz or submission not found',
            });
            return;
        }

        const user = await import('../models/User').then((m) => m.default.findById(studentId));

        // Check if there's an AI report linked
        let aiReportData: any = null;
        if (submission.aiProcessed && submission.aiReportId) {
            try {
                if (mongoose.connection.db) {
                    const reportsCollection = mongoose.connection.db.collection('reports');
                    aiReportData = await reportsCollection.findOne({ _id: submission.aiReportId });
                }
            } catch (err) {
                console.error("Error fetching AI report:", err);
            }
        } else if (submission.aiProcessed) {
            // Fallback: Try to find latest report for this user and quiz... 
            // but report doesn't have quizId easily accessible at top level.
            // We will rely on submission.score which was saved from AI.
        }

        // Calculate section breakdown based on actual question types
        const mcqQuestions = quiz.questions.filter(q => q.type === 'mcq');
        const aptitudeQuestions = quiz.questions.filter(q => q.type === 'aptitude');
        const descriptiveQuestions = quiz.questions.filter(q => q.type === 'descriptive');

        // Calculate correct/incorrect for each section based on answers
        let mcqCorrect = 0;
        let mcqTotal = mcqQuestions.length;
        let aptitudeCorrect = 0;
        let aptitudeTotal = aptitudeQuestions.length;
        let descriptiveCorrect = 0;
        let descriptiveTotal = descriptiveQuestions.length;

        // Calculate time spent per question array
        // Initialize with 0s for all questions
        const timePerQuestion = new Array(quiz.questions.length).fill(0);

        // Analyze answers to determine section-wise performance
        submission.answers.forEach((answer: any) => {
            const questionIndex = quiz.questions.findIndex((q, idx) =>
                q._id?.toString() === answer.questionId ||
                idx.toString() === answer.questionId ||
                `q${idx}` === answer.questionId
            );

            if (questionIndex !== -1) {
                const question = quiz.questions[questionIndex];

                // Update time spent for this question
                if (answer.timeSpent) {
                    timePerQuestion[questionIndex] = Math.round(answer.timeSpent); // Store in seconds
                }

                // Check if answer is correct
                let isCorrect = false;
                if (question.type === 'mcq' && question.options) {
                    const correctAnswerValue = question.correctAnswer;
                    if (correctAnswerValue && ['A', 'B', 'C', 'D'].includes(correctAnswerValue)) {
                        const optionIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswerValue);
                        if (optionIndex >= 0 && optionIndex < question.options.length) {
                            const correctOptionText = question.options[optionIndex];
                            isCorrect = correctOptionText === answer.answer || correctAnswerValue === answer.answer;
                        }
                    } else {
                        isCorrect = question.correctAnswer === answer.answer;
                    }
                } else if (question.type === 'aptitude') {
                    if (question.correctAnswer && answer.answer) {
                        isCorrect = question.correctAnswer.trim().toLowerCase() === answer.answer.trim().toLowerCase();
                    }
                } else if (question.type === 'descriptive') {
                    if (question.correctAnswer && answer.answer) {
                        isCorrect = answer.answer.trim().toLowerCase().includes(question.correctAnswer.trim().toLowerCase());
                    }
                }

                if (question.type === 'mcq') {
                    if (isCorrect) mcqCorrect++;
                } else if (question.type === 'aptitude') {
                    if (isCorrect) aptitudeCorrect++;
                } else if (question.type === 'descriptive') {
                    if (isCorrect) descriptiveCorrect++;
                }
            }
        });

        // Build section breakdown based on actual data
        const sectionBreakdown: any[] = [];
        if (mcqTotal > 0) {
            sectionBreakdown.push({
                name: 'MCQ',
                correct: mcqCorrect,
                total: mcqTotal,
                color: 'bg-blue-500',
            });
        }
        if (aptitudeTotal > 0) {
            sectionBreakdown.push({
                name: 'Aptitude',
                correct: aptitudeCorrect,
                total: aptitudeTotal,
                color: 'bg-indigo-500',
            });
        }
        if (descriptiveTotal > 0) {
            sectionBreakdown.push({
                name: 'Descriptive',
                correct: descriptiveCorrect,
                total: descriptiveTotal,
                color: 'bg-teal-500',
            });
        }

        // OVERRIDE WITH AI DATA IF AVAILABLE
        let finalScore = submission.score;
        let finalPercentage = submission.percentage;
        let finalRole = 'Junior Developer';
        let finalSalaryRange = '₹4.0 - ₹6.0 LPA';

        let finalCorrectAnswers = submission.correctAnswers;
        let finalIncorrectAnswers = submission.incorrectAnswers;

        if (aiReportData) {
            console.log("🔹 Using AI Report Data for Results");

            // Extract Score from Report (quiz_summary.average_score is usually 0.0-1.0)
            // But let's check the structure found in server.py
            if (aiReportData.quiz_summary) {
                const avg = aiReportData.quiz_summary.average_score || 0;
                if (avg <= 1.0) {
                    finalPercentage = avg * 100;
                    finalScore = Math.round(avg * submission.totalPoints); // Approx
                } else {
                    // If AI returned percentage directly
                    finalPercentage = avg;
                    finalScore = Math.round((avg / 100) * submission.totalPoints);
                }
            }

            // Extract Correct/Incorrect Counts
            if (aiReportData.detailed_analysis) {
                let aiCorrect = 0;
                let aiIncorrect = 0;
                aiReportData.detailed_analysis.forEach((q: any) => {
                    // Check 'effectiveness' or 'score' or 'final_score'
                    const s = q.score || q.effectiveness || q.final_score || 0;
                    if (s >= 0.6) aiCorrect++;
                    else aiIncorrect++;
                });
                // Only override if we found data
                if (aiCorrect + aiIncorrect > 0) {
                    finalCorrectAnswers = aiCorrect;
                    finalIncorrectAnswers = aiIncorrect;
                }

                // 4. Extract time per question from AI (for total duration accuracy)
                if (aiReportData.detailed_analysis && aiReportData.detailed_analysis.length === timePerQuestion.length) {
                    aiReportData.detailed_analysis.forEach((q: any, idx: number) => {
                        const t = q.time_taken || 0;
                        timePerQuestion[idx] = Math.round(t);
                    });
                }
            }

            // Extract LPA
            if (aiReportData.lpa_estimation) {
                finalRole = aiReportData.lpa_estimation.role || finalRole;
                finalSalaryRange = aiReportData.lpa_estimation.range || finalSalaryRange;
            } else if (aiReportData.market_value) { // quick_summary_view structure
                finalRole = aiReportData.market_value.estimated_role || finalRole;
                finalSalaryRange = aiReportData.market_value.salary_range || finalSalaryRange;
            }
        }

        const strongAreas: string[] = [];
        const toImprove: string[] = [];

        if (mcqTotal > 0) {
            const mcqPercentage = (mcqCorrect / mcqTotal) * 100;
            if (mcqPercentage >= 70) {
                strongAreas.push('Multiple Choice Questions');
            } else {
                toImprove.push('Multiple Choice Questions');
            }
        }

        if (aptitudeTotal > 0) {
            const aptitudePercentage = (aptitudeCorrect / aptitudeTotal) * 100;
            if (aptitudePercentage >= 70) {
                strongAreas.push('Aptitude & Reasoning');
            } else {
                toImprove.push('Aptitude & Reasoning');
            }
        }

        if (descriptiveTotal > 0) {
            const descriptivePercentage = (descriptiveCorrect / descriptiveTotal) * 100;
            if (descriptivePercentage >= 70) {
                strongAreas.push('Descriptive Questions');
            } else {
                toImprove.push('Descriptive Questions');
            }
        }

        // Use AI Report Strength/Weakness if available
        if (aiReportData && aiReportData.topic_analysis) {
            if (aiReportData.topic_analysis.strengths && aiReportData.topic_analysis.strengths.length > 0) {
                strongAreas.length = 0; // Clear local
                strongAreas.push(...aiReportData.topic_analysis.strengths);
            }
            if (aiReportData.topic_analysis.weaknesses && aiReportData.topic_analysis.weaknesses.length > 0) {
                toImprove.length = 0; // Clear local
                toImprove.push(...aiReportData.topic_analysis.weaknesses);
            }
        }

        let confidence = Math.min(95, Math.max(60, finalPercentage));

        if (!aiReportData) {
            // Only use local logic for career if NO AI report
            if (finalPercentage >= 80) {
                finalRole = 'Senior Developer';
                finalSalaryRange = '₹8.0 - ₹12.0 LPA';
            } else if (finalPercentage >= 60) {
                finalRole = 'Mid-Level Developer';
                finalSalaryRange = '₹6.0 - ₹8.0 LPA';
            }
        }

        res.json({
            success: true,
            data: {
                quizId: submission.quizId.toString(),
                studentName: user?.name || 'Student',
                score: finalScore,
                totalPoints: submission.totalPoints,
                percentage: finalPercentage,
                passed: finalPercentage >= 60,
                correctAnswers: finalCorrectAnswers,
                incorrectAnswers: finalIncorrectAnswers,
                timePerQuestion, // Add timePerQuestion array
                sectionBreakdown,
                performanceAnalysis: {
                    strongAreas: strongAreas.length > 0 ? strongAreas : ['General Knowledge'],
                    toImprove: toImprove.length > 0 ? toImprove : ['Practice More'],
                },
                questions: quiz.questions.map((q, idx) => {
                    const answer = submission.answers.find((a: any) =>
                        a.questionId === q._id?.toString() ||
                        a.questionId === idx.toString() ||
                        a.questionId === `q${idx}`
                    );

                    let isCorrect = false;
                    if (answer) {
                        if (q.type === 'mcq' && q.options) {
                            const correctAnswerValue = q.correctAnswer;
                            if (correctAnswerValue && ['A', 'B', 'C', 'D'].includes(correctAnswerValue)) {
                                const optionIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswerValue);
                                if (optionIndex >= 0 && optionIndex < q.options.length) {
                                    const correctOptionText = q.options[optionIndex];
                                    isCorrect = correctOptionText === answer.answer || correctAnswerValue === answer.answer;
                                }
                            } else {
                                isCorrect = q.correctAnswer === answer.answer;
                            }
                        } else if (q.type === 'aptitude') {
                            if (q.correctAnswer && answer.answer) {
                                isCorrect = q.correctAnswer.trim().toLowerCase() === answer.answer.trim().toLowerCase();
                            }
                        } else if (q.type === 'descriptive') {
                            if (q.correctAnswer && answer.answer) {
                                isCorrect = answer.answer.trim().toLowerCase().includes(q.correctAnswer.trim().toLowerCase());
                            }
                        }
                    }

                    return {
                        id: q._id?.toString() || `q${idx}`,
                        text: q.text,
                        userAnswer: answer ? answer.answer : 'Not Answered',
                        correctAnswer: q.correctAnswer || 'N/A',
                        isCorrect,
                        type: q.type,
                        points: q.points
                    };
                }),
                careerPrediction: {
                    role: finalRole,
                    salaryRange: finalSalaryRange,
                    confidence: Math.round(confidence),
                },
                questionTimings: submission.questionTimings || {},
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
