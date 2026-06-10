"use client";
import React, { useState } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  const languages = [
    { code: 'fr', label: '🇫🇷 FR' },
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'es', label: '🇪🇸 ES' },
  ];

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          padding: '0.4rem 0.8rem',
          borderRadius: '6px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
      >
        {languages.find(l => l.code === language)?.label || '🌐 Lang'}
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '0.5rem',
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid var(--primary-color)',
          borderRadius: '8px',
          overflow: 'hidden',
          zIndex: 1000,
          minWidth: '100px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
        }}>
          {languages.map(lang => (
            <button
              key={lang.code}
              onClick={() => {
                changeLanguage(lang.code);
                setIsOpen(false);
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.6rem 1rem',
                background: language === lang.code ? 'rgba(229, 9, 20, 0.2)' : 'transparent',
                border: 'none',
                color: language === lang.code ? 'var(--primary-color)' : 'white',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background 0.2s',
                fontSize: '0.9rem'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(229, 9, 20, 0.1)'}
              onMouseLeave={(e) => {
                if (language !== lang.code) e.target.style.background = 'transparent';
                else e.target.style.background = 'rgba(229, 9, 20, 0.2)';
              }}
            >
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
