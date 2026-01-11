import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';
import ValidationModal from '../../components/common/ValidationModal';

interface QuestionDraft {
    id: number;
    text: string;
    type: 'MCQ' | 'Aptitude';
    options?: string[];
    correctAnswer?: string;
    points: number;
}

const CreateQuiz: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);



    // Form State
    const [quizTitle, setQuizTitle] = useState('');
    const [courseDescription, setCourseDescription] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    // Removed selectedCourseId and availableCourses as we now allow free text entry
    const [numberOfQuestions, setNumberOfQuestions] = useState<number>(10);
    const [questions, setQuestions] = useState<QuestionDraft[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [durationMinutes, setDurationMinutes] = useState<number>(30);
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [expiryTime, setExpiryTime] = useState('');

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'error' | 'warning' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

    const showModal = (message: string, type: 'error' | 'warning' | 'success' = 'error', title?: string) => {
        setModalConfig({
            isOpen: true,
            message,
            type,
            title: title || (type === 'error' ? 'Validation Error' : type === 'success' ? 'Success' : 'Warning')
        });
    };

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };



    useEffect(() => {
        // loadCourses(); // No longer needed to fetch specific list for dropdown
    }, []);

    useEffect(() => {
        // Initialize questions when numberOfQuestions changes
        initializeQuestions();
    }, [numberOfQuestions]);



    const initializeQuestions = () => {
        const newQuestions: QuestionDraft[] = Array.from({ length: numberOfQuestions }, (_, i) => {
            const id = i + 1;
            // All questions default to MCQ
            const type: 'MCQ' | 'Aptitude' = 'MCQ';

            return {
                id,
                text: '',
                type,
                options: type === 'MCQ' ? ['', '', '', ''] : undefined,
                correctAnswer: '',
                points: 10,
            };
        });
        setQuestions(newQuestions);
        setCurrentQuestionIndex(0);
    };

    const updateQuestion = (index: number, updates: Partial<QuestionDraft>) => {
        const newQuestions = [...questions];
        newQuestions[index] = { ...newQuestions[index], ...updates };
        setQuestions(newQuestions);
    };

    const handleSubmit = async () => {
        // Validation
        if (!quizTitle || quizTitle.trim() === '') {
            showModal('Please enter a quiz title');
            return;
        }

        if (!courseTitle || courseTitle.trim() === '') {
            showModal('Please enter a course name');
            return;
        }

        if (numberOfQuestions < 1) {
            showModal('Please enter a valid number of questions (at least 1)');
            return;
        }

        if (questions.length === 0) {
            showModal('Please set the number of questions first');
            return;
        }

        // Validate all questions are filled
        const emptyQuestions = questions.filter(q => !q.text || q.text.trim() === '');
        if (emptyQuestions.length > 0) {
            showModal(`Please fill all ${numberOfQuestions} questions. ${emptyQuestions.length} question(s) are still empty.`);
            return;
        }

        // Validate MCQ questions have options and correct answer
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (q.type === 'MCQ') {
                const filledOptions = q.options?.filter(opt => opt && opt.trim() !== '') || [];

                if (filledOptions.length < 2) {
                    showModal(`Question ${i + 1} (MCQ) must have at least 2 options filled along with correct answer`);
                    return;
                }

                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    showModal(`Question ${i + 1} (MCQ) must have a correct answer selected`);
                    return;
                }

                // Ensure the correct answer corresponds to a filled option
                // If correctAnswer is 'A', 'B' etc, check if that index has a value
                if (['A', 'B', 'C', 'D'].includes(q.correctAnswer)) {
                    const idx = ['A', 'B', 'C', 'D'].indexOf(q.correctAnswer);
                    if (!q.options || !q.options[idx] || q.options[idx].trim() === '') {
                        showModal(`For Question ${i + 1}, you selected Option ${q.correctAnswer} as correct, but that option is empty.`);
                        return;
                    }
                }

            } else if (q.type === 'Aptitude') {
                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    showModal(`Question ${i + 1} (Aptitude) must have a correct answer`);
                    return;
                }
            }
        }

        // Prepare questions
        const validQuestions = questions.map(q => {
            let correctAnswer = q.correctAnswer || '';

            // For MCQ, if correctAnswer is a letter (A, B, C, D), get the actual option text
            if (q.type === 'MCQ' && q.options && ['A', 'B', 'C', 'D'].includes(correctAnswer)) {
                const optionIndex = ['A', 'B', 'C', 'D'].indexOf(correctAnswer);
                if (optionIndex >= 0 && optionIndex < q.options.length) {
                    correctAnswer = q.options[optionIndex];
                }
            }

            return {
                text: q.text.trim(),
                type: q.type === 'MCQ' ? 'mcq' : 'aptitude',
                options: q.type === 'MCQ' ? q.options?.filter(opt => opt && opt.trim() !== '') : undefined,
                correctAnswer: correctAnswer.trim(),
                points: q.points || 10,
            };
        });

        // Warn if count mismatches but proceed if user edited questions manually? 
        // Logic relies on 'questions' array length. numberOfQuestions input might be changed without re-init.
        // We should explicitly use questions.length as the truth.
        // But let's check basic consistency.
        if (validQuestions.length !== questions.length) {
            // This case is rare unless bug.
            showModal('Error processing questions. Please try again.', 'error');
            return;
        }


        setLoading(true);
        try {
            let courseId = '';

            // Try to find existing course by title or create it
            try {
                const existingCourses = await apiService.getCourses();
                const cleanTitle = courseTitle.trim();
                // Case insensitive match
                const existingCourse = existingCourses.find((c: any) => c.title.toLowerCase() === cleanTitle.toLowerCase());

                if (existingCourse) {
                    courseId = existingCourse.id;
                } else {
                    // Create the course if it doesn't exist
                    console.log(`Creating new course: ${cleanTitle}`);
                    const newCourse = await apiService.createCourse({
                        title: cleanTitle,
                        instructor: 'Admin',
                        description: courseDescription || `Course for ${cleanTitle}`,
                    });
                    courseId = newCourse.id;
                }
            } catch (err: any) {
                console.error('Error handling course:', err);
                const errorMsg = err?.response?.data?.message || err?.message || 'Failed to create or find course';
                alert(`Course Error: ${errorMsg}. Please try again.`);
                setLoading(false);
                return;
            }

            // Validate courseId is present
            if (!courseId) {
                showModal('Failed to obtain a valid Course ID. Please try again.');
                setLoading(false);
                return;
            }

            // Validate courseId format (should be MongoDB ObjectId format - 24 hex characters)
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(courseId)) {
                showModal('Invalid course ID format. Please select a valid course.');
                setLoading(false);
                return;
            }

            let scheduledAt: string | undefined = undefined;
            if (scheduledDate && scheduledTime) {
                scheduledAt = new Date(`${scheduledDate}T${scheduledTime}`).toISOString();
            }

            let expiresAt: string | undefined = undefined;
            if (expiryDate && expiryTime) {
                expiresAt = new Date(`${expiryDate}T${expiryTime}`).toISOString();

                // Validate expiry is after start
                if (scheduledAt && new Date(expiresAt) <= new Date(scheduledAt)) {
                    showModal('End time must be after start time');
                    setLoading(false);
                    return;
                }
            }


            console.log('Creating quiz with data:', {
                title: quizTitle,
                courseId,
                description: courseDescription,
                questionsCount: validQuestions.length,
                durationMinutes,
                scheduledAt,
                expiresAt
            });

            const result = await apiService.createQuiz({
                title: quizTitle,
                courseId,
                description: courseDescription,
                questions: validQuestions,
                durationMinutes,
                scheduledAt,
                expiresAt
            });

            console.log('Quiz created successfully:', result);
            setShowSuccess(true);
        } catch (err: any) {
            console.error('Error creating quiz:', err);
            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Failed to create quiz. Please check the console for details.';
            showModal(`Quiz Creation Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const currentQuestion = questions[currentQuestionIndex];

    if (showSuccess) {
        return (
            <AdminLayout>
                <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-[2.5rem] p-12 max-w-lg w-full text-center shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-4xl">
                            <i className="fas fa-check"></i>
                        </div>
                        <div className="space-y-3">
                            <h2 className="text-4xl font-black text-gray-900 tracking-tight">Quiz Created Successfully!</h2>
                            <p className="text-gray-500 font-medium px-4 leading-relaxed">
                                Your quiz has been created and saved. Students can now access this quiz from the course dashboard.
                            </p>
                        </div>

                        <div className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 flex items-center divide-x divide-gray-200">
                            <div className="flex-1 pr-6 text-center">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Total Questions</p>
                                <p className="text-4xl font-black text-gray-900">{questions.filter(q => q.text.trim() !== '').length}</p>
                            </div>
                            <div className="flex-1 pl-6 text-center">
                                <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-2">Course</p>
                                <p className="text-2xl font-black text-emerald-600 truncate">
                                    {courseTitle || 'Course'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center group"
                            >
                                <i className="fas fa-arrow-right mr-3 group-hover:translate-x-1 transition-transform"></i> Go to Dashboard
                            </button>
                            <button
                                onClick={() => {
                                    setShowSuccess(false);
                                    setQuizTitle('');
                                    setCourseDescription('');
                                    setNumberOfQuestions(10);
                                    setDurationMinutes(30);
                                    setScheduledDate('');
                                    setScheduledTime('');
                                    setExpiryDate('');
                                    setExpiryTime('');
                                    initializeQuestions();
                                }}
                                className="w-full bg-white text-gray-500 font-black py-5 rounded-2xl border-2 border-gray-100 hover:bg-gray-50 transition-all hover:border-gray-200"
                            >
                                Create Another Quiz
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <ValidationModal
                isOpen={modalConfig.isOpen}
                onClose={closeModal}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
            />
            <div className="max-w-5xl mx-auto pb-20">
                {/* Header (matching image 0) */}
                <div className="flex items-center justify-between mb-12 py-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl shadow-sm border border-gray-100 hover:bg-gray-50 transition"
                    >
                        <i className="fas fa-chevron-left text-gray-600"></i>
                    </button>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Create Course Quiz</h1>
                    <div className="w-12"></div> {/* Spacer for symmetry */}
                </div>

                <div className="space-y-10">
                    {/* Course Details Section (matching image 0) */}
                    <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50 space-y-8">
                        <div>
                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Course/Subject *</label>
                            <input
                                type="text"
                                placeholder="Enter course name (e.g., JavaScript Fundamentals)"
                                value={courseTitle}
                                onChange={(e) => setCourseTitle(e.target.value)}
                                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                            />
                            <p className="text-xs text-gray-400 mb-4 mt-2">Enter the name of the course for this quiz</p>

                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Number of Questions *</label>
                            <input
                                type="number"
                                placeholder="Enter number of questions"
                                value={numberOfQuestions}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    const count = parseInt(value);
                                    if (value === '') {
                                        // Allow clearing the input
                                        // We cast to any to allow temp empty string if needed or just handle 0
                                        setNumberOfQuestions(0);
                                    } else if (!isNaN(count)) {
                                        setNumberOfQuestions(count);
                                    }
                                }}
                                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                            />
                            <p className="text-xs text-gray-400 mt-2">This quiz will have {numberOfQuestions || 0} question{(numberOfQuestions || 0) !== 1 ? 's' : ''}</p>

                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight mt-6">Quiz Title *</label>
                            <input
                                type="text"
                                placeholder="Enter quiz title (e.g., JavaScript Basics Quiz)"
                                value={quizTitle}
                                onChange={(e) => setQuizTitle(e.target.value)}
                                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Course Description</label>
                            <textarea
                                rows={4}
                                placeholder="Enter course description"
                                value={courseDescription}
                                onChange={(e) => setCourseDescription(e.target.value)}
                                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium resize-none mb-6"
                            />

                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Quiz Duration (Minutes)</label>
                            <input
                                type="number"
                                placeholder="Enter duration in minutes"
                                value={durationMinutes}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (!isNaN(val) && val > 0) setDurationMinutes(val);
                                    else if (e.target.value === '') setDurationMinutes(0);
                                }}
                                className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium mb-6"
                            />

                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Schedule Quiz (Optional)</label>
                            <div className="flex gap-4">
                                <input
                                    type="date"
                                    value={scheduledDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setScheduledDate(e.target.value)}
                                    className="flex-1 px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-600"
                                />
                                <input
                                    type="time"
                                    value={scheduledTime}
                                    onChange={(e) => setScheduledTime(e.target.value)}
                                    className="flex-1 px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-600"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2 mb-6">Leave blank to make quiz available immediately</p>

                            <label className="block text-sm font-black text-gray-800 mb-3 ml-1 tracking-tight">Quiz Ends At (Optional)</label>
                            <div className="flex gap-4">
                                <input
                                    type="date"
                                    value={expiryDate}
                                    min={scheduledDate || new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    className="flex-1 px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-600"
                                />
                                <input
                                    type="time"
                                    value={expiryTime}
                                    onChange={(e) => setExpiryTime(e.target.value)}
                                    className="flex-1 px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-medium text-gray-600"
                                />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">Leave blank for no expiration</p>

                        </div>
                    </div>

                    {/* Progress Info (matching image 1) */}
                    {questions.length > 0 && currentQuestion && (
                        <div className="space-y-4 px-2">
                            <div className="flex justify-between items-end">
                                <span className="text-sm font-black text-gray-400 tracking-tight uppercase">Question {currentQuestionIndex + 1} of {questions.length}</span>
                                <span className={`text-xs px-4 py-1.5 rounded-xl font-black uppercase tracking-widest ${currentQuestion.type === 'MCQ' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                    {currentQuestion.type === 'MCQ' ? 'MCQ' : 'APTITUDE'}
                                </span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div
                                    className="bg-blue-600 h-full transition-all duration-700 ease-out"
                                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Question Editor Card (matching image 1 & 2) */}
                    {questions.length > 0 && currentQuestion && (
                        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-xl shadow-gray-100/50">
                            <div className="flex justify-between items-center mb-10">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Question {currentQuestion.id}</h3>
                                <span className={`text-[10px] px-3 py-1 rounded-lg font-black uppercase tracking-widest ${currentQuestion.type === 'MCQ' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                    }`}>
                                    {currentQuestion.type === 'MCQ' ? 'MCQ' : 'APTITUDE'}
                                </span>
                            </div>

                            <div className="space-y-8">
                                {/* Question Type Selector (Available for ALL questions) */}
                                <div>
                                    <label className="block text-xs font-black text-gray-400 mb-4 uppercase tracking-widest">Question Type *</label>
                                    <div className="flex space-x-10">
                                        <label className="flex items-center cursor-pointer group">
                                            <input
                                                type="radio"
                                                className="hidden"
                                                checked={currentQuestion.type === 'MCQ'}
                                                onChange={() => {
                                                    updateQuestion(currentQuestionIndex, {
                                                        type: 'MCQ',
                                                        options: ['', '', '', ''],
                                                        correctAnswer: ''
                                                    });
                                                }}
                                            />
                                            <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${currentQuestion.type === 'MCQ' ? 'border-blue-600 bg-blue-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                                {currentQuestion.type === 'MCQ' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-sm font-bold ${currentQuestion.type === 'MCQ' ? 'text-gray-900' : 'text-gray-500'}`}>MCQ Type</span>
                                        </label>
                                        <label className="flex items-center cursor-pointer group">
                                            <input
                                                type="radio"
                                                className="hidden"
                                                checked={currentQuestion.type === 'Aptitude'}
                                                onChange={() => {
                                                    updateQuestion(currentQuestionIndex, {
                                                        type: 'Aptitude',
                                                        options: undefined,
                                                        correctAnswer: ''
                                                    });
                                                }}
                                            />
                                            <div className={`w-6 h-6 rounded-full border-2 mr-3 flex items-center justify-center transition-all ${currentQuestion.type === 'Aptitude' ? 'border-blue-600 bg-blue-600' : 'border-gray-200 group-hover:border-gray-300'}`}>
                                                {currentQuestion.type === 'Aptitude' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                                            </div>
                                            <span className={`text-sm font-bold ${currentQuestion.type === 'Aptitude' ? 'text-gray-900' : 'text-gray-500'}`}>Aptitude Type</span>
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-gray-800 mb-3 tracking-tight">Question *</label>
                                    <textarea
                                        rows={4}
                                        placeholder="Enter your question here..."
                                        value={currentQuestion.text}
                                        onChange={(e) => updateQuestion(currentQuestionIndex, { text: e.target.value })}
                                        className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium resize-none shadow-sm"
                                    />
                                </div>

                                {/* Conditional Rendering based on Type */}
                                {currentQuestion.type === 'MCQ' && (
                                    <>
                                        <div className="space-y-4">
                                            <label className="block text-sm font-black text-gray-800 mb-4 tracking-tight">Options *</label>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                                    <div key={letter} className="relative group">
                                                        <span className="absolute left-8 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">{letter}.</span>
                                                        <input
                                                            type="text"
                                                            placeholder={`Option ${letter}`}
                                                            value={currentQuestion.options?.[idx] || ''}
                                                            onChange={(e) => {
                                                                const newOptions = [...(currentQuestion.options || [])];
                                                                newOptions[idx] = e.target.value;
                                                                updateQuestion(currentQuestionIndex, { options: newOptions });
                                                            }}
                                                            className="w-full pl-14 pr-8 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-black text-gray-800 mb-3 tracking-tight">Correct Answer *</label>
                                            <div className="relative">
                                                <select
                                                    value={currentQuestion.correctAnswer}
                                                    onChange={(e) => updateQuestion(currentQuestionIndex, { correctAnswer: e.target.value })}
                                                    className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none cursor-pointer appearance-none font-bold text-gray-700"
                                                >
                                                    <option value="">Select correct answer</option>
                                                    <option value="A">Option A</option>
                                                    <option value="B">Option B</option>
                                                    <option value="C">Option C</option>
                                                    <option value="D">Option D</option>
                                                </select>
                                                <i className="fas fa-chevron-down absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {currentQuestion.type === 'Aptitude' && (
                                    <div>
                                        <label className="block text-sm font-black text-gray-800 mb-3 tracking-tight">Approximate Correct Answer *</label>
                                        <textarea
                                            rows={4}
                                            placeholder="Enter the approximate correct answer or key points..."
                                            value={currentQuestion.correctAnswer}
                                            onChange={(e) => updateQuestion(currentQuestionIndex, { correctAnswer: e.target.value })}
                                            className="w-full px-8 py-5 bg-white border-2 border-gray-100 rounded-[1.25rem] focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all placeholder:text-gray-300 font-medium resize-none shadow-sm"
                                        />
                                        <p className="text-xs text-gray-400 mt-4 italic font-medium">Provide key points or the approximate answer for evaluation</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons (matching image 1 & 2) */}
                    {questions.length > 0 && (
                        <div className="grid grid-cols-2 gap-6">
                            <button
                                onClick={() => {
                                    if (currentQuestionIndex > 0) {
                                        setCurrentQuestionIndex(currentQuestionIndex - 1);
                                    }
                                }}
                                disabled={currentQuestionIndex === 0}
                                className={`py-5 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center transition-all ${currentQuestionIndex === 0
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                            >
                                <i className="fas fa-chevron-left mr-3"></i> Previous
                            </button>
                            <button
                                onClick={() => {
                                    if (currentQuestionIndex < questions.length - 1) {
                                        setCurrentQuestionIndex(currentQuestionIndex + 1);
                                    }
                                }}
                                className={`py-5 font-black rounded-2xl transition shadow-xl shadow-blue-100 uppercase tracking-widest flex items-center justify-center ${currentQuestionIndex === questions.length - 1
                                    ? 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                    }`}
                                disabled={currentQuestionIndex === questions.length - 1}
                            >
                                Next <i className="fas fa-chevron-right ml-3 text-sm"></i>
                            </button>
                        </div>
                    )}

                    {/* Bottom Action Buttons (matching image 2) */}
                    {questions.length > 0 && (
                        <div className="flex flex-col sm:flex-row gap-6 pt-10 border-t border-gray-100">
                            <button
                                className="flex-1 py-5 bg-white text-blue-600 border-2 border-blue-600 font-black rounded-2xl hover:bg-blue-50 transition-all flex items-center justify-center uppercase tracking-widest"
                            >
                                <i className="far fa-save mr-3"></i> Save Draft
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 transition-all flex items-center justify-center shadow-xl shadow-emerald-100 disabled:opacity-50 uppercase tracking-widest"
                            >
                                {loading ? (
                                    <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <><i className="fas fa-check mr-3"></i> Submit Quiz</>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout >
    );
};

export default CreateQuiz;
