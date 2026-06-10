"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './request.module.css';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function RequestPage() {
  const { t } = useLanguage();
  const [contentType, setContentType] = useState('film');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requestedBy, setRequestedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);
    };
    checkUser();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title) return;

    setIsSubmitting(true);
    
    const { error } = await supabase.from('content_requests').insert([
      {
        title,
        content_type: contentType,
        description,
        requested_by: requestedBy || 'Anonyme',
        requested_by_user_id: user?.id || null
      }
    ]);

    setIsSubmitting(false);

    if (error) {
      console.error('Erreur lors de la demande:', error);
      alert('Erreur : ' + error.message);
    } else {
      setSuccessMessage('Demande envoyée avec succès !');
      setTitle('');
      setDescription('');
      setRequestedBy('');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/" className={styles.backLink}>{t('back_home')}</Link>
        <h1 className="text-glow-pink">{t('request_title')}</h1>
      </header>

      <div className={styles.panel}>
        <h2 className="text-glow-blue">{t('request_subtitle')}</h2>
        
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>{t('type_label')}</label>
            <select 
              className={styles.input} 
              value={contentType} 
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="film">{t('type_movie')}</option>
              <option value="serie">{t('type_serie')}</option>
              <option value="anime">{t('type_anime')}</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>{t('title_label')}</label>
            <input 
              type="text" 
              className={styles.input} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder={t('title_placeholder')} 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('pseudo_label')}</label>
            <input 
              type="text" 
              className={styles.input} 
              value={requestedBy} 
              onChange={(e) => setRequestedBy(e.target.value)} 
              placeholder={t('pseudo_placeholder')} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>{t('comments_label')}</label>
            <textarea 
              className={styles.input} 
              rows="4" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder={t('comments_placeholder')} 
            />
          </div>

          <button 
            type="submit" 
            className="cyber-button primary" 
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? t('submitting') : t('submit_button')}
          </button>
        </form>
      </div>
    </div>
  );
}
