import React, { createContext, useContext, useState, useEffect } from 'react';
import { seedDemoData } from '@/app/utils/seedData';

export interface Chapter {
  title: string;
  content: string;
  roles?: string[];
}

export interface Book {
  id: string;
  title: string;
  fullText: string;
  chapters: Chapter[];
  createdAt: string;
  createdBy: string;
}

interface BooksContextType {
  books: Book[];
  loading: boolean;
  getBook: (id: string) => Book | undefined;
  createBook: (book: Omit<Book, 'id' | 'createdAt'>) => Promise<Book>;
  updateBook: (id: string, book: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  refreshBooks: () => void;
}

const BooksContext = createContext<BooksContextType | undefined>(undefined);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  // Load books from localStorage
  const loadBooks = () => {
    try {
      // First, seed demo data if no books exist
      seedDemoData();
      
      const booksData = localStorage.getItem('books');
      if (booksData) {
        setBooks(JSON.parse(booksData));
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save books to localStorage
  const saveBooks = (newBooks: Book[]) => {
    localStorage.setItem('books', JSON.stringify(newBooks));
    setBooks(newBooks);
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const getBook = (id: string) => {
    return books.find(b => b.id === id);
  };

  const createBook = async (bookData: Omit<Book, 'id' | 'createdAt'>): Promise<Book> => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const newBook: Book = {
      ...bookData,
      id: `book_${Date.now()}`,
      createdAt: new Date().toISOString(),
      createdBy: user.id || 'unknown'
    };

    const newBooks = [...books, newBook];
    saveBooks(newBooks);
    
    return newBook;
  };

  const updateBook = async (id: string, bookData: Partial<Book>) => {
    const newBooks = books.map(book => 
      book.id === id ? { ...book, ...bookData } : book
    );
    saveBooks(newBooks);
  };

  const deleteBook = async (id: string) => {
    const newBooks = books.filter(book => book.id !== id);
    saveBooks(newBooks);
  };

  const refreshBooks = () => {
    loadBooks();
  };

  return (
    <BooksContext.Provider value={{ 
      books, 
      loading, 
      getBook, 
      createBook, 
      updateBook, 
      deleteBook,
      refreshBooks 
    }}>
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const context = useContext(BooksContext);
  if (context === undefined) {
    throw new Error('useBooks must be used within a BooksProvider');
  }
  return context;
}