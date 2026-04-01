import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useAuth } from '@/app/contexts/AuthContext';
import { useBooks, type Book } from '@/app/contexts/BooksContext';
import { useChat } from '@/app/contexts/ChatContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { ArrowLeft, Send, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export function BookAdventure() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getBook } = useBooks();
  const { currentSession, loading: chatLoading, startChat, sendMessage } = useChat();
  const [book, setBook] = useState<Book | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (id) {
      const foundBook = getBook(id);
      if (foundBook) {
        setBook(foundBook);
      } else {
        toast.error('Kitob topilmadi');
        navigate('/books');
      }
    }
    setLoading(false);
  }, [id, user, getBook, navigate]);

  useEffect(() => {
    if (currentSession) {
      setMessages(currentSession.messages);
    }
  }, [currentSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startAdventure = async () => {
    if (selectedChapter === null) {
      toast.error('Bo\'lim tanlang');
      return;
    }

    if (!book) return;

    setStarting(true);

    try {
      const chapter = book.chapters[selectedChapter];
      const welcomeMessage = await startChat(
        book.id,
        selectedChapter,
        book.title,
        chapter.content,
        chapter.roles || []
      );
      
      toast.success('Sayohat boshlandi!');
    } catch (error: any) {
      console.error('Start adventure error:', error);
      toast.error(error.message || 'Xato yuz berdi');
    } finally {
      setStarting(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentSession) return;

    const messageText = inputMessage;
    setInputMessage('');
    setSending(true);

    try {
      await sendMessage(messageText);
    } catch (error: any) {
      console.error('Send message error:', error);
      toast.error(error.message || 'Xato yuz berdi');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!book) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/50 backdrop-blur border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Button onClick={() => navigate('/books')} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold line-clamp-1">{book.title}</h1>
            <p className="text-sm text-gray-500">Interaktiv Sayohat</p>
          </div>
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 flex flex-col">
        {!currentSession ? (
          // Chapter Selection
          <div className="flex-1 flex items-center justify-center">
            <Card className="w-full max-w-md">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-purple-600" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Sayohatni Boshlash</h2>
                  <p className="text-gray-600">
                    Qaysi bo'limda sarguzashtni boshlamoqchisiz?
                  </p>
                </div>

                <div className="space-y-4">
                  <Select
                    value={selectedChapter?.toString()}
                    onValueChange={(value) => setSelectedChapter(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bo'limni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {book.chapters?.map((chapter, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {index + 1}. {chapter.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {selectedChapter !== null && book.chapters[selectedChapter].roles && (
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <p className="text-sm font-medium text-purple-900 mb-2">
                        Mavjud rollar:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {book.chapters[selectedChapter].roles?.map((role, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={startAdventure}
                    disabled={selectedChapter === null || starting}
                    className="w-full"
                  >
                    {starting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sayohatni Boshlash
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Chat Interface
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${
                      message.role === 'user' ? 'text-purple-200' : 'text-gray-400'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString('uz-UZ', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="bg-white border-t border-gray-200 p-4 rounded-t-2xl">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Qanday qaror qabul qilasiz?..."
                  disabled={sending}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputMessage.trim() || sending}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                AI siz tanlagan qarorlaringizga mos hikoyani davom ettiradi
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}