import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Question, QuizConfig } from './types';
import {
  getAllQuestionsSection,
  getAllQuestionsCount,
  getAllWeeklyQuestions,
  getQuestionsForWeek,
  getCourseWeekCounts,
  getTestDataQuestions,
  getTotalCourseQuestionsCount,
} from './lib/questions';
import { prepareQuizQuestions } from './lib/quiz';
import { Navbar } from './components/Navbar';
import { Dashboard } from './components/Dashboard';
import { QuestionImporter } from './components/QuestionImporter';
import { QuestionBank } from './components/QuestionBank';
import { QuizQuestion } from './components/QuizQuestion';
import { QuizResult } from './components/QuizResult';
import { QuizSetupModal } from './components/QuizSetupModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { TestDataSection } from './components/TestDataSection';

export default function App() {
  // Navigation view state
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'importer' | 'bank' | 'test_data' | 'quiz' | 'result'
  >('dashboard');
  const [importerDefaultWeek, setImporterDefaultWeek] = useState<number | 'all'>('all');

  // Stateful question repository data
  const [allQuestions, setAllQuestions] = useState<Question[]>(() => getAllQuestionsSection());
  const [weeklyQuestions, setWeeklyQuestions] = useState<Question[]>(() => getAllWeeklyQuestions());
  const [testQuestions, setTestQuestions] = useState<Question[]>(() => getTestDataQuestions());

  const allQuestionsCount = allQuestions.length;
  const weekCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let w = 1; w <= 12; w++) {
      counts[w] = weeklyQuestions.filter((q) => q.week === w).length;
    }
    return counts;
  }, [weeklyQuestions]);
  const totalWeeklyQuestions = weeklyQuestions.length;

  // Active in-memory quiz state (ephemeral, zero persistence)
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [isSubmittedForCurrent, setIsSubmittedForCurrent] = useState<boolean>(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number | null>(null);

  // In-memory quiz result view
  const [lastQuizResult, setLastQuizResult] = useState<{
    questions: Question[];
    userAnswers: Record<string, string[]>;
    totalTimeSeconds: number;
    weekLabel: string;
  } | null>(null);

  // Setup modal state
  const [setupModalTarget, setSetupModalTarget] = useState<{
    week: number | 'all' | 'test';
    availableCount: number;
    initialMode?: 'practice' | 'exam';
  } | null>(null);

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Timer effect for Exam Mode
  useEffect(() => {
    if (
      currentView !== 'quiz' ||
      !activeQuizConfig ||
      activeQuizConfig.mode !== 'exam' ||
      timerSecondsRemaining === null
    ) {
      return;
    }

    if (timerSecondsRemaining <= 0) {
      handleFinishExam();
      return;
    }

    const interval = setInterval(() => {
      setTimerSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [currentView, activeQuizConfig, timerSecondsRemaining]);

  // Start a Quiz
  const startQuiz = useCallback(
    (config: QuizConfig, customQuestionsPool?: Question[]) => {
      let pool: Question[] = [];

      if (customQuestionsPool && customQuestionsPool.length > 0) {
        pool = customQuestionsPool;
      } else if (config.week === 'test') {
        pool = testQuestions;
      } else if (config.week === 'all') {
        pool = allQuestions;
      } else {
        pool = weeklyQuestions.filter((q) => q.week === config.week);
      }

      if (pool.length === 0) {
        return;
      }

      const prepared = prepareQuizQuestions(pool, config);

      if (prepared.length === 0) {
        return;
      }

      setActiveQuizConfig(config);
      setActiveQuizQuestions(prepared);
      setCurrentQuestionIndex(0);
      setUserAnswers({});
      setIsSubmittedForCurrent(false);
      setQuizStartTime(Date.now());

      if (config.mode === 'exam' && config.timerMinutes > 0) {
        setTimerSecondsRemaining(config.timerMinutes * 60);
      } else {
        setTimerSecondsRemaining(null);
      }

      setSetupModalTarget(null);
      setCurrentView('quiz');
    },
    [allQuestions, weeklyQuestions, testQuestions]
  );

  // Delete questions in bulk or singly
  const handleDeleteQuestions = useCallback(async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);

    // Update in-memory state across all modules
    setAllQuestions((prev) => prev.filter((q) => !idSet.has(q.id)));
    setWeeklyQuestions((prev) => prev.filter((q) => !idSet.has(q.id)));
    setTestQuestions((prev) => prev.filter((q) => !idSet.has(q.id)));

    // Persist deletion to server directory files
    try {
      await fetch('/api/questions/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      console.warn('Server delete call failed, deleted in memory:', err);
    }
  }, []);

  // Quick practice launcher for a week or all questions
  const handleQuickPracticeWeek = useCallback(
    (target: number | 'all', mode: 'practice' | 'exam' = 'practice') => {
      startQuiz({
        week: target,
        mode,
        questionCount: 'all',
        order: 'sequential',
        shuffleOptions: false,
        timerMinutes: mode === 'exam' ? 30 : 0,
      });
    },
    [startQuiz]
  );

  // Open Quiz Setup Modal
  const handleOpenSetupModal = useCallback(
    (week: number | 'all', initialMode: 'practice' | 'exam' = 'practice') => {
      const count = week === 'all' ? allQuestionsCount : weekCounts[week] || 0;
      setSetupModalTarget({
        week,
        availableCount: count,
        initialMode,
      });
    },
    [allQuestionsCount, weekCounts]
  );

  // Option selection in Quiz
  const handleToggleOption = (optionText: string) => {
    const currentQ = activeQuizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    setUserAnswers((prev) => {
      const currentSelected = prev[currentQ.id] || [];

      if (currentQ.type === 'single') {
        return {
          ...prev,
          [currentQ.id]: [optionText],
        };
      } else {
        const exists = currentSelected.includes(optionText);
        const updated = exists
          ? currentSelected.filter((opt) => opt !== optionText)
          : [...currentSelected, optionText];
        return {
          ...prev,
          [currentQ.id]: updated,
        };
      }
    });
  };

  // Submit Answer (Practice Mode immediate check)
  const handleSubmitAnswer = () => {
    setIsSubmittedForCurrent(true);
  };

  // Move to next question
  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsSubmittedForCurrent(false);
    } else {
      handleFinishExam();
    }
  };

  // Move to previous question (Exam Mode)
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
      setIsSubmittedForCurrent(false);
    }
  };

  // Finish session & build review
  const handleFinishExam = () => {
    const timeSpentSeconds = Math.round((Date.now() - quizStartTime) / 1000);

    const weekLabel =
      typeof activeQuizConfig?.week === 'number'
        ? `Week ${activeQuizConfig.week}`
        : activeQuizConfig?.week === 'all'
        ? 'All Questions'
        : activeQuizConfig?.week === 'test'
        ? 'Test Data Sandbox'
        : 'Practice Session';

    setLastQuizResult({
      questions: activeQuizQuestions,
      userAnswers,
      totalTimeSeconds: timeSpentSeconds,
      weekLabel,
    });

    setCurrentView('result');
  };

  // Exit Quiz
  const handleExitQuiz = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Exit Practice Session?',
      message: 'Your current session progress will not be saved. Are you sure you want to exit?',
      confirmLabel: 'Exit Session',
      variant: 'danger',
      onConfirm: () => {
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        setCurrentView('dashboard');
      },
    });
  };

  // Retry Quiz
  const handleRetryQuiz = () => {
    if (!lastQuizResult || !activeQuizConfig) {
      setCurrentView('dashboard');
      return;
    }
    startQuiz(activeQuizConfig, lastQuizResult.questions);
  };

  // Practice a single question immediately from QuestionBank
  const handlePracticeSingle = (q: Question) => {
    startQuiz(
      {
        week: q.week || 'all',
        mode: 'practice',
        questionCount: 1,
        order: 'sequential',
        shuffleOptions: false,
        timerMinutes: 0,
      },
      [q]
    );
  };

  // Practice a filtered question set from QuestionBank
  const handlePracticeFiltered = (questionsPool: Question[]) => {
    startQuiz(
      {
        week: 'all',
        mode: 'practice',
        questionCount: 'all',
        order: 'sequential',
        shuffleOptions: false,
        timerMinutes: 0,
      },
      questionsPool
    );
  };

  const currentQ = activeQuizQuestions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation */}
      <Navbar
        currentView={
          currentView === 'quiz' || currentView === 'result' ? 'dashboard' : currentView
        }
        onNavigate={(view) => setCurrentView(view)}
        totalCourseQuestions={allQuestionsCount + totalWeeklyQuestions}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            allQuestionsCount={allQuestionsCount}
            weekCounts={weekCounts}
            onQuickPractice={handleQuickPracticeWeek}
            onOpenSetup={handleOpenSetupModal}
            onImportForWeek={(week) => {
              setImporterDefaultWeek(week);
              setCurrentView('importer');
            }}
          />
        )}

        {currentView === 'importer' && (
          <QuestionImporter
            existingQuestionsForWeek={
              importerDefaultWeek === 'all'
                ? allQuestions
                : typeof importerDefaultWeek === 'number'
                ? weeklyQuestions.filter((q) => q.week === importerDefaultWeek)
                : []
            }
            defaultWeek={importerDefaultWeek}
            onPracticeParsedQuestions={(questionsToPractice) => {
              startQuiz(
                {
                  week: importerDefaultWeek,
                  mode: 'practice',
                  questionCount: 'all',
                  order: 'sequential',
                  shuffleOptions: false,
                  timerMinutes: 0,
                },
                questionsToPractice
              );
            }}
          />
        )}

        {currentView === 'bank' && (
          <QuestionBank
            allQuestions={allQuestions}
            weeklyQuestions={weeklyQuestions}
            testQuestions={testQuestions}
            onPracticeSingle={handlePracticeSingle}
            onPracticeFiltered={handlePracticeFiltered}
            onDeleteQuestions={handleDeleteQuestions}
          />
        )}

        {currentView === 'test_data' && (
          <TestDataSection
            testQuestions={testQuestions}
            onPracticeTest={(mode) => {
              startQuiz(
                {
                  week: 'test',
                  mode,
                  questionCount: 'all',
                  order: 'sequential',
                  shuffleOptions: false,
                  timerMinutes: mode === 'exam' ? 10 : 0,
                },
                testQuestions
              );
            }}
          />
        )}

        {currentView === 'quiz' && currentQ && (
          <QuizQuestion
            question={currentQ}
            currentIndex={currentQuestionIndex}
            totalQuestions={activeQuizQuestions.length}
            mode={activeQuizConfig?.mode || 'practice'}
            weekLabel={
              typeof activeQuizConfig?.week === 'number'
                ? `Week ${activeQuizConfig.week}`
                : activeQuizConfig?.week === 'all'
                ? 'All Questions'
                : activeQuizConfig?.week === 'test'
                ? 'Test Data Sandbox'
                : 'Practice'
            }
            selectedAnswers={userAnswers[currentQ.id] || []}
            isSubmitted={isSubmittedForCurrent}
            timerSecondsRemaining={timerSecondsRemaining}
            onToggleOption={handleToggleOption}
            onSubmitAnswer={handleSubmitAnswer}
            onNextQuestion={handleNextQuestion}
            onPreviousQuestion={handlePreviousQuestion}
            onFinishExam={handleFinishExam}
            onExitQuiz={handleExitQuiz}
            isLastQuestion={currentQuestionIndex === activeQuizQuestions.length - 1}
          />
        )}

        {currentView === 'result' && lastQuizResult && (
          <QuizResult
            questions={lastQuizResult.questions}
            userAnswers={lastQuizResult.userAnswers}
            totalTimeSeconds={lastQuizResult.totalTimeSeconds}
            weekLabel={lastQuizResult.weekLabel}
            onRetry={handleRetryQuiz}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Quiz Setup Modal */}
      {setupModalTarget && (
        <QuizSetupModal
          isOpen={true}
          onClose={() => setSetupModalTarget(null)}
          onStartQuiz={(config) => startQuiz(config)}
          targetWeek={setupModalTarget.week}
          availableCount={setupModalTarget.availableCount}
          initialMode={setupModalTarget.initialMode}
        />
      )}

      {/* Global Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
