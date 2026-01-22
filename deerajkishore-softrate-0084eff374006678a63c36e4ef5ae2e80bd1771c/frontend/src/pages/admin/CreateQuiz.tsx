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
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [questions, setQuestions] = useState<QuestionDraft[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'error' | 'warning' | 'success';
        onConfirm?: () => void;
        confirmLabel?: string;
        showCancel?: boolean;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'error'
    });

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
            setModalConfig({
                isOpen: true,
                title: 'Data Required',
                message: 'A valid assessment title must be provided to initialize the module.',
                type: 'error'
            });
            return;
        }

        if (!courseTitle || courseTitle.trim() === '') {
            setModalConfig({
                isOpen: true,
                title: 'Mapping Error',
                message: 'Please specify a course or subject name for this assessment.',
                type: 'error'
            });
            return;
        }

        if (numberOfQuestions < 1) {
            setModalConfig({
                isOpen: true,
                title: 'Quantity Conflict',
                message: 'The assessment framework requires at least one entity to be initialized.',
                type: 'error'
            });
            return;
        }

        if (questions.length === 0) {
            setModalConfig({
                isOpen: true,
                title: 'Buffer Empty',
                message: 'Please define the number of assessment entities before Proceeding.',
                type: 'error'
            });
            return;
        }

        const emptyQuestions = questions.filter(q => !q.text || q.text.trim() === '');
        if (emptyQuestions.length > 0) {
            setModalConfig({
                isOpen: true,
                title: 'Incomplete Modules',
                message: `Please finalize all ${numberOfQuestions} entities. ${emptyQuestions.length} modules are still pending definition.`,
                type: 'error'
            });
            return;
        }

        // Validate MCQ questions have options and correct answer
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (q.type === 'MCQ') {
                if (!q.options || q.options.some(opt => !opt || opt.trim() === '')) {
                    setModalConfig({
                        isOpen: true,
                        title: 'MCQ Integrity Error',
                        message: `Entity ${i + 1} must have all 4 operational parameters (options) defined.`,
                        type: 'error'
                    });
                    return;
                }
                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    setModalConfig({
                        isOpen: true,
                        title: 'Verification Missing',
                        message: `Please specify the validated answer for Entity ${i + 1}.`,
                        type: 'error'
                    });
                    return;
                }
            } else if (q.type === 'Aptitude') {
                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    setModalConfig({
                        isOpen: true,
                        title: 'Verification Missing',
                        message: `Aptitude Entity ${i + 1} requires a validated response string.`,
                        type: 'error'
                    });
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
                options: q.type === 'MCQ' ? q.options?.map(opt => opt.trim()) : undefined,
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
            alert('Error processing questions. Please try again.');
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
                alert('Failed to obtain a valid Course ID. Please try again.');
                setLoading(false);
                return;
            }

            // Validate courseId format (should be MongoDB ObjectId format - 24 hex characters)
            const objectIdRegex = /^[0-9a-fA-F]{24}$/;
            if (!objectIdRegex.test(courseId)) {
                alert('Invalid course ID format. Please select a valid course.');
                setLoading(false);
                return;
            }

            console.log('Creating quiz with data:', {
                title: quizTitle,
                courseId,
                description: courseDescription,
                questionsCount: validQuestions.length,
                durationMinutes: 30
            });

            const result = await apiService.createQuiz({
                title: quizTitle,
                courseId,
                description: courseDescription,
                questions: validQuestions,
                startDate: startDate ? new Date(startDate).toISOString() : undefined,
                endDate: endDate ? new Date(endDate).toISOString() : undefined,
                durationMinutes: 30
            });

            console.log('Quiz created successfully:', result);
            setShowSuccess(true);
        } catch (err: any) {
            console.error('Error creating quiz:', err);
            const errorMessage = err?.response?.data?.message ||
                err?.message ||
                'Failed to create quiz. Please check the console for details.';
            alert(`Quiz Creation Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setModalConfig({
            isOpen: true,
            title: 'Reset Module?',
            message: 'Caution: You are about to clear all progress in this session. All current entity data will be purged.',
            type: 'warning',
            showCancel: true,
            confirmLabel: 'Purge Progress',
            onConfirm: () => {
                setQuizTitle('');
                setCourseTitle('');
                setCourseDescription('');
                setNumberOfQuestions(10);
                setStartDate('');
                setEndDate('');
                initializeQuestions();
                setModalConfig({ ...modalConfig, isOpen: false });
            }
        });
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
            <div className="max-w-7xl mx-auto pb-24 md:pb-32 animate-fade-in px-6">
                {/* Tactical Header */}
                <div className="flex items-center justify-between mb-12 md:mb-16 py-8 border-b border-slate-50">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-14 h-14 flex items-center justify-center bg-white rounded-2xl border border-slate-100 text-slate-400 hover:text-amber-600 hover:border-amber-200 transition-all shadow-sm group"
                    >
                        <i className="fas fa-arrow-left group-hover:-translate-x-1 transition-transform"></i>
                    </button>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-3 mb-2">
                            <span className="px-4 py-1 rounded-full bg-pastel-orange text-amber-600 text-[10px] font-bold uppercase tracking-widest border border-white">Quiz Management</span>
                        </div>
                        <h1 className="text-fluid-h2 font-extrabold text-slate-900 tracking-tight leading-none uppercase">Create <span className="text-amber-600/20">Course Quiz</span></h1>
                    </div>
                    <div className="w-14"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-14">
                    {/* Left Column: Quiz Parameters */}
                    <div className="lg:col-span-4 space-y-10">
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-50 shadow-sm relative overflow-hidden group">
                            <div className="absolute top-[-10%] right-[-10%] w-32 h-32 bg-pastel-orange opacity-20 rounded-full"></div>
                            <h3 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.4em] mb-10 flex items-center gap-4">
                                <i className="fas fa-gear opacity-40"></i> Quiz Details
                            </h3>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Course / Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Enter course name (e.g., Mathematics)"
                                        value={courseTitle}
                                        onChange={(e) => setCourseTitle(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] focus:border-amber-400 focus:bg-white outline-none text-slate-900 font-bold transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Quiz Title</label>
                                    <input
                                        type="text"
                                        placeholder="Enter quiz title (e.g., JavaScript Basics)"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.25rem] focus:border-amber-400 focus:bg-white outline-none text-slate-900 font-bold transition-all shadow-inner"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Total Questions</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={numberOfQuestions}
                                            onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 0)}
                                            className="w-full px-8 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:border-amber-400 focus:bg-white outline-none text-slate-900 font-black tabular-nums transition-all shadow-inner"
                                        />
                                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest">PCS</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-5 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:border-amber-400 outline-none text-[10px] text-slate-900 font-bold transition-all"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1">End Date</label>
                                        <input
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-5 py-5 bg-slate-50/50 border border-slate-100 rounded-[1.5rem] focus:border-amber-400 outline-none text-[10px] text-slate-900 font-bold transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Question Constructor */}
                    <div className="lg:col-span-8 space-y-10">
                        {questions.length > 0 && currentQuestion ? (
                            <div className="space-y-10">
                                {/* Navigation & Type Pulse */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-slate-50">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        {questions.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                className={`w-12 h-12 rounded-[1.25rem] font-black text-[10px] transition-all border ${currentQuestionIndex === idx
                                                    ? 'bg-amber-600 text-white border-amber-600 shadow-xl shadow-amber-200/50'
                                                    : questions[idx].text.trim() !== ''
                                                        ? 'bg-pastel-blue text-blue-600 border-white'
                                                        : 'bg-white text-slate-300 border-slate-100 hover:border-amber-200 hover:text-amber-500'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <span className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] border ${currentQuestion.type === 'MCQ' ? 'bg-pastel-blue text-blue-600 border-white' : 'bg-pastel-lavender text-indigo-600 border-white'
                                        }`}>
                                        {currentQuestion.type === 'MCQ' ? 'MCQ Mode' : 'Aptitude Mode'}
                                    </span>
                                </div>

                                {/* Main Editor Card */}
                                <div className="bg-white p-10 md:p-16 rounded-[4rem] border border-slate-50 shadow-2xl relative">
                                    <div className="absolute top-10 right-10 md:top-16 md:right-16 text-slate-50 text-8xl font-extrabold leading-none pointer-events-none">
                                        {currentQuestionIndex + 1 < 10 ? `0${currentQuestionIndex + 1}` : currentQuestionIndex + 1}
                                    </div>

                                    <div className="space-y-12 relative z-10">
                                        <div>
                                            <h3 className="text-2xl font-extrabold text-slate-900 tracking-tighter uppercase mb-8">Edit Question</h3>

                                            <div className="flex gap-4 mb-12 p-2 bg-slate-50 rounded-[2rem] w-fit border border-slate-100">
                                                <button
                                                    onClick={() => updateQuestion(currentQuestionIndex, { type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' })}
                                                    className={`px-8 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${currentQuestion.type === 'MCQ' ? 'bg-white text-amber-600 shadow-sm border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Multiple Choice
                                                </button>
                                                <button
                                                    onClick={() => updateQuestion(currentQuestionIndex, { type: 'Aptitude', options: undefined, correctAnswer: '' })}
                                                    className={`px-8 py-3 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all ${currentQuestion.type === 'Aptitude' ? 'bg-white text-amber-600 shadow-sm border border-amber-100' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    Aptitude
                                                </button>
                                            </div>

                                            <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-4 ml-1">Question Text</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Enter question text..."
                                                value={currentQuestion.text}
                                                onChange={(e) => updateQuestion(currentQuestionIndex, { text: e.target.value })}
                                                className="w-full px-8 py-6 bg-slate-50/30 border border-slate-100 rounded-[1.5rem] focus:border-amber-400 focus:bg-white outline-none text-lg font-bold text-slate-900 placeholder:text-slate-200 transition-all resize-none shadow-inner"
                                            />
                                        </div>

                                        {currentQuestion.type === 'MCQ' && (
                                            <div className="space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                                        <div key={letter} className="relative group">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-14 bg-slate-50 border-r border-slate-100 rounded-l-[1.5rem] flex items-center justify-center font-black text-sm transition-colors ${currentQuestion.correctAnswer === letter ? 'bg-pastel-orange text-amber-600' : 'text-slate-300 group-hover:text-amber-500'}`}>
                                                                {letter}
                                                            </div>
                                                            <input
                                                                type="text"
                                                                placeholder={`Option ${letter}...`}
                                                                value={currentQuestion.options?.[idx] || ''}
                                                                onChange={(e) => {
                                                                    const opt = [...(currentQuestion.options || [])];
                                                                    opt[idx] = e.target.value;
                                                                    updateQuestion(currentQuestionIndex, { options: opt });
                                                                }}
                                                                className={`w-full pl-20 pr-8 py-5 bg-white border border-slate-100 rounded-[1.5rem] focus:border-amber-400 outline-none text-sm md:text-base text-slate-900 font-bold transition-all ${currentQuestion.correctAnswer === letter ? 'border-amber-400 bg-pastel-orange/10' : 'group-hover:bg-slate-50'}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col md:flex-row items-center gap-8 p-10 bg-pastel-blue/30 rounded-[3rem] border border-white">
                                                    <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Correct Answer:</span>
                                                    <div className="flex gap-4">
                                                        {['A', 'B', 'C', 'D'].map(l => (
                                                            <button
                                                                key={l}
                                                                onClick={() => updateQuestion(currentQuestionIndex, { correctAnswer: l })}
                                                                className={`w-12 h-12 rounded-2xl font-black text-sm transition-all border ${currentQuestion.correctAnswer === l ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-200/50' : 'bg-white text-blue-300 border-white hover:border-blue-200'}`}
                                                            >
                                                                {l}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {currentQuestion.type === 'Aptitude' && (
                                            <div className="animate-fade-in">
                                                <label className="block text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 ml-1">Correct Answer</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Enter correct answer..."
                                                    value={currentQuestion.correctAnswer}
                                                    onChange={(e) => updateQuestion(currentQuestionIndex, { correctAnswer: e.target.value })}
                                                    className="w-full px-10 py-8 bg-slate-50/30 border border-slate-100 rounded-[1.5rem] focus:border-amber-400 focus:bg-white outline-none text-base md:text-xl font-bold text-slate-900 transition-all shadow-inner resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step Navigation */}
                                <div className="flex flex-col gap-8">
                                    <div className="grid grid-cols-2 gap-8">
                                        <button
                                            onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                            disabled={currentQuestionIndex === 0}
                                            className="elite-button !rounded-[2rem] !py-6 bg-slate-50 !text-slate-400 border border-slate-100 hover:bg-slate-100 disabled:opacity-20 shadow-sm"
                                        >
                                            <i className="fas fa-arrow-left text-[10px] opacity-50"></i> Previous
                                        </button>
                                        <button
                                            onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                            disabled={currentQuestionIndex === questions.length - 1}
                                            className="elite-button !rounded-[2rem] !py-6 bg-white !text-amber-600 border border-amber-100 hover:bg-pastel-orange disabled:opacity-20 shadow-sm"
                                        >
                                            Next <i className="fas fa-arrow-right text-[10px] opacity-50"></i>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-50">
                                        <button
                                            onClick={handleReset}
                                            disabled={loading}
                                            className="elite-button !rounded-[2rem] !py-6 bg-red-50 !text-red-500 border border-red-100 hover:bg-red-500 hover:!text-white shadow-sm"
                                        >
                                            Reset Form
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="elite-button !rounded-[2rem] !py-6 bg-amber-600 hover:bg-amber-700 shadow-2xl shadow-amber-200/50"
                                        >
                                            {loading ? <i className="fas fa-sync animate-spin"></i> : 'Submit Quiz'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-96 flex flex-col items-center justify-center p-20 bg-white rounded-[4rem] border border-slate-50 border-dashed">
                                <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-10 text-slate-200 border border-slate-100 animate-pulse">
                                    <i className="fas fa-brain text-4xl"></i>
                                </div>
                                <p className="text-slate-300 font-extrabold uppercase tracking-[0.4em] text-[10px]">Initializing Core Processing...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Hub Layer */}
            {showSuccess && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-fade-in">
                    <div className="bg-white/90 max-w-2xl w-full p-16 rounded-[4rem] border border-white shadow-3xl text-center space-y-12 relative overflow-hidden animate-slide-up">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 via-emerald-400 to-teal-400"></div>

                        <div className="w-28 h-28 bg-pastel-mint text-teal-600 rounded-[3rem] flex items-center justify-center mx-auto text-5xl border border-white shadow-lg">
                            <i className="fas fa-rocket"></i>
                        </div>

                        <div className="space-y-6">
                            <h2 className="text-fluid-h2 font-black text-slate-900 tracking-tighter leading-none uppercase">Quiz Created</h2>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs leading-relaxed max-w-sm mx-auto">
                                The assessment framework for <span className="text-teal-600">{courseTitle}</span> has been successfully saved.
                            </p>
                        </div>

                        <div className="flex flex-col gap-6 pt-6">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="elite-button !rounded-[2rem] !py-6 bg-teal-600 hover:bg-teal-700 shadow-2xl shadow-teal-200/50"
                            >
                                Go to Dashboard
                            </button>
                            <button
                                onClick={() => { setShowSuccess(false); setQuizTitle(''); navigate(0); }}
                                className="elite-button !rounded-[2rem] !py-6 bg-white !text-slate-400 border border-slate-100 hover:bg-slate-50 shadow-sm"
                            >
                                Create Another Quiz
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ValidationModal
                isOpen={modalConfig.isOpen}
                onClose={() => setModalConfig({ ...modalConfig, isOpen: false })}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                confirmLabel={modalConfig.confirmLabel}
                showCancel={modalConfig.showCancel}
            />
        </AdminLayout>
    );
};

export default CreateQuiz;
