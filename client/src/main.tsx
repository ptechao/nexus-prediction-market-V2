/**
 * 應用入口
 * 
 * 初始化 React 應用、提供商和全局狀態。
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { trpc } from '@/lib/trpc';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import './index.css';

/**
 * 根組件 - 包含所有提供商
 */
function Root() {
  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpc.client} queryClient={queryClient}>
          <ThemeProvider defaultTheme="light" storageKey="nexus-theme">
            <LanguageProvider defaultLanguage="en" storageKey="nexus-language">
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </React.StrictMode>
  );
}

// 掛載應用
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Root />);
