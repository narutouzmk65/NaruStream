"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, ShieldCheck, RefreshCw, BadgePlus } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      setError(error.message);
    } else if (data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const promoteUser = async (targetId: string) => {
    // Appel sécurisé de la fonction d'élévation
    const { error } = await supabase.rpc('set_admin_role', { target_user_id: targetId });
    if (error) {
      alert("Échec (Êtes-vous sûr d'être Administrateur ?) : " + error.message);
    } else {
      fetchUsers();
    }
  };

  const demoteUser = async (targetId: string) => {
    const { error } = await supabase.rpc('remove_admin_role', { target_user_id: targetId });
    if (error) {
      alert("Échec: " + error.message);
    } else {
      fetchUsers();
    }
  };

  return (
    <div className="p-8 pb-32 w-full max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-outfit uppercase tracking-widest font-bold text-white flex items-center gap-3 drop-shadow-lg">
            <ShieldAlert className="text-[var(--color-neon)]" /> Gestion d'Équipe
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Déléguez le pouvoir suprême d'Antigravity à vos modérateurs.</p>
        </div>
        <button 
          onClick={fetchUsers} 
          className="flex items-center gap-2 px-4 py-2 border border-white/20 rounded-md hover:bg-white/10 transition text-sm text-gray-300 font-bold"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Recharger
        </button>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-4 rounded-md mb-6 border border-red-500/50">{error}</div>}

      <div className="bg-[#0D1B5E]/50 border border-[var(--color-neon)]/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
        <table className="w-full text-left">
          <thead className="bg-[#0A0F2E] text-xs uppercase tracking-widest text-[#60A5FA] border-b border-[var(--color-electric)]/20">
            <tr>
              <th className="px-6 py-5 font-bold">Agents Identifiés</th>
              <th className="px-6 py-5 font-bold">Grade</th>
              <th className="px-6 py-5 font-bold text-right">Attribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-electric)]/10">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-white/5 transition duration-300 group">
                <td className="px-6 py-5">
                  <div className="font-mono text-sm text-white font-semibold">
                    {user.username || "Membre Sans Nom"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 font-mono group-hover:text-[var(--color-neon)]/70 transition">
                    ID: {user.id.split('-')[0]}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {user.role === 'admin' ? (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-[var(--color-electric)]/20 text-[var(--color-neon)] text-xs font-bold uppercase tracking-wide border border-[var(--color-neon)]/30">
                      <ShieldCheck size={14} /> Maître-Admin
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-sm bg-gray-500/10 text-gray-400 text-xs font-bold uppercase tracking-wide border border-gray-500/20">
                      Standard
                    </span>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  {user.role === 'admin' ? (
                    <button 
                      onClick={() => demoteUser(user.id)}
                      className="text-xs font-bold bg-transparent border border-red-500/50 text-red-400 px-4 py-2 rounded-sm shadow-sm hover:bg-red-500/20 hover:border-red-500 transition"
                    >
                      Ban (Rétrograder)
                    </button>
                  ) : (
                    <button 
                      onClick={() => promoteUser(user.id)}
                      className="text-xs font-bold bg-white text-black px-4 py-2 rounded-sm shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:bg-[#60A5FA] hover:text-white transition flex items-center justify-end gap-2 ml-auto hover:shadow-[0_0_20px_rgba(96,165,250,0.6)]"
                    >
                      <BadgePlus size={14} /> Frapper Chevalier (Admin)
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-500 italic">Vide. Personne n'a créé de compte pour le moment.</div>
        )}
      </div>
    </div>
  );
}
