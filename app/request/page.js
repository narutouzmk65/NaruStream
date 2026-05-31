"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './request.module.css';
import { supabase } from '@/lib/supabase';

export default function RequestPage() {
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
        <Link href="/" className={styles.backLink}>← Retour à l&apos;accueil</Link>
        <h1 className="text-glow-pink">Demander un contenu</h1>
      </header>

      <div className={styles.panel}>
        <h2 className="text-glow-blue">Faites-nous savoir ce que vous voulez voir !</h2>
        
        {successMessage && (
          <div className={styles.successMessage}>
            {successMessage}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Type de contenu</label>
            <select 
              className={styles.input} 
              value={contentType} 
              onChange={(e) => setContentType(e.target.value)}
            >
              <option value="film">Film</option>
              <option value="serie">Série</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Titre *</label>
            <input 
              type="text" 
              className={styles.input} 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Ex: Le Parrain" 
              required 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Votre pseudo (optionnel)</label>
            <input 
              type="text" 
              className={styles.input} 
              value={requestedBy} 
              onChange={(e) => setRequestedBy(e.target.value)} 
              placeholder="Votre pseudo" 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Commentaires (optionnel)</label>
            <textarea 
              className={styles.input} 
              rows="4" 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              placeholder="Informations supplémentaires..." 
            />
          </div>

          <button 
            type="submit" 
            className="cyber-button primary" 
            disabled={isSubmitting}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
          </button>
        </form>
      </div>
    </div>
  );
}
