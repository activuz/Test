import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useOnboarding } from '@/app/contexts/OnboardingContext';
import { QuestionField } from '@/app/components/onboarding/QuestionField';
import { IQTestView } from '@/app/components/onboarding/IQTestView';
import { generateAIProfile } from '@/app/services/aiService';
import { Button } from '@/app/components/ui/button';
import { Progress } from '@/app/components/ui/progress';
import { ChevronLeft, Brain, User, Heart, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STAGE_ICONS = [User, Heart, Brain, Sparkles];
const STAGE_COLORS = ['#6C3CE1', '#00D4AA', '#FF6B6B', '#FFB800'];

export function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const {
    stages,
    currentStageIndex,
    currentStepIndex,
    currentFieldIndex,
    currentStage,
    currentField,
    answers,
    progressPercent,
    stageProgress,
    submitAnswer,
    goNext,
    goPrev,
    getOptionsForField,
    calculateIQScore,
    isComplete,
  } = useOnboarding();

  const [generating, setGenerating] = useState(false);

  // If not logged in, redirect
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // If onboarding already completed, go to dashboard
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard');
    }
  }, [user?.onboardingCompleted, navigate]);

  // When all stages complete, generate AI profile
  useEffect(() => {
    if (isComplete && !generating) {
      handleComplete();
    }
  }, [isComplete]);

  const handleComplete = async () => {
    setGenerating(true);
    try {
      const iqResult = calculateIQScore();
      
      toast.loading("AI sizning profilingizni yaratmoqda...", { id: 'ai-gen' });
      
      const aiProfile = await generateAIProfile(answers, iqResult);
      
      updateUser({
        onboardingCompleted: true,
        onboardingData: answers,
        iqScore: iqResult.score,
        iqLevel: iqResult.level,
        iqBreakdown: iqResult.breakdown,
        aiProfile,
      });

      localStorage.removeItem('bilim_onboarding');
      
      toast.success("Profilingiz tayyor! Dashboard ga o'tmoqdamiz...", { id: 'ai-gen' });
      
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      console.error('Profile generation error:', error);
      toast.error("Xatolik yuz berdi. Qaytadan urinib ko'ring.", { id: 'ai-gen' });
      setGenerating(false);
    }
  };

  const handleFieldSubmit = (value: any) => {
    if (!currentField) return;
    submitAnswer(currentField.field, value);
    goNext();
  };

  const handleIQSubmit = (value: string, points: number) => {
    if (!currentField) return;
    submitAnswer(currentField.field, value, points);
    goNext();
  };

  // IQ test: count which question this is
  const isIQStage = currentStage?.stage === 4;
  let iqQuestionNumber = 0;
  let totalIQQuestions = 0;
  if (isIQStage && currentStage) {
    totalIQQuestions = currentStage.steps.reduce((acc, s) => acc + s.fields.length, 0);
    for (let si = 0; si < currentStepIndex; si++) {
      iqQuestionNumber += currentStage.steps[si].fields.length;
    }
    iqQuestionNumber += currentFieldIndex + 1;
  }

  if (generating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
        <div className="text-center space-y-6 p-8 animate-in fade-in zoom-in duration-500">
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full animate-spin opacity-20" />
            <div className="absolute inset-2 bg-white rounded-full flex items-center justify-center">
              <Brain className="w-10 h-10 text-primary animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">AI profilingizni yaratmoqda...</h2>
            <p className="text-muted-foreground mt-2">Bu bir necha soniya vaqt olishi mumkin</p>
          </div>
          <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50">
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row min-h-screen">
        
        {/* Left Sidebar - Progress */}
        <div className="lg:w-80 p-6 lg:p-8 lg:border-r border-primary/5">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              BilimAi
            </span>
          </div>

          {/* Overall Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Umumiy progress</span>
              <span className="font-semibold text-primary">{progressPercent}%</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Stage Steps */}
          <nav className="space-y-2">
            {stages.map((stage, i) => {
              const Icon = STAGE_ICONS[i] || Brain;
              const isActive = i === currentStageIndex;
              const isDone = i < currentStageIndex;
              
              return (
                <div
                  key={stage.stage}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                    isActive
                      ? 'bg-white shadow-md shadow-primary/5 border border-primary/10'
                      : isDone
                      ? 'bg-primary/5 opacity-70'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      isDone ? 'bg-accent/20' : isActive ? 'bg-primary/10' : 'bg-muted'
                    }`}
                    style={{ color: isDone ? '#00D4AA' : isActive ? STAGE_COLORS[i] : undefined }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {stage.title}
                    </p>
                    {isActive && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {stageProgress}% tugallandi
                      </p>
                    )}
                  </div>
                  {isDone && (
                    <div className="w-5 h-5 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-white" fill="none" strokeWidth="3" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* Back button */}
          {(currentStageIndex > 0 || currentStepIndex > 0 || currentFieldIndex > 0) && (
            <Button
              variant="ghost"
              onClick={goPrev}
              className="mt-6 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Orqaga
            </Button>
          )}
        </div>

        {/* Right - Question Area */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-lg">
            {/* Stage Title */}
            {currentStage && (
              <div className="mb-8">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium mb-3"
                  style={{
                    backgroundColor: `${STAGE_COLORS[currentStageIndex]}15`,
                    color: STAGE_COLORS[currentStageIndex],
                  }}
                >
                  {(() => {
                    const Icon = STAGE_ICONS[currentStageIndex] || Brain;
                    return <Icon className="w-3.5 h-3.5" />;
                  })()}
                  {currentStage.title}
                </div>
              </div>
            )}

            {/* Question */}
            {currentField && (
              isIQStage ? (
                <IQTestView
                  key={currentField.id}
                  field={currentField}
                  currentValue={answers[currentField.field]}
                  onSubmit={handleIQSubmit}
                  questionNumber={iqQuestionNumber}
                  totalQuestions={totalIQQuestions}
                />
              ) : (
                <QuestionField
                  key={currentField.id}
                  field={currentField}
                  options={getOptionsForField(currentField)}
                  currentValue={answers[currentField.field]}
                  onSubmit={handleFieldSubmit}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
