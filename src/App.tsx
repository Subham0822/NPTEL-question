import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Attempt, Question, QuizConfig, QuizSession } from './types';
import {
  getQuestions,
  getAttempts,
  saveSession,
  addQuestions,
  updateQuestion as storageUpdateQuestion,
  deleteQuestion as storageDeleteQuestion,
  deleteQuestions as storageDeleteQuestions,
  restoreSeedQuestions as storageRestoreSeedQuestions,
  factoryReset as storageFactoryReset,
  exportDataAsJSON,
  importDataFromJSON,
  fetchDirectoryData,
} from './lib/storage';
import {
  getAllWeeksStats,
  getAllQuestionsSectionStats,
  getOverallStats,
} from './lib/statistics';
import { validateAnswers } from './lib/parser';
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
  // App views
  const [currentView, setCurrentView] = useState<
    'dashboard' | 'importer' | 'bank' | 'test_data' | 'quiz' | 'result'
  >('dashboard');
  const [importerDefaultWeek, setImporterDefaultWeek] = useState<number | 'all'>(1);

  // Core data states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  // Active Quiz State
  const [activeQuizConfig, setActiveQuizConfig] = useState<QuizConfig | null>(null);
  const [activeQuizQuestions, setActiveQuizQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string[]>>({});
  const [isSubmittedForCurrent, setIsSubmittedForCurrent] = useState<boolean>(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(0);
  const [timerSecondsRemaining, setTimerSecondsRemaining] = useState<number | null>(null);

  // Result summary storage
  const [lastQuizResult, setLastQuizResult] = useState<{
    questions: Question[];
    userAnswers: Record<string, string[]>;
    totalTimeSeconds: number;
    weekLabel: string;
  } | null>(null);

  // Setup modal state
  const [setupModalTarget, setSetupModalTarget] = useState<{
    week: number | 'all' | 'combined' | 'test';
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

  // Load questions and attempts on initial mount
  const refreshData = useCallback(() => {
    const loadedQuestions = getQuestions();
    const loadedAttempts = getAttempts();
    setQuestions(loadedQuestions);
    setAttempts(loadedAttempts);

    // Hydrate and sync with project directory storage (/data/questions.json)
    fetchDirectoryData().then((serverData) => {
      if (serverData && serverData.questions.length > 0) {
        setQuestions(serverData.questions);
        setAttempts(serverData.attempts);
      }
    });
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Derived statistics (Course questions only, test data strictly excluded)
  const weeksStats = useMemo(() => getAllWeeksStats(questions, attempts), [questions, attempts]);
  const allQuestionsStats = useMemo(() => getAllQuestionsSectionStats(questions, attempts), [questions, attempts]);
  const overallStats = useMemo(() => getOverallStats(questions, attempts), [questions, attempts]);

  // Timer countdown for Exam Mode
  useEffect(() => {
    if (currentView !== 'quiz' || timerSecondsRemaining === null) return;

    if (timerSecondsRemaining <= 0) {
      // Auto-submit exam when timer reaches 0
      handleFinishExam();
      return;
    }

    const timer = setInterval(() => {
      setTimerSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [currentView, timerSecondsRemaining]);

  // Get question pool by target type
  const getQuestionsPoolForTarget = useCallback(
    (target: number | 'all' | 'combined' | 'test'): Question[] => {
      if (typeof target === 'number') {
        return questions.filter((q) => q.source === 'course' && q.week === target);
      }
      if (target === 'all') {
        return questions.filter((q) => q.source === 'course' && (q.week === 'all' || q.week === 0));
      }
      if (target === 'combined') {
        return questions.filter((q) => q.source === 'course');
      }
      if (target === 'test') {
        return questions.filter((q) => q.source === 'test');
      }
      return questions.filter((q) => q.source === 'course');
    },
    [questions]
  );

  // Start a Quiz
  const startQuiz = useCallback(
    (config: QuizConfig, customQuestions?: Question[]) => {
      const pool = customQuestions || getQuestionsPoolForTarget(config.week);
      if (pool.length === 0) {
        alert('No questions available for this practice session.');
        return;
      }

      const prepared = prepareQuizQuestions(pool, config);
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
    [getQuestionsPoolForTarget]
  );

  // Quick Practice from Week card
  const handleQuickPracticeWeek = (weekNumber: number | 'all') => {
    const weekQuestions =
      weekNumber === 'all'
        ? questions.filter((q) => q.source === 'course' && (q.week === 'all' || q.week === 0))
        : questions.filter((q) => q.source === 'course' && q.week === weekNumber);

    if (weekQuestions.length === 0) {
      setImporterDefaultWeek(weekNumber);
      setCurrentView('importer');
      return;
    }

    startQuiz({
      week: weekNumber,
      mode: 'practice',
      questionCount: 'all',
      order: 'sequential',
      shuffleOptions: false,
      timerMinutes: 0,
    });
  };

  // Open Quiz Setup Modal
  const handleOpenSetupModal = (
    target: number | 'all' | 'combined' | 'test'
  ) => {
    const pool = getQuestionsPoolForTarget(target);
    setSetupModalTarget({
      week: target,
      availableCount: pool.length,
    });
  };

  // Toggle Option Selection in Quiz (single or multiple)
  const handleToggleOption = (optionText: string) => {
    const currentQ = activeQuizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    setUserAnswers((prev) => {
      const existing = prev[currentQ.id] || [];
      if (currentQ.type === 'single') {
        return {
          ...prev,
          [currentQ.id]: [optionText],
        };
      } else {
        const isAlreadySelected = existing.includes(optionText);
        const next = isAlreadySelected
          ? existing.filter((item) => item !== optionText)
          : [...existing, optionText];
        return {
          ...prev,
          [currentQ.id]: next,
        };
      }
    });
  };

  // Submit Answer in Practice Mode
  const handleSubmitAnswer = () => {
    const currentQ = activeQuizQuestions[currentQuestionIndex];
    if (!currentQ) return;

    const selected = userAnswers[currentQ.id] || [];
    if (selected.length === 0) return;

    setIsSubmittedForCurrent(true);
  };

  // Next Question in Quiz
  const handleNextQuestion = () => {
    if (currentQuestionIndex < activeQuizQuestions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setIsSubmittedForCurrent(false);
    } else {
      // Completed quiz!
      handleFinishExam();
    }
  };

  // Previous Question (Exam mode)
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  // Finish Exam / Quiz
  const handleFinishExam = () => {
    const totalTimeSeconds = Math.max(1, Math.round((Date.now() - quizStartTime) / 1000));
    const finalAnswers = { ...userAnswers };

    // Prepare label for results
    let weekLabel = 'Practice';
    if (typeof activeQuizConfig?.week === 'number') {
      weekLabel = `Week ${activeQuizConfig.week}`;
    } else if (activeQuizConfig?.week === 'all') {
      weekLabel = 'All Questions Section';
    } else if (activeQuizConfig?.week === 'combined') {
      weekLabel = 'Combined Course (All Modules)';
    } else if (activeQuizConfig?.week === 'test') {
      weekLabel = 'Test Data Sandbox';
    }

    setLastQuizResult({
      questions: activeQuizQuestions,
      userAnswers: finalAnswers,
      totalTimeSeconds,
      weekLabel,
    });

    setCurrentView('result');
  };

  // Exit Quiz Handler with confirm
  const handleExitQuiz = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Exit Current Practice?',
      message: 'Are you sure you want to leave this session?',
      confirmLabel: 'Yes, Exit',
      variant: 'warning',
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

  // Import Questions handler
  const handleImportSuccess = (importedCount: number, week: number | 'all') => {
    refreshData();
  };

  // Question Bank operations
  const handleUpdateQuestion = (id: string, updates: Partial<Question>) => {
    storageUpdateQuestion(id, updates);
    refreshData();
  };

  const handleDeleteQuestion = (id: string) => {
    storageDeleteQuestion(id);
    refreshData();
  };

  const handleBulkDeleteQuestions = (ids: string[]) => {
    storageDeleteQuestions(ids);
    refreshData();
  };

  const handleAddSingleQuestion = (newQ: Omit<Question, 'id' | 'createdAt'>) => {
    addQuestions([newQ]);
    refreshData();
  };

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

  const handleFactoryReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Factory Reset All Data?',
      message:
        'WARNING: This will delete all custom imported questions and all progress, restoring the original sample questions only. This action cannot be undone.',
      confirmLabel: 'Factory Reset Everything',
      variant: 'danger',
      onConfirm: () => {
        storageFactoryReset();
        refreshData();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      },
    });
  };

  const handleExportBackup = () => {
    const jsonStr = exportDataAsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nptel-cybersecurity-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (json: string) => {
    try {
      const res = importDataFromJSON(json);
      refreshData();
      alert(`Backup imported successfully! Loaded ${res.importedQuestions} questions and ${res.importedAttempts} attempts.`);
    } catch (e: any) {
      alert(`Failed to import backup: ${e?.message || 'Invalid JSON file.'}`);
    }
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
        totalCourseQuestions={overallStats.totalQuestions}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
        onFactoryReset={handleFactoryReset}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'dashboard' && (
          <Dashboard
            overallStats={overallStats}
            allQuestionsStats={allQuestionsStats}
            weeksStats={weeksStats}
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
            existingQuestions={questions}
            defaultWeek={importerDefaultWeek}
            onImportSuccess={handleImportSuccess}
            onPracticeWeek={handleQuickPracticeWeek}
            onGoToBank={() => setCurrentView('bank')}
          />
        )}

        {currentView === 'bank' && (
          <QuestionBank
            questions={questions}
            onUpdateQuestion={handleUpdateQuestion}
            onDeleteQuestion={handleDeleteQuestion}
            onBulkDeleteQuestions={handleBulkDeleteQuestions}
            onAddSingleQuestion={handleAddSingleQuestion}
            onPracticeSingle={handlePracticeSingle}
          />
        )}

        {currentView === 'test_data' && (
          <TestDataSection
            testQuestions={questions.filter((q) => q.source === 'test')}
            testAttempts={attempts.filter((a) => a.source === 'test')}
            onPracticeTest={(mode) => {
              const testPool = questions.filter((q) => q.source === 'test');
              startQuiz(
                {
                  week: 'test',
                  mode,
                  questionCount: 'all',
                  order: 'sequential',
                  shuffleOptions: false,
                  timerMinutes: mode === 'exam' ? 10 : 0,
                },
                testPool
              );
            }}
            onRefreshData={refreshData}
            onNavigateToWeek={(w) => {
              setCurrentView('dashboard');
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
                ? 'All Questions Section'
                : activeQuizConfig?.week === 'combined'
                ? 'Combined Course'
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
