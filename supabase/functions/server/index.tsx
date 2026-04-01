import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import { GoogleGenerativeAI } from "npm:@google/generative-ai@0.24.1";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Supabase client for admin operations
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
);

// Gemini AI client
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY') ?? '');

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Helper function to verify user token
async function verifyUser(authHeader: string | undefined) {
  if (!authHeader) return null;
  const token = authHeader.split(' ')[1];
  if (!token) return null;
  
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  
  return data.user;
}

// Helper function to check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const userData = await kv.get(`user:${userId}`);
  return userData?.isAdmin === true;
}

// ==================== HEALTH CHECK ====================
app.get("/make-server-b12e21f5/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== AUTH ROUTES ====================

// Sign up - create new user
app.post("/make-server-b12e21f5/auth/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name } = body;
    
    console.log('Signup request received:', { email, name });
    
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password va name majburiy' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log('Signup error (Supabase Auth):', error);
      return c.json({ error: error.message }, 400);
    }

    console.log('User created in Supabase:', data.user.id);

    // Save user data to KV store
    const userId = data.user.id;
    await kv.set(`user:${userId}`, {
      id: userId,
      email,
      name,
      isAdmin: false, // Default foydalanuvchi admin emas
      createdAt: new Date().toISOString()
    });

    console.log('User saved to KV store');

    return c.json({ 
      message: 'Ro\'yxatdan o\'tish muvaffaqiyatli',
      user: {
        id: userId,
        email,
        name
      }
    }, 201);
  } catch (error: any) {
    console.log('Signup error (server):', error);
    return c.json({ error: 'Server xatosi: ' + error.message }, 500);
  }
});

