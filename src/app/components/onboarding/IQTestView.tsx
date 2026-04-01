import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Check, Clock } from 'lucide-react';
import type { Field, FieldOption } from '@/app/contexts/OnboardingContext';

interface IQTestViewProps {
  field: Field;
  currentValue: any;
  onSubmit: (value: string, points: number) => void;
  questionNumber: number;
  totalQuestions: number;
}

export function IQTestView({ field, currentValue, onSubmit, questionNumber, totalQuestions }: IQTestViewProps) {
  const [selected, setSelected] = useState<string>(currentValue || '');

  const options = (field.options || []) as FieldOption[];

  const handleSubmit = () => {
    if (!selected) return;
    const opt = options.find(o => o.id === selected);
    const points = opt?.point || 0;
    onSubmit(selected, points);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* IQ Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <span className="text-white text-sm font-bold">🧠</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Savol {questionNumber}/{totalQuestions}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>IQ Test</span>
        </div>
      </div>

      {/* Progress */}
      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Question */}
      <h2 className="text-xl md:text-2xl font-bold text-foreground">
        {field.question}
      </h2>

      {/* Question Image */}
      {field.image && (
        <div className="flex justify-center p-6 bg-white/80 backdrop-blur rounded-2xl border border-primary/10">
          <img 
            src={field.image} 
            alt={field.question}
            className="max-h-48 md:max-h-64 object-contain"
          />
        </div>
      )}

      {/* Options */}
      <div className={`grid gap-3 ${
        options.some(o => o.image && o.image !== '') ? 'grid-cols-2' : 'grid-cols-1'
      }`}>
        {options.map((opt) => {
          const isSelected = selected === opt.id;
          const hasImage = opt.image && opt.image !== '';

          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id || '')}
              className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? 'border-amber-500 bg-amber-50 shadow-md shadow-amber-500/10'
                  : 'border-transparent bg-white/60 hover:bg-white/90 hover:border-amber-500/20 hover:shadow-sm'
              }`}
            >
              {/* Selection indicator */}
              <div className={`absolute top-2 right-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                isSelected ? 'border-amber-500 bg-amber-500' : 'border-muted-foreground/20'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </div>

              {/* Option Image */}
              {hasImage && (
                <div className="w-full flex justify-center py-2">
                  <img 
                    src={opt.image} 
                    alt={`Variant ${opt.id}`}
                    className="max-h-20 md:max-h-28 object-contain"
                  />
                </div>
              )}

              {/* Option Label */}
              <div className="flex items-center gap-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold ${
                  isSelected
                    ? 'bg-amber-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {opt.id}
                </span>
                {opt.text && (
                  <span className={`text-sm md:text-base ${isSelected ? 'text-amber-700 font-medium' : 'text-foreground'}`}>
                    {opt.text}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!selected}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold text-base shadow-lg shadow-amber-500/20 transition-all disabled:opacity-40 disabled:shadow-none"
      >
        Keyingi savol →
      </Button>
    </div>
  );
}
