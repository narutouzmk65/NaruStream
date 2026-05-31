"use client";

import { useState } from "react";
import Link from "next/link";
import styles from "./contact.module.css";
import { supabase } from "@/lib/supabase";

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !message) {
      alert("Veuillez remplir tous les champs obligatoires !");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert the contact message into the database
      const { error } = await supabase.from("contact_messages").insert({
        name,
        email,
        subject: subject || "Sans sujet",
        message,
      });

      if (error) {
        console.error("Error submitting message:", error);
        alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
      } else {
        setSubmitSuccess(true);
        // Reset form
        setName("");
        setEmail("");
        setSubject("");
        setMessage("");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Erreur lors de l'envoi du message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <h1 className={`${styles.logo} text-glow-primary`}>
          NARU<span>.STREAM</span>
        </h1>
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLink}>← Retour à l'accueil</Link>
        </nav>
      </header>

      <div className={styles.content}>
        {/* Nice Welcome Message */}
        <div className={styles.welcomeSection}>
          <div className={styles.emoji}>💌</div>
          <h1 className={styles.title}>On est là pour vous aider !</h1>
          <p className={styles.subtitle}>
            Rencontrez un problème avec un film ? Une suggestion d'amélioration ? 
            Ou simplement envie de nous dire bonjour ? N'hésitez pas, nous répondrons 
            le plus vite possible ! 🌟
          </p>
        </div>

        {submitSuccess ? (
          <div className={styles.successBox}>
            <div className={styles.successEmoji}>✅</div>
            <h2>Message envoyé avec succès !</h2>
            <p>Merci pour votre message, nous vous répondrons très bientôt !</p>
            <Link href="/" className="cyber-button primary">
              Retour à l'accueil
            </Link>
          </div>
        ) : (
          <form className={styles.contactForm} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Nom complet *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Votre nom"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Sujet</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              >
                <option value="">Sélectionnez un sujet</option>
                <option value="Problème technique">Problème technique</option>
                <option value="Film/Série défectueux">Film/Série défectueux</option>
                <option value="Suggestion">Suggestion</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Message *</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dites-nous tout ce qui vous préoccupe..."
                rows="6"
                required
              />
            </div>

            <button
              type="submit"
              className="cyber-button primary"
              disabled={isSubmitting}
              style={{ width: "100%" }}
            >
              {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