// Login - get access token
app.post("/make-server-b12e21f5/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: 'Email va password majburiy' }, 400);
    }

    // Create client with anon key for login
    const authClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data, error } = await authClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.session) {
      console.log('Login error:', error);
      return c.json({ error: 'Email yoki parol noto\'g\'ri' }, 401);
    }

    // Get user data from KV store
    const userData = await kv.get(`user:${data.user.id}`);

    return c.json({
      message: 'Login muvaffaqiyatli',
      access_token: data.session.access_token,
      user: userData || {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name
      }
    });
  } catch (error) {
    console.log('Login error (server):', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// Get current user info
app.get("/make-server-b12e21f5/auth/me", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const userData = await kv.get(`user:${user.id}`);
    return c.json({ user: userData });
  } catch (error) {
    console.log('Get user error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// ==================== BOOKS ROUTES ====================

// Get all books
app.get("/make-server-b12e21f5/books", async (c) => {
  try {
    const bookIds = await kv.get('books:list') || [];
    const books = await kv.mget(bookIds.map((id: string) => `book:${id}`));
    
    // Return books with basic info (without full text for performance)
    const booksPreview = books.map((book: any) => ({
      id: book.id,
      title: book.title,
      chaptersCount: book.chapters?.length || 0,
      createdAt: book.createdAt
    }));

    return c.json({ books: booksPreview });
  } catch (error) {
    console.log('Get books error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// Get single book by ID
app.get("/make-server-b12e21f5/books/:id", async (c) => {
  try {
    const bookId = c.req.param('id');
    const book = await kv.get(`book:${bookId}`);
    
    if (!book) {
      return c.json({ error: 'Kitob topilmadi' }, 404);
    }

    return c.json({ book });
  } catch (error) {
    console.log('Get book error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// ==================== ADMIN ROUTES ====================

// Create new book (Admin only)
app.post("/make-server-b12e21f5/admin/books", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isUserAdmin = await isAdmin(user.id);
    if (!isUserAdmin) {
      return c.json({ error: 'Faqat admin foydalanuvchilar kitob qo\'sha oladi' }, 403);
    }

    const { title, fullText, chapters } = await c.req.json();
    
    if (!title || !fullText || !chapters || !Array.isArray(chapters)) {
      return c.json({ 
        error: 'Title, fullText va chapters (array) majburiy' 
      }, 400);
    }

    // Generate book ID
    const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create book object
    const book = {
      id: bookId,
      title,
      fullText,
      chapters, // [{title, content, roles: []}]
      createdAt: new Date().toISOString(),
      createdBy: user.id
    };

    // Save book
    await kv.set(`book:${bookId}`, book);
    
    // Add to books list
    const bookIds = await kv.get('books:list') || [];
    bookIds.push(bookId);
    await kv.set('books:list', bookIds);

    return c.json({ 
      message: 'Kitob muvaffaqiyatli qo\'shildi',
      book: { id: bookId, title }
    }, 201);
  } catch (error) {
    console.log('Create book error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// Update book (Admin only)
app.put("/make-server-b12e21f5/admin/books/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isUserAdmin = await isAdmin(user.id);
    if (!isUserAdmin) {
      return c.json({ error: 'Faqat admin foydalanuvchilar kitobni tahrirlashi mumkin' }, 403);
    }

    const bookId = c.req.param('id');
    const existingBook = await kv.get(`book:${bookId}`);
    
    if (!existingBook) {
      return c.json({ error: 'Kitob topilmadi' }, 404);
    }

    const { title, fullText, chapters } = await c.req.json();
    
    const updatedBook = {
      ...existingBook,
      title: title || existingBook.title,
      fullText: fullText || existingBook.fullText,
      chapters: chapters || existingBook.chapters,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    await kv.set(`book:${bookId}`, updatedBook);

    return c.json({ 
      message: 'Kitob muvaffaqiyatli yangilandi',
      book: { id: bookId, title: updatedBook.title }
    });
  } catch (error) {
    console.log('Update book error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// Delete book (Admin only)
app.del("/make-server-b12e21f5/admin/books/:id", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const isUserAdmin = await isAdmin(user.id);
    if (!isUserAdmin) {
      return c.json({ error: 'Faqat admin foydalanuvchilar kitobni o\'chirishi mumkin' }, 403);
    }

    const bookId = c.req.param('id');
    const existingBook = await kv.get(`book:${bookId}`);
    
    if (!existingBook) {
      return c.json({ error: 'Kitob topilmadi' }, 404);
    }

    // Delete book
    await kv.del(`book:${bookId}`);
    
    // Remove from books list
    const bookIds = await kv.get('books:list') || [];
    const updatedBookIds = bookIds.filter((id: string) => id !== bookId);
    await kv.set('books:list', updatedBookIds);

    return c.json({ message: 'Kitob muvaffaqiyatli o\'chirildi' });
  } catch (error) {
    console.log('Delete book error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// ==================== CHAT ROUTES (AI Integration) ====================

// Start a new chat session for a book
app.post("/make-server-b12e21f5/chat/start", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { bookId, chapterIndex } = await c.req.json();
    
    if (!bookId || chapterIndex === undefined) {
      return c.json({ error: 'bookId va chapterIndex majburiy' }, 400);
    }

    const book = await kv.get(`book:${bookId}`);
    if (!book) {
      return c.json({ error: 'Kitob topilmadi' }, 404);
    }

    if (!book.chapters || !book.chapters[chapterIndex]) {
      return c.json({ error: 'Bo\'lim topilmadi' }, 404);
    }

    const chapter = book.chapters[chapterIndex];
    
    // Generate session ID
    const sessionId = `chat_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Create initial AI prompt
    const systemPrompt = `
Sen "${book.title}" kitobining ${chapterIndex + 1}-bo'limida hikoyachi va o'yinchi rolida ishtirok etassan.

KITOB KONTEKSTI:
${chapter.content}

MAVJUD ROLLAR:
${chapter.roles?.map((role: string, i: number) => `${i + 1}. ${role}`).join('\n') || 'Rollar belgilanmagan'}

QOIDALAR:
1. Foydalanuvchi birinchi navbatda qaysi rolni tanlaishini so'ra
2. Foydalanuvchi rol tanlagandan so'ng, uning rolida hikoyani boshlang
3. Har bir javobingizda vaziyatni tavsifla va foydalanuvchidan qaror qabul qilishni so'ra
4. Foydalanuvchi o'rniga hech qachon qaror qabul qilma - faqat natijalarni tavsifla
5. Hikoyani kitobning ushbu bo'limi doirasida davom ettir
6. Javoblaringni qiziqarli va jonli qil
7. O'zbek tilida javob ber

MUHIM: Sen foydalanuvchi o'rniga harakatlar qilmaysan, faqat vaziyatni tasvirlab berasan va tanlov variantlarini taklif qilasan.
`.trim();

    // Initialize chat session
    const chatSession = {
      id: sessionId,
      bookId,
      chapterIndex,
      userId: user.id,
      systemPrompt,
      messages: [],
      createdAt: new Date().toISOString()
    };

    // Save session
    await kv.set(`chat:${sessionId}`, chatSession);
    
    // Add to user's chat sessions
    const userSessions = await kv.get(`chat-sessions:${user.id}`) || [];
    userSessions.push(sessionId);
    await kv.set(`chat-sessions:${user.id}`, userSessions);

    // Generate first AI message (welcome message)
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(systemPrompt + "\n\nFoydalanuvchiga xush kelibsiz va qaysi rolni tanlashini so'rang.");
    const aiResponse = result.response.text();

    // Add AI welcome message
    chatSession.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });
    
    await kv.set(`chat:${sessionId}`, chatSession);

    return c.json({
      message: 'Chat sessiyasi boshlandi',
      sessionId,
      welcomeMessage: aiResponse,
      chapter: {
        title: chapter.title,
        roles: chapter.roles
      }
    }, 201);
  } catch (error) {
    console.log('Start chat error:', error);
    return c.json({ error: 'Server xatosi: ' + error.message }, 500);
  }
});

// Send message and get AI response
app.post("/make-server-b12e21f5/chat/message", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { sessionId, message } = await c.req.json();
    
    if (!sessionId || !message) {
      return c.json({ error: 'sessionId va message majburiy' }, 400);
    }

    const chatSession = await kv.get(`chat:${sessionId}`);
    if (!chatSession) {
      return c.json({ error: 'Chat sessiyasi topilmadi' }, 404);
    }

    // Verify session belongs to user
    if (chatSession.userId !== user.id) {
      return c.json({ error: 'Bu chat sessiyasi sizga tegishli emas' }, 403);
    }

    // Add user message
    chatSession.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    // Build conversation history for AI
    const conversationHistory = chatSession.systemPrompt + "\n\n" +
      chatSession.messages.map((msg: any) => 
        `${msg.role === 'user' ? 'Foydalanuvchi' : 'AI'}: ${msg.content}`
      ).join('\n\n');

    // Get AI response
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(conversationHistory + "\n\nFoydalanuvchining oxirgi xabariga javob ber:");
    const aiResponse = result.response.text();

    // Add AI response
    chatSession.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    });

    // Save updated session
    await kv.set(`chat:${sessionId}`, chatSession);

    return c.json({
      message: 'Xabar yuborildi',
      aiResponse
    });
  } catch (error) {
    console.log('Send message error:', error);
    return c.json({ error: 'Server xatosi: ' + error.message }, 500);
  }
});

// Get chat history
app.get("/make-server-b12e21f5/chat/history/:sessionId", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionId = c.req.param('sessionId');
    const chatSession = await kv.get(`chat:${sessionId}`);
    
    if (!chatSession) {
      return c.json({ error: 'Chat sessiyasi topilmadi' }, 404);
    }

    // Verify session belongs to user
    if (chatSession.userId !== user.id) {
      return c.json({ error: 'Bu chat sessiyasi sizga tegishli emas' }, 403);
    }

    return c.json({ 
      session: {
        id: chatSession.id,
        bookId: chatSession.bookId,
        messages: chatSession.messages,
        createdAt: chatSession.createdAt
      }
    });
  } catch (error) {
    console.log('Get chat history error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

// Get user's all chat sessions
app.get("/make-server-b12e21f5/chat/sessions", async (c) => {
  try {
    const user = await verifyUser(c.req.header('Authorization'));
    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const sessionIds = await kv.get(`chat-sessions:${user.id}`) || [];
    const sessions = await kv.mget(sessionIds.map((id: string) => `chat:${id}`));
    
    // Return sessions with basic info
    const sessionsPreview = sessions.map((session: any) => ({
      id: session.id,
      bookId: session.bookId,
      messagesCount: session.messages?.length || 0,
      createdAt: session.createdAt
    }));

    return c.json({ sessions: sessionsPreview });
  } catch (error) {
    console.log('Get sessions error:', error);
    return c.json({ error: 'Server xatosi' }, 500);
  }
});

Deno.serve(app.fetch);