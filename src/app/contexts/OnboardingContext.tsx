import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import onboardingConfig from '../../../../file.json';

export interface FieldOption {
  id?: string;
  image?: string;
  text?: string;
  point?: number;
}

export interface Field {
  id: string;
  question: string;
  type: string;
  field: string;
  required?: boolean;
  options?: (string | FieldOption)[];
  options_by_region?: Record<string, string[]>;
  depends_on?: string;
  placeholder?: string;
  image?: string;
  correct?: string;
  category?: string;
  ai_insight?: string;
  prompt_to_ai?: string;
}

export interface Step {
  step: number;
  fields: Field[];
}

export interface Stage {
  stage: number;
  title: string;
  description: string;
  steps: Step[];
  scoring?: {
    method: string;
    max_score: number;
    levels: { label: string; min: number; max: number }[];
    question_types: Record<string, { description: string; max_point: number }>;
  };
}

interface OnboardingState {
  stages: Stage[];
  currentStageIndex: number;
  currentStepIndex: number;
  currentFieldIndex: number;
  answers: Record<string, any>;
  iqAnswers: Record<string, { answer: string; points: number }>;
  isComplete: boolean;
}

interface OnboardingContextType extends OnboardingState {
  currentStage: Stage | null;
  currentStep: Step | null;
  currentField: Field | null;
  totalFields: number;
  completedFields: number;
  progressPercent: number;
  stageProgress: number;
  submitAnswer: (fieldName: string, value: any, iqPoints?: number) => void;
  goNext: () => void;
  goPrev: () => void;
  getOptionsForField: (field: Field) => (string | FieldOption)[];
  calculateIQScore: () => { score: number; level: string; breakdown: Record<string, number> };
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(() => {
    const saved = localStorage.getItem('bilim_onboarding');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...parsed,
        stages: onboardingConfig.onboarding_stages as Stage[],
      };
    }
    return {
      stages: onboardingConfig.onboarding_stages as Stage[],
      currentStageIndex: 0,
      currentStepIndex: 0,
      currentFieldIndex: 0,
      answers: {},
      iqAnswers: {},
      isComplete: false,
    };
  });

  useEffect(() => {
    const { stages, ...toSave } = state;
    localStorage.setItem('bilim_onboarding', JSON.stringify(toSave));
  }, [state]);

  const currentStage = state.stages[state.currentStageIndex] || null;
  const currentStep = currentStage?.steps[state.currentStepIndex] || null;
  const currentField = currentStep?.fields[state.currentFieldIndex] || null;

  // Count total/completed fields
  const allFields: Field[] = [];
  state.stages.forEach(stage => {
    stage.steps.forEach(step => {
      step.fields.forEach(field => allFields.push(field));
    });
  });
  const totalFields = allFields.length;
  const completedFields = allFields.filter(f => state.answers[f.field] !== undefined).length;
  const progressPercent = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

  // Stage-level progress
  const stageFields: Field[] = [];
  if (currentStage) {
    currentStage.steps.forEach(step => {
      step.fields.forEach(field => stageFields.push(field));
    });
  }
  const stageCompleted = stageFields.filter(f => state.answers[f.field] !== undefined).length;
  const stageProgress = stageFields.length > 0 ? Math.round((stageCompleted / stageFields.length) * 100) : 0;

  const getOptionsForField = useCallback((field: Field): (string | FieldOption)[] => {
    if (field.depends_on === 'region' && field.options_by_region) {
      const regionAns = state.answers['region'];
      if (regionAns) {
        for (const key of Object.keys(field.options_by_region)) {
          if (regionAns.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(regionAns.toLowerCase())) {
            return field.options_by_region[key];
          }
        }
      }
      return [];
    }
    return field.options || [];
  }, [state.answers]);

  const submitAnswer = useCallback((fieldName: string, value: any, iqPoints?: number) => {
    setState(prev => {
      const newAnswers = { ...prev.answers, [fieldName]: value };
      const newIQ = { ...prev.iqAnswers };
      if (iqPoints !== undefined) {
        newIQ[fieldName] = { answer: value, points: iqPoints };
      }
      return { ...prev, answers: newAnswers, iqAnswers: newIQ };
    });
  }, []);

  const goNext = useCallback(() => {
    setState(prev => {
      const stage = prev.stages[prev.currentStageIndex];
      if (!stage) return { ...prev, isComplete: true };

      const step = stage.steps[prev.currentStepIndex];
      if (!step) return prev;

      // Next field in current step
      if (prev.currentFieldIndex < step.fields.length - 1) {
        return { ...prev, currentFieldIndex: prev.currentFieldIndex + 1 };
      }

      // Next step in current stage
      if (prev.currentStepIndex < stage.steps.length - 1) {
        return { ...prev, currentStepIndex: prev.currentStepIndex + 1, currentFieldIndex: 0 };
      }

      // Next stage
      if (prev.currentStageIndex < prev.stages.length - 1) {
        return { ...prev, currentStageIndex: prev.currentStageIndex + 1, currentStepIndex: 0, currentFieldIndex: 0 };
      }

      // All done
      return { ...prev, isComplete: true };
    });
  }, []);

  const goPrev = useCallback(() => {
    setState(prev => {
      if (prev.currentFieldIndex > 0) {
        return { ...prev, currentFieldIndex: prev.currentFieldIndex - 1 };
      }
      if (prev.currentStepIndex > 0) {
        const prevStep = prev.stages[prev.currentStageIndex].steps[prev.currentStepIndex - 1];
        return { ...prev, currentStepIndex: prev.currentStepIndex - 1, currentFieldIndex: prevStep.fields.length - 1 };
      }
      if (prev.currentStageIndex > 0) {
        const prevStage = prev.stages[prev.currentStageIndex - 1];
        const prevStep = prevStage.steps[prevStage.steps.length - 1];
        return {
          ...prev,
          currentStageIndex: prev.currentStageIndex - 1,
          currentStepIndex: prevStage.steps.length - 1,
          currentFieldIndex: prevStep.fields.length - 1,
        };
      }
      return prev;
    });
  }, []);

  const calculateIQScore = useCallback(() => {
    let totalScore = 0;
    const breakdown: Record<string, number> = {};

    Object.values(state.iqAnswers).forEach(({ points }) => {
      totalScore += points;
    });

    // Build category breakdown
    const iqStage = state.stages.find(s => s.stage === 4);
    if (iqStage) {
      iqStage.steps.forEach(step => {
        step.fields.forEach(field => {
          const cat = field.category || 'other';
          if (!breakdown[cat]) breakdown[cat] = 0;
          const ans = state.iqAnswers[field.field];
          if (ans) breakdown[cat] += ans.points;
        });
      });
    }

    // Determine level
    let level = "Boshlang'ich";
    const scoring = iqStage?.scoring;
    if (scoring) {
      for (const lvl of scoring.levels) {
        if (totalScore >= lvl.min && totalScore <= lvl.max) {
          level = lvl.label;
          break;
        }
      }
    }

    return { score: totalScore, level, breakdown };
  }, [state.iqAnswers, state.stages]);

  return (
    <OnboardingContext.Provider value={{
      ...state,
      currentStage,
      currentStep,
      currentField,
      totalFields,
      completedFields,
      progressPercent,
      stageProgress,
      submitAnswer,
      goNext,
      goPrev,
      getOptionsForField,
      calculateIQScore,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
