import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { apiService } from '@/app/services/apiService';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { ScrollArea } from '@/app/components/ui/scroll-area';
import { Send, Loader2, Sparkles, Bot } from 'lucide-react';
import { Card } from '@/app/components/ui/card';
import ReactMarkdown from 'react-markdown';
import fileData from '../../../file.json'; // adjust path to root src

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  hidden?: boolean;
}

export function Onboarding() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>(user?.chatHistory || []);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [multiSelectValues, setMultiSelectValues] = useState<string[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [stages] = useState(() => fileData.onboarding_stages.filter(s => s.stage <= 3));
  const [answers, setAnswers] = useState<Record<string, any>>(user?.onboardingData || {});
  
  const [stageIdx, setStageIdx] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const [fieldIdx, setFieldIdx] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const currentStage = stages[stageIdx];
  const currentStep = currentStage?.steps[stepIdx];
  const currentField = currentStep?.fields[fieldIdx];

  // Redirection & Initialization
  useEffect(() => {
    if (user?.onboardingCompleted) {
      navigate('/dashboard');
      return;
    }

    if (user?.onboardingProgress && !isInitialized) {
      try {
        const prog = JSON.parse(user.onboardingProgress);
        if (prog.stageIdx !== undefined) setStageIdx(prog.stageIdx);
        if (prog.stepIdx !== undefined) setStepIdx(prog.stepIdx);
        if (prog.fieldIdx !== undefined) setFieldIdx(prog.fieldIdx);
      } catch (e) {
        console.error("Progress parse error", e);
      }
    }
    
    // If no history, add a placeholder or start first field
    if ((!user?.chatHistory || user.chatHistory.length === 0) && !isInitialized) {
       // startNextField will handle this via the other useEffect
    }

    setIsInitialized(true);
  }, [user, isInitialized, navigate]);

  // Sync progress to backend when indices change
  useEffect(() => {
    if (isInitialized && !user?.onboardingCompleted) {
       updateUser({ 
         onboardingProgress: JSON.stringify({ stageIdx, stepIdx, fieldIdx }) 
       });
    }
  }, [stageIdx, stepIdx, fieldIdx, isInitialized]);

  // Trigger next question when indices change
  useEffect(() => {
    if (isInitialized && stages.length > 0 && !user?.onboardingCompleted) {
       // Only trigger if the last message isn't already the question for this field
       startNextField();
    }
  }, [stageIdx, stepIdx, fieldIdx, isInitialized]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const advanceField = (currentAnswers: Record<string, any> = answers) => {
    let nextStageIdx = stageIdx;
    let nextStepIdx = stepIdx;
    let nextFieldIdx = fieldIdx;

    let found = false;

    // Start searching from current position
    for (let s = stageIdx; s < stages.length; s++) {
      const stage = stages[s];
      for (let st = (s === stageIdx ? stepIdx : 0); st < stage.steps.length; st++) {
        const step = stage.steps[st];
        for (let f = (s === stageIdx && st === stepIdx ? fieldIdx + 1 : 0); f < step.fields.length; f++) {
          const field = step.fields[f];
          if (!currentAnswers[field.field]) {
            nextStageIdx = s;
            nextStepIdx = st;
            nextFieldIdx = f;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }

    if (!found) {
      // All stages 1-3 filled!
      updateUser({ 
        onboardingData: currentAnswers, 
        onboardingCompleted: true,
        onboardingProgress: JSON.stringify({ stageIdx: 3, stepIdx: 0, fieldIdx: 0 }) // Flag for done
      });
      navigate('/iq-test');
      return;
    }

    setFieldIdx(nextFieldIdx);
    setStepIdx(nextStepIdx);
    setStageIdx(nextStageIdx);
  };

  const getOptions = (field: any) => {
    let options = field.options || [];
    if (field.depends_on === 'region') {
      const regionAns = answers['region'];
      if (regionAns) {
        for (const key of Object.keys(field.options_by_region || {})) {
          if (regionAns.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(regionAns.toLowerCase())) {
            options = field.options_by_region[key];
            break;
          }
        }
      }
    }
    return options;
  };

  const startNextField = async () => {
    if (!currentField) return;
    setLoading(true);
    
    try {
      const question = currentField.question;
      const options = getOptions(currentField);
      
      const botResponse = await apiService.askQuestionBot(question, options, messages);
      
      const newMessages: Message[] = [...messages, { role: 'assistant' as const, content: botResponse }];
      setMessages(newMessages);
      updateUser({ chatHistory: newMessages });
      
    } catch (e) {
      const newMessages: Message[] = [...messages, { role: 'assistant' as const, content: currentField.question }];
      setMessages(newMessages);
      updateUser({ chatHistory: newMessages });
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (val: string) => {
    if (currentField?.type === 'multi_select') {
      setMultiSelectValues(prev => 
        prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
      );
    } else {
      // Direct submit for select/boolean
      submitText(val);
    }
  };

  const submitText = async (text: string) => {
    if (!text.trim() || loading || !currentField) return;
    
    // Clear multi-select for next field
    setMultiSelectValues([]);
    
    const userText = text.trim();
    setInputValue('');
    
    const userMessage = { role: 'user', content: userText } as Message;
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    updateUser({ chatHistory: updatedMessages }); // Sync to backend
    setLoading(true);

    try {
      const allFieldsInStage = currentStage.steps.flatMap((s: any) => s.fields) as any[];
      const extractedData = await apiService.extractFields(userText, allFieldsInStage);
      const newAnswers = { ...answers, ...extractedData };
      const fieldType = currentField.type || 'text';
      const options = getOptions(currentField);
      
      let currentFieldValid = !!newAnswers[currentField.field];
      let formalAns = newAnswers[currentField.field];

      if (!currentFieldValid) {
        const evalRes = await apiService.evaluateAnswer(currentField.question, options, userText, fieldType);
        if (evalRes.startsWith('VALID:')) {
          formalAns = evalRes.replace('VALID:', '').trim();
          newAnswers[currentField.field] = formalAns;
          currentFieldValid = true;
        }
      }

      setAnswers(newAnswers);
      updateUser({ onboardingData: newAnswers }); // Sync data to backend immediately!

      if (currentFieldValid) {
        updatedMessages.push({
          role: 'user', 
          content: "[TIZIM TOPSHIRIG'I: Foydalanuvchi ma'lumotni berdi, ajoyib qabul qildi, o'zingizcha qo'shimcha izohlamang. Rahmat deb ketsangiz bo'ladi yoki indamay oxirgi xabaringda saqlab qol]",
          hidden: true
        });
        setMessages(updatedMessages);
        advanceField(newAnswers);
        // Loading will be set to false inside startNextField which is triggered by index change
      } else if (currentField.required) {
        updatedMessages.push({
          role: 'user', 
          content: "[TIZIM TOPSHIRIG'I: Foydalanuvchi bu savolga aniq javob bermadi yoki rad etdi (bilmayman, istamayman dedi). Bu ma'lumot bizga juda zarur. Xushmuomalalik bilan, lekin qat'iy qilib buning muhimligini tushuntirgin va xuddi shu savolni yana boshqacha, yumshoqroq qilib so'ra.]",
          hidden: true
        });
        setMessages(updatedMessages);
        
        const botResponse = await apiService.askQuestionBot(currentField.question, options, updatedMessages);
        const finalMessages: Message[] = [...updatedMessages, { role: 'assistant' as const, content: botResponse }];
        setMessages(finalMessages);
        updateUser({ chatHistory: finalMessages });
        setLoading(false);
      } else {
        advanceField(newAnswers);
      }
    } catch (error) {
       console.error("Submit error", error);
       setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    submitText(inputValue);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFD] flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl h-[85vh] flex flex-col shadow-2xl overflow-hidden rounded-[2rem] border-purple-100">
        
        {/* Header */}
        <div className="p-6 border-b bg-gradient-to-r from-purple-50 to-pink-50 flex items-center gap-4">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
            <Bot className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              HamrohAi Onboarding
            </h2>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mt-1">
              {currentStage?.title || "Yakunlanmoqda..."}
            </p>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Roadmap Sidebar */}
          <div className="w-64 bg-gray-50 border-r p-6 hidden md:block overflow-y-auto h-full sticky top-0">
            <h3 className="font-semibold text-gray-800 mb-6 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              Sizning Yo'lingiz
            </h3>
            <div className="space-y-6 relative">
              <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-200"></div>
              
              {fileData.onboarding_stages.map((stage: any, idx: number) => {
                const isActive = stage.stage === currentStage?.stage;
                const isCompleted = currentStage && stage.stage < currentStage?.stage;
                
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

          {/* Chat Container */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Area */}
            <ScrollArea className="flex-1 p-6" viewportRef={viewportRef}>
              <div className="space-y-6">
                {messages.filter(m => 
                  m.role !== 'system' && !m.hidden
                ).map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex gap-3 \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 mt-1 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    
                    <div 
                      className={`max-w-[80%] rounded-2xl p-4 \${
                        msg.role === 'user' 
                        ? 'bg-purple-100 text-purple-900 rounded-tr-sm shadow-sm border border-purple-200' 
                        : 'bg-white border text-gray-900 rounded-tl-sm shadow-sm'
                      }`}
                    >
                      {msg.role === 'assistant' ? (
                        <div className="prose prose-sm max-w-none prose-p:leading-relaxed text-gray-900">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
                {loading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 mt-1 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                       <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <div className="bg-white border text-gray-700 rounded-2xl rounded-tl-sm p-4 shadow-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                      <span className="text-sm">Yozmoqda...</span>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Options Area */}
            {currentField && (currentField.type === 'select' || currentField.type === 'multi_select' || currentField.type === 'boolean') && (
              <div className="p-3 bg-gray-50/50 border-t flex flex-wrap gap-2 justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                {(currentField.type === 'boolean' 
                  ? ['Ha', 'Yo\'q'] 
                  : getOptions(currentField)
                ).map((opt: any, idx: number) => {
                  const text = typeof opt === 'string' ? opt : (opt.text || opt.id);
                  const isSelected = multiSelectValues.includes(text);
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => handleOptionClick(text)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all shadow-sm border \${
                        isSelected 
                        ? 'bg-purple-100 text-purple-900 border-purple-300 scale-105' 
                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      {text}
                    </button>
                  );
                })}
                
                {currentField.type === 'multi_select' && multiSelectValues.length > 0 && (
                  <button
                    onClick={() => submitText(multiSelectValues.join(', '))}
                    className="px-6 py-2 rounded-full text-sm font-bold bg-purple-200 text-purple-900 border border-purple-300 shadow-md hover:shadow-lg transition-all scale-105 ml-2"
                  >
                    Tasdiqlash ({multiSelectValues.length})
                  </button>
                )}
              </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  value={inputValue}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                  placeholder="Javobingizni shu yerga yozing..."
                  disabled={loading}
                  className="flex-1 rounded-xl h-12 px-4 shadow-sm border-purple-100 focus-visible:ring-purple-500 text-gray-900 bg-white"
                />
                <Button 
                  type="submit" 
                  disabled={loading || !inputValue.trim()} 
                  className="h-12 w-12 rounded-xl bg-purple-600 hover:bg-purple-700 shadow-md transition-all"
                >
                  <Send className="h-5 w-5 text-white" />
                </Button>
              </form>
            </div>
          </div>
        </div>
        
      </Card>
    </div>
  );
}
