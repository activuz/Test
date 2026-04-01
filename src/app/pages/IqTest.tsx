import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Progress } from '@/app/components/ui/progress';
import { Brain, ArrowRight, Zap, Award } from 'lucide-react';
import fileData from '../../../file.json'; // Adjust to root

export function IqTest() {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  
  const iqStage = fileData.onboarding_stages.find(s => s.stage === 4);
  const maxSteps = iqStage?.steps?.length || 0;
  
  const [isIntro, setIsIntro] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [totalWeightedPoints, setTotalWeightedPoints] = useState(0);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  const handleStart = () => {
    setIsIntro(false);
    setQuestionStartTime(Date.now());
  };

  const handleSkip = () => {
    navigate('/dashboard');
  };

  const currentStep = iqStage?.steps[currentStepIdx];
  const field = currentStep?.fields[0] as any;

  const handleNext = () => {
    if (!field || !selectedOptionId) return;

    // Calculate time-weighted points
    const endTime = Date.now();
    const durationSeconds = Math.max((endTime - questionStartTime) / 1000, 0.5); // Minimum 0.5s to avoid infinity
    
    const selectedOpt = field.options.find((o: any) => o.id === selectedOptionId);
    const points = selectedOpt?.point || 0;
    
    // Adjusted Formula (70% Base + 30% Time-weighted): points * (0.7 + 0.3 * (8 / duration))
    const weightedPoints = points * (0.7 + 0.3 * (8 / durationSeconds));
    const newTotalWeighted = totalWeightedPoints + weightedPoints;
    setTotalWeightedPoints(newTotalWeighted);

    if (currentStepIdx < maxSteps - 1) {
      setCurrentStepIdx(prev => prev + 1);
      setSelectedOptionId(null);
      setQuestionStartTime(Date.now()); // Reset for next
    } else {
      // Test ended
      const maxPossibleInJson = 47; // Current file.json stage 4 max points
      const finalIQ = Math.round(newTotalWeighted * (100 / maxPossibleInJson));
      
      // Cap at reasonable limits (optional but good)
      const cappedIQ = Math.min(Math.max(finalIQ, 40), 160);
      
      updateUser({ iqScore: cappedIQ });
      navigate('/dashboard');
    }
  };

  if (isIntro) {
    return (
      <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4 font-sans">
        <Card className="w-full max-w-2xl p-8 md:p-12 rounded-[2.5rem] shadow-2xl bg-white border-purple-100 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-purple-100 rounded-3xl flex items-center justify-center mb-8 animate-pulse">
            <Brain className="h-10 w-10 text-purple-600" />
          </div>
          
          <h1 className="text-3xl font-extrabold text-gray-900 mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            HamrohAi IQ Testi
          </h1>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Ushbu test sizning mantiqiy fikrlashingizni va muammolarni hal qilish tezligingizni aniqlaydi. 
            Testni boshlashdan oldin qoidalar bilan tanishib chiqing:
          </p>

          <div className="w-full bg-purple-50 rounded-3xl p-6 mb-10 text-left space-y-4">
            <div className="flex items-start gap-4">
               <div className="p-2 bg-white rounded-xl shadow-sm">
                 <Zap className="h-4 w-4 text-orange-500" />
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-800">Tezlik masalasi</p>
                 <p className="text-xs text-gray-500">Savollarni qanchalik tez yechsangiz, shunchalik ko'p ball olasiz.</p>
               </div>
            </div>
            <div className="flex items-start gap-4">
               <div className="p-2 bg-white rounded-xl shadow-sm">
                 <Award className="h-4 w-4 text-purple-500" />
               </div>
               <div>
                 <p className="text-sm font-bold text-gray-800">30/70 Qoidasi</p>
                 <p className="text-xs text-gray-500">Ballning 70% qismi aniqlikka, 30% qismi esa tezlikka bog'liq.</p>
               </div>
            </div>
          </div>

          <div className="w-full flex flex-col sm:flex-row gap-4">
            <Button 
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-7 text-lg font-bold shadow-lg shadow-purple-200 transition-all hover:scale-[1.02]"
              onClick={handleStart}
            >
              Testni boshlash
            </Button>
            <Button 
              variant="outline"
              className="flex-1 border-gray-200 hover:bg-gray-50 text-gray-500 rounded-2xl py-7 text-lg font-bold transition-all"
              onClick={handleSkip}
            >
              Hozircha o'tkazib yuborish
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (!field) {
    return <div className="min-h-screen flex items-center justify-center p-4">Iq test topilmadi.</div>;
  }

  const progress = Math.round(((currentStepIdx + 1) / maxSteps) * 100);

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl shadow-xl overflow-hidden rounded-[2rem] border-purple-100 flex flex-col bg-white">
        
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-tr from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600" />
             </div>
             <div>
               <h2 className="font-bold text-lg text-gray-800">Qobiliyatni Aniqlash</h2>
               <p className="text-sm text-gray-500">IQ va mantiqiy fikrlash ({currentStepIdx + 1} / {maxSteps})</p>
             </div>
          </div>
          <div className="w-32">
             <Progress value={progress} className="h-2 bg-purple-100" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Roadmap Sidebar */}
          <div className="w-64 bg-gray-50 border-r p-6 hidden md:block overflow-y-auto">
            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              Sizning Yo'lingiz
            </h3>
            <div className="space-y-6 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
              
              {fileData.onboarding_stages.map((stage: any, idx: number) => {
                const isActive = stage.stage === 4;
                const isCompleted = stage.stage < 4;
                
                return (
                  <div key={idx} className="relative flex items-start gap-4 z-10">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 border-2 mt-0.5 transition-colors ` + 
                      (isCompleted ? 'bg-green-500 border-green-500 text-white' : 
                       isActive ? 'bg-white border-purple-600 ring-4 ring-purple-100' : 
                       'bg-white border-gray-300 text-transparent')
                    }>
                      {isCompleted ? <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg> : 
                       isActive ? <div className="w-2 h-2 rounded-full bg-purple-600"></div> : null}
                    </div>
                    <div>
                      <h4 className={`text-sm font-semibold \${isActive ? 'text-purple-700' : isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                        {stage.title}
                      </h4>
                      <p className={`text-xs mt-1 \${isActive ? 'text-purple-500/80' : 'text-gray-400'}`}>
                        {stage.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-8 flex-1 flex flex-col items-center overflow-y-auto">
            <h3 className="text-2xl font-semibold mb-6 text-center text-gray-800">{field.question}</h3>
            
          
          {field.image && (
             <div className="mb-8 p-4 border rounded-xl shadow-sm max-w-[600px] w-full flex justify-center bg-gray-50">
                <img 
                  src={field.image} 
                  alt="Iq savol" 
                  className="max-h-64 object-contain"
                  onError={(e) => {
                     // SVG topilmasa placeholder
                     e.currentTarget.style.display = 'none';
                  }} 
                />
             </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {field.options.map((opt: any) => (
               <div 
                 key={opt.id}
                 onClick={() => setSelectedOptionId(opt.id)}
                 className={`border-2 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group hover:shadow-md \${
                    selectedOptionId === opt.id 
                    ? 'border-purple-600 bg-purple-50 shadow-md ring-1 ring-purple-600' 
                    : 'border-gray-200 hover:border-purple-300'
                 }`}
               >
                 {opt.image ? (
                    <img 
                      src={opt.image} 
                      alt={opt.text} 
                      className="max-h-32 object-contain"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                 ) : null}
                 <span className={`font-semibold \${selectedOptionId === opt.id ? 'text-purple-700' : 'text-gray-700'}`}>
                   {opt.id}. {opt.text}
                 </span>
               </div>
            ))}
          </div>

          <div className="mt-12 w-full flex justify-end pt-4 border-t">
            <Button 
               size="lg" 
               className="h-12 px-8 bg-purple-600 hover:bg-purple-700"
               disabled={!selectedOptionId}
               onClick={handleNext}
            >
              {currentStepIdx < maxSteps - 1 ? 'Keyingisi' : 'Natijani Koorish'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        </div>
      </Card>
    </div>
  );
}
