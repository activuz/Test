import { useState } from 'react';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Calendar } from '@/app/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/components/ui/popover';
import { CalendarIcon, Check } from 'lucide-react';
import { format } from 'date-fns';
import type { Field, FieldOption } from '@/app/contexts/OnboardingContext';

interface QuestionFieldProps {
  field: Field;
  options: (string | FieldOption)[];
  currentValue: any;
  onSubmit: (value: any) => void;
}

export function QuestionField({ field, options, currentValue, onSubmit }: QuestionFieldProps) {
  const [value, setValue] = useState<any>(currentValue ?? (field.type === 'multi_select' ? [] : ''));
  const [date, setDate] = useState<Date | undefined>(currentValue ? new Date(currentValue) : undefined);

  const handleSubmit = () => {
    if (field.type === 'date' && date) {
      onSubmit(format(date, 'yyyy-MM-dd'));
    } else {
      onSubmit(value);
    }
  };

  const isValid = () => {
    if (!field.required) return true;
    if (field.type === 'multi_select') return Array.isArray(value) && value.length > 0;
    if (field.type === 'date') return !!date;
    return value !== '' && value !== undefined && value !== null;
  };

  const toggleMultiSelect = (option: string) => {
    const arr = Array.isArray(value) ? [...value] : [];
    const idx = arr.indexOf(option);
    if (idx >= 0) arr.splice(idx, 1);
    else arr.push(option);
    setValue(arr);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
      {/* Question */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
          {field.question}
        </h2>
        {field.placeholder && (
          <p className="text-muted-foreground text-sm">{field.placeholder}</p>
        )}
      </div>

      {/* Field Body */}
      <div className="space-y-3">
        {/* TEXT */}
        {field.type === 'text' && (
          <Input
            id={`field-${field.id}`}
            placeholder={field.placeholder || "Javobingizni yozing..."}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="h-12 text-base bg-white/80 backdrop-blur border-2 border-primary/10 focus:border-primary/40 rounded-xl transition-all"
            autoFocus
          />
        )}

        {/* TEXTAREA */}
        {field.type === 'textarea' && (
          <Textarea
            id={`field-${field.id}`}
            placeholder={field.placeholder || "Fikringizni yozing..."}
            value={value}
            onChange={e => setValue(e.target.value)}
            className="min-h-[120px] text-base bg-white/80 backdrop-blur border-2 border-primary/10 focus:border-primary/40 rounded-xl transition-all resize-none"
            autoFocus
          />
        )}

        {/* DATE */}
        {field.type === 'date' && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full h-12 justify-start text-left font-normal bg-white/80 border-2 border-primary/10 rounded-xl hover:border-primary/40"
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {date ? format(date, "dd.MM.yyyy") : "Sanani tanlang..."}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                captionLayout="dropdown"
                fromYear={1940}
                toYear={2020}
                defaultMonth={date || new Date(2000, 0)}
              />
            </PopoverContent>
          </Popover>
        )}

        {/* SELECT */}
        {field.type === 'select' && (
          <div className="grid gap-2">
            {options.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : (opt.text || opt.id || '');
              const isSelected = value === optText;
              return (
                <button
                  key={i}
                  onClick={() => setValue(optText)}
                  className={`group relative flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                      : 'border-transparent bg-white/60 hover:bg-white/90 hover:border-primary/20 hover:shadow-sm'
                  }`}
                >
                  <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <span className={`text-sm md:text-base ${isSelected ? 'text-primary font-medium' : 'text-foreground'}`}>
                    {optText}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* MULTI_SELECT */}
        {field.type === 'multi_select' && (
          <div className="flex flex-wrap gap-2">
            {options.map((opt, i) => {
              const optText = typeof opt === 'string' ? opt : (opt.text || opt.id || '');
              const isSelected = Array.isArray(value) && value.includes(optText);
              return (
                <button
                  key={i}
                  onClick={() => toggleMultiSelect(optText)}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full border-2 text-sm font-medium transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary text-white shadow-md shadow-primary/20'
                      : 'border-primary/15 bg-white/60 text-foreground hover:border-primary/30 hover:bg-white/90'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                  {optText}
                </button>
              );
            })}
          </div>
        )}

        {/* BOOLEAN */}
        {field.type === 'boolean' && (
          <div className="flex gap-3">
            {['Ha', "Yo'q"].map(opt => {
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  onClick={() => setValue(opt)}
                  className={`flex-1 py-4 rounded-xl border-2 text-base font-medium transition-all duration-200 ${
                    isSelected
                      ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20'
                      : 'border-primary/15 bg-white/60 text-foreground hover:border-primary/30'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!isValid()}
        className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white font-semibold text-base shadow-lg shadow-primary/20 transition-all disabled:opacity-40 disabled:shadow-none"
      >
        Davom etish →
      </Button>
    </div>
  );
}
