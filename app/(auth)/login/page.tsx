"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError("Identifiants incorrects.");
    } else {
      router.push('/admin');
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    // Par défaut, Supabase demande un mot de passe d'au moins 6 caractères
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setSuccess("Inscription réussie ! Vous pouvez vous connecter.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-blue-deep)] flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-xl shadow-2xl w-full max-w-md border border-[var(--color-neon)]/30">
        <h1 className="text-3xl font-bold text-center text-white mb-8 tracking-widest uppercase font-outfit">
          A N T I G R A V I T Y
        </h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500 text-white text-sm p-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-500/20 border border-green-500 text-white text-sm p-3 rounded">
              {success}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300 uppercase tracking-widest font-semibold">Email Secouru</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-black/50 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[var(--color-neon)] transition w-full"
              placeholder="admin@antigravity.v2"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-300 uppercase tracking-widest font-semibold">Terminal Mot de Passe</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-black/50 border border-white/10 rounded-md p-3 text-white focus:outline-none focus:border-[var(--color-neon)] transition w-full"
              placeholder="••••••••"
            />
          </div>

          <div className="flex flex-col gap-3 mt-4">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-[var(--color-neon)] hover:bg-[var(--color-neon)]/80 text-black font-bold py-3 rounded-md transition flex justify-center items-center h-12 uppercase tracking-wide"
            >
              {loading ? "Connexion..." : "Accès Système"}
            </button>
            <button 
              type="button" 
              onClick={handleRegister}
              disabled={loading}
              className="bg-transparent border border-white/20 hover:bg-white/10 text-white font-bold py-3 rounded-md transition w-full h-12 uppercase"
            >
              Créer Mon Compte Maître
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
