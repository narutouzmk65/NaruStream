"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Créer l'email automatiquement : pseudo@narustream.fr
    const email = `${username.toLowerCase().replace(/\s/g, "")}@narustream.fr`;

    try {
      // D'abord, essayer de créer le compte
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: null,
          data: { username },
        }
      });

      if (!signUpError && signUpData.user) {
        // Update profile with username
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          email: email,
          username: username,
          is_admin: false,
          is_banned: false
        });
      }

      // Si on a une session directement, on est bon !
      if (signUpData.session) {
        router.push("/profiles");
        return;
      }

      // Sinon, essayer de se connecter
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // User is logged in!
      router.push("/profiles");
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.formContainer}>
        <h1 className={styles.logo}>NARU<span>.STREAM</span></h1>
        {!isLogin && (
          <p style={{ 
            color: "var(--accent-color)", 
            textAlign: "center", 
            marginBottom: "1.5rem",
            fontSize: "1.1rem"
          }}>
            Créer votre compte, c'est rapide et gratuit !
          </p>
        )}
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 className={styles.title}>{isLogin ? "Se connecter" : "S'inscrire"}</h2>
          {error && <p className={styles.error}>{error}</p>}
          
          <div className={styles.formGroup}>
            <label className={styles.label}>Nom d'utilisateur</label>
            <input
              type="text"
              className={styles.input}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="MonPseudo123"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Mot de passe</label>
            <input
              type="password"
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
          </div>

          <button type="submit" className={styles.button} disabled={loading}>
            {loading ? "Chargement..." : isLogin ? "Se connecter" : "Créer un compte"}
          </button>

          <p className={styles.switchText}>
            {isLogin
              ? "Pas de compte ? "
              : "Déjà un compte ? "}
            <button
              type="button"
              className={styles.switchButton}
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
