import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layouts/AdminLayout';
import apiService from '../../services/api';

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
            alert('Please enter a quiz title');
            return;
        }

        if (!courseTitle || courseTitle.trim() === '') {
            alert('Please enter a course name');
            return;
        }

        if (numberOfQuestions < 1) {
            // We allow > 50 if they really want, or keep it per server rules. 
            // Server might handle it, but basic check is good.
            // User just said "input text box", removing strict max limit check if implied.
            alert('Please enter a valid number of questions (at least 1)');
            return;
        }

        if (questions.length === 0) {
            alert('Please set the number of questions first');
            return;
        }

        // Validate all questions are filled
        const emptyQuestions = questions.filter(q => !q.text || q.text.trim() === '');
        if (emptyQuestions.length > 0) {
            alert(`Please fill all ${numberOfQuestions} questions. ${emptyQuestions.length} question(s) are still empty.`);
            return;
        }

        // Validate MCQ questions have options and correct answer
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (q.type === 'MCQ') {
                if (!q.options || q.options.some(opt => !opt || opt.trim() === '')) {
                    alert(`Question ${i + 1} (MCQ) must have all 4 options filled`);
                    return;
                }
                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    alert(`Question ${i + 1} (MCQ) must have a correct answer selected`);
                    return;
                }
            } else if (q.type === 'Aptitude') {
                if (!q.correctAnswer || q.correctAnswer.trim() === '') {
                    alert(`Question ${i + 1} (Aptitude) must have a correct answer`);
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
        if (window.confirm('Are you sure you want to reset the form? All progress will be lost.')) {
            setQuizTitle('');
            setCourseTitle('');
            setCourseDescription('');
            setNumberOfQuestions(10);
            setStartDate('');
            setEndDate('');
            initializeQuestions();
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
            <div className="max-w-6xl mx-auto pb-12 md:pb-24 animate-fade-in px-4">
                {/* Tactical Header */}
                <div className="flex items-center justify-between mb-8 md:mb-12 py-4 md:py-6 border-b border-white/5">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center bg-white/2 rounded-xl md:rounded-2xl border border-white/10 text-gray-400 hover:text-white hover:border-[#FFD70044] transition-all duration-300 group"
                    >
                        <i className="fas fa-chevron-left group-hover:-translate-x-1 transition-transform"></i>
                    </button>
                    <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-pulse"></span>
                            <span className="text-[8px] md:text-[10px] font-black text-[#FFD700] uppercase tracking-[0.2em] md:tracking-[0.4em]">Quiz Management</span>
                        </div>
                        <h1 className="text-2xl md:text-4xl font-black text-white tracking-tighter uppercase whitespace-nowrap">Create <span className="text-[#FFD700]">Quiz</span></h1>
                    </div>
                    <div className="w-10 md:w-14"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12">
                    {/* Left Column: Mission Parameters */}
                    <div className="lg:col-span-4 space-y-6 md:space-y-8">
                        <div className="glass-card p-6 md:p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD70005] rounded-bl-full -mr-16 -mt-16"></div>
                            <h3 className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 md:mb-8 flex items-center gap-3">
                                <i className="fas fa-sliders-h"></i> Quiz Details
                            </h3>

                            <div className="space-y-5 md:space-y-6">
                                <div>
                                    <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3 ml-1">Course / Subject</label>
                                    <input
                                        type="text"
                                        placeholder="Course name"
                                        value={courseTitle}
                                        onChange={(e) => setCourseTitle(e.target.value)}
                                        className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/2 border border-white/10 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-sm md:text-base text-white placeholder:text-gray-700 font-bold transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3 ml-1">Quiz Title</label>
                                    <input
                                        type="text"
                                        placeholder="Quiz title"
                                        value={quizTitle}
                                        onChange={(e) => setQuizTitle(e.target.value)}
                                        className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/2 border border-white/10 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-sm md:text-base text-white placeholder:text-gray-700 font-bold transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3 ml-1">Total Questions</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={numberOfQuestions}
                                            onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 0)}
                                            className="w-full px-4 md:px-6 py-3 md:py-4 bg-white/2 border border-white/10 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-sm md:text-base text-white font-black tabular-nums transition-all"
                                        />
                                        <span className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-[8px] md:text-[10px] font-black text-gray-600 uppercase tracking-widest">PCS</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3 ml-1">Start Date</label>
                                        <input
                                            type="datetime-local"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="w-full px-3 md:px-4 py-3 md:py-4 bg-white/2 border border-white/10 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-[10px] md:text-xs text-white font-bold transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 md:mb-3 ml-1">End Date</label>
                                        <input
                                            type="datetime-local"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="w-full px-3 md:px-4 py-3 md:py-4 bg-white/2 border border-white/10 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-[10px] md:text-xs text-white font-bold transition-all [color-scheme:dark]"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Question Constructor */}
                    <div className="lg:col-span-8 space-y-6 md:space-y-8">
                        {questions.length > 0 && currentQuestion ? (
                            <div className="space-y-6 md:space-y-8">
                                {/* Navigation & Type Pulse */}
                                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                    <div className="flex flex-wrap justify-center gap-2">
                                        {questions.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setCurrentQuestionIndex(idx)}
                                                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-black text-[9px] md:text-[10px] transition-all border ${currentQuestionIndex === idx
                                                    ? 'bg-[#FFD70011] text-[#FFD700] border-[#FFD70033] shadow-[0_0_15px_#FFD70022]'
                                                    : questions[idx].text.trim() !== ''
                                                        ? 'bg-white/5 text-white border-white/10'
                                                        : 'bg-transparent text-gray-700 border-white/5 hover:border-white/20'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <span className={`px-4 py-1.5 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] border ${currentQuestion.type === 'MCQ' ? 'bg-[#00E5FF0D] text-[#00E5FF] border-[#00E5FF22]' : 'bg-[#9D4EDD0D] text-[#9D4EDD] border-[#9D4EDD22]'
                                        }`}>
                                        {currentQuestion.type} Mode
                                    </span>
                                </div>

                                {/* Main Editor Card */}
                                <div className="glass-card p-6 md:p-12 border border-white/5 shadow-2xl relative">
                                    <div className="absolute top-6 right-6 md:top-12 md:right-12 text-[#FFD700] opacity-10 text-4xl md:text-6xl font-black">
                                        {currentQuestionIndex + 1 < 10 ? `0${currentQuestionIndex + 1}` : currentQuestionIndex + 1}
                                    </div>

                                    <div className="space-y-8 md:space-y-10 relative z-10">
                                        <div>
                                            <h3 className="text-lg md:text-xl font-black text-white uppercase tracking-tighter mb-6 md:mb-8">Edit Question</h3>

                                            <div className="flex gap-4 md:gap-8 mb-8 md:mb-10 p-1 bg-white/2 rounded-xl md:rounded-2xl w-full md:w-fit border border-white/5">
                                                <button
                                                    onClick={() => updateQuestion(currentQuestionIndex, { type: 'MCQ', options: ['', '', '', ''], correctAnswer: '' })}
                                                    className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${currentQuestion.type === 'MCQ' ? 'bg-[#FFD70011] text-[#FFD700] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Multiple Choice
                                                </button>
                                                <button
                                                    onClick={() => updateQuestion(currentQuestionIndex, { type: 'Aptitude', options: undefined, correctAnswer: '' })}
                                                    className={`flex-1 md:flex-none px-4 md:px-8 py-2 md:py-3 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all ${currentQuestion.type === 'Aptitude' ? 'bg-[#FFD70011] text-[#FFD700] shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
                                                >
                                                    Aptitude
                                                </button>
                                            </div>

                                            <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 md:mb-4 ml-1">Question Content</label>
                                            <textarea
                                                rows={4}
                                                placeholder="Enter question text..."
                                                value={currentQuestion.text}
                                                onChange={(e) => updateQuestion(currentQuestionIndex, { text: e.target.value })}
                                                className="w-full px-5 md:px-8 py-4 md:py-6 bg-white/2 border border-white/10 rounded-xl md:rounded-2xl focus:border-[#FFD70044] outline-none text-base md:text-xl font-medium text-white placeholder:text-gray-800 transition-all resize-none shadow-xl"
                                            />
                                        </div>

                                        {currentQuestion.type === 'MCQ' && (
                                            <div className="space-y-6 md:space-y-8">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                                    {['A', 'B', 'C', 'D'].map((letter, idx) => (
                                                        <div key={letter} className="relative group">
                                                            <div className={`absolute left-0 top-0 bottom-0 w-10 md:w-12 bg-white/2 border-r border-white/5 rounded-l-lg md:rounded-l-xl flex items-center justify-center font-black text-[10px] md:text-xs transition-colors ${currentQuestion.correctAnswer === letter ? 'bg-[#FFD70022] text-[#FFD700] border-[#FFD70033]' : 'text-gray-600 group-hover:text-gray-400'}`}>
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
                                                                className={`w-full pl-14 md:pl-16 pr-4 md:pr-6 py-3 md:py-4 bg-white/1 border border-white/5 rounded-lg md:rounded-xl focus:border-[#FFD70044] outline-none text-sm md:text-base text-white font-bold transition-all ${currentQuestion.correctAnswer === letter ? 'border-[#FFD70044] bg-[#FFD70005]' : 'group-hover:bg-white/2'}`}
                                                            />
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 md:p-6 bg-white/2 rounded-xl md:rounded-2xl border border-white/5">
                                                    <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Select Correct:</span>
                                                    <div className="flex gap-2 md:gap-4">
                                                        {['A', 'B', 'C', 'D'].map(l => (
                                                            <button
                                                                key={l}
                                                                onClick={() => updateQuestion(currentQuestionIndex, { correctAnswer: l })}
                                                                className={`w-8 h-8 md:w-10 md:h-10 rounded-lg font-black text-xs transition-all border ${currentQuestion.correctAnswer === l ? 'bg-[#FFD700] text-[#030508] border-[#FFD700]' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}
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
                                                <label className="block text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 md:mb-4 ml-1">Correct Answer</label>
                                                <textarea
                                                    rows={3}
                                                    placeholder="Enter correct answer..."
                                                    value={currentQuestion.correctAnswer}
                                                    onChange={(e) => updateQuestion(currentQuestionIndex, { correctAnswer: e.target.value })}
                                                    className="w-full px-5 md:px-8 py-4 md:py-6 bg-white/2 border border-white/10 rounded-xl md:rounded-2xl focus:border-[#FFD70044] outline-none text-sm md:text-base text-white font-medium transition-all shadow-xl resize-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Step Navigation */}
                                <div className="flex flex-col gap-4 md:gap-6">
                                    <div className="grid grid-cols-2 gap-4 md:gap-6">
                                        <button
                                            onClick={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
                                            disabled={currentQuestionIndex === 0}
                                            className="py-4 md:py-5 bg-white/2 text-gray-500 font-black rounded-xl md:rounded-2xl hover:bg-white/5 border border-white/5 disabled:opacity-20 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] transition-all"
                                        >
                                            <i className="fas fa-chevron-left mr-2 md:mr-3"></i> Previous
                                        </button>
                                        <button
                                            onClick={() => currentQuestionIndex < questions.length - 1 && setCurrentQuestionIndex(currentQuestionIndex + 1)}
                                            disabled={currentQuestionIndex === questions.length - 1}
                                            className="py-4 md:py-5 bg-[#FFD70011] text-[#FFD700] font-black rounded-xl md:rounded-2xl border border-[#FFD70033] hover:bg-[#FFD70022] disabled:opacity-20 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] transition-all"
                                        >
                                            Next <i className="fas fa-chevron-right ml-2 md:ml-3"></i>
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 md:gap-6 pt-4 md:pt-6 border-t border-white/5">
                                        <button
                                            onClick={handleReset}
                                            disabled={loading}
                                            className="py-4 md:py-5 bg-red-500/10 text-red-500 font-black rounded-xl md:rounded-2xl border border-red-500/30 hover:bg-red-500/20 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] transition-all"
                                        >
                                            Reset
                                        </button>
                                        <button
                                            onClick={handleSubmit}
                                            disabled={loading}
                                            className="py-4 md:py-5 bg-white text-[#030508] font-black rounded-xl md:rounded-2xl hover:bg-gray-200 disabled:opacity-50 uppercase tracking-[0.2em] md:tracking-[0.3em] text-[9px] md:text-[10px] transition-all"
                                        >
                                            {loading ? <i className="fas fa-circle-notch animate-spin"></i> : 'Submit Quiz'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center p-10 md:p-20 glass-card border border-white/5 border-dashed">
                                <div className="w-16 h-16 md:w-20 md:h-20 bg-white/2 rounded-full flex items-center justify-center mb-6 md:mb-8 text-gray-700 border border-white/5">
                                    <i className="fas fa-microchip text-2xl md:text-3xl"></i>
                                </div>
                                <p className="text-gray-500 font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs">Initializing payload...</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Success Overlay */}
            {showSuccess && (
                <div className="fixed inset-0 bg-[#030508CC] backdrop-blur-3xl flex items-center justify-center z-[100] p-4 md:p-6 animate-fade-in">
                    <div className="glass-card max-w-xl w-full p-8 md:p-16 border border-[#00FF4133] shadow-[0_0_100px_#00FF410D] text-center space-y-8 md:space-y-10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00FF41] to-transparent"></div>

                        <div className="w-16 h-16 md:w-24 md:h-24 bg-[#00FF4111] text-[#00FF41] rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto text-3xl md:text-4xl border border-[#00FF4133]">
                            <i className="fas fa-check-double"></i>
                        </div>

                        <div className="space-y-3 md:space-y-4">
                            <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Success</h2>
                            <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] md:text-xs leading-relaxed max-w-xs md:max-w-sm mx-auto">
                                Quiz created successfully for {courseTitle}.
                            </p>
                        </div>

                        <div className="flex flex-col gap-3 md:gap-4 pt-4 md:pt-6">
                            <button
                                onClick={() => navigate('/admin/dashboard')}
                                className="w-full bg-[#00FF41] text-[#030508] font-black py-4 md:py-6 rounded-xl md:rounded-2xl hover:brightness-110 transition-all uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs"
                            >
                                Dashboard
                            </button>
                            <button
                                onClick={() => { setShowSuccess(false); setQuizTitle(''); navigate(0); }}
                                className="w-full bg-white/5 text-gray-400 font-black py-4 md:py-6 rounded-xl md:rounded-2xl border border-white/5 hover:bg-white/10 transition-all uppercase tracking-[0.2em] md:tracking-[0.3em] text-[10px] md:text-xs"
                            >
                                Create Another
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default CreateQuiz;
