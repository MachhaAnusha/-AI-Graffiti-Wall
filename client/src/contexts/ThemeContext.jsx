import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      return savedTheme === 'dark';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    // Update localStorage and document class
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', isDarkMode);
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = {
    isDarkMode,
    toggleTheme,
    colors: {
      dark: {
        bg: '#0f0f0f',
        bgSecondary: '#1a1a1a',
        bgTertiary: '#252525',
        text: '#ffffff',
        textSecondary: '#a0a0a0',
        border: '#333333',
        accent: '#ff006e',
        accentSecondary: '#3a86ff',
        success: '#06ffa5',
        warning: '#ffbe0b',
        danger: '#ff4757',
      },
      light: {
        bg: '#ffffff',
        bgSecondary: '#f8f9fa',
        bgTertiary: '#e9ecef',
        text: '#2d3436',
        textSecondary: '#636e72',
        border: '#dee2e6',
        accent: '#ff006e',
        accentSecondary: '#3a86ff',
        success: '#00b894',
        warning: '#fdcb6e',
        danger: '#d63031',
      }
    }
  };

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
