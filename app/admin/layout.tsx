import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Vérifie méticuleusement que l'utilisateur est bien "admin" dans ses profils Supabase
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[var(--color-blue-deep)] text-white flex flex-col items-center justify-center p-8 text-center space-y-4">
        <h1 className="text-4xl text-red-500 font-bold uppercase tracking-widest">Accès Protégé</h1>
        <p className="max-w-xl text-lg text-gray-300">
          Vous êtes bien connecté au réseau, mais votre compte n'a pas les droits d'écriture sur la Master-Base.
        </p>
        <div className="bg-black/50 p-6 rounded-md border border-white/10 mt-6 text-left w-full max-w-xl shadow-2xl">
          <p className="text-[var(--color-neon)] font-bold mb-4 uppercase text-sm">Action Requise dans Supabase :</p>
          <ul className="text-sm text-gray-300 list-decimal pl-5 space-y-2">
            <li>Laissez cette page ouverte.</li>
            <li>Allez dans le portail web de votre Supabase, section "Table Editor".</li>
            <li>Cliquez sur votre nouvelle table `profiles`.</li>
            <li>Identifiez votre adresse "{user.email}" sur la ligne.</li>
            <li>Double-cliquez sur sa colonne "role", effacez "user" et remplacez par le mot "admin".</li>
            <li>Sauvegardez, puis actualisez cette page !</li>
          </ul>
        </div>
        <Link href="/" className="px-6 py-3 bg-white/10 text-white border border-white/20 rounded-md font-bold mt-8 hover:bg-white hover:text-black transition">
          Retour au Catalogue
        </Link>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#06091B] text-white">
      {/* Sidebar Admin ultra épurée */}
      <aside className="w-64 border-r border-white/5 bg-[var(--color-blue-deep)] flex flex-col shadow-2xl z-20">
        <div className="p-6 border-b border-white/5">
          <h2 className="font-outfit font-bold text-xl uppercase tracking-widest text-[var(--color-neon)]">Terminal</h2>
        </div>
        <div className="flex flex-col gap-2 p-4 flex-1">
          <Link href="/admin" className="p-3 text-sm font-semibold hover:bg-white/5 rounded transition text-white">
            Tableau de Bord
          </Link>
          <Link href="/admin/media" className="p-3 text-sm font-semibold hover:bg-[var(--color-neon)]/10 rounded transition text-[var(--color-neon)] border border-transparent hover:border-[var(--color-neon)]/30">
            Films & Séries
          </Link>
          <Link href="/admin/sagas" className="p-3 text-sm font-semibold hover:bg-white/5 rounded transition text-gray-400">
            Chronologies (Sagas)
          </Link>
          <Link href="/admin/users" className="p-3 text-sm font-semibold hover:bg-[var(--color-electric)]/20 rounded transition text-[var(--color-electric)] border border-transparent hover:border-[var(--color-electric)]/50 mt-4">
            Gestion d'Équipe (Droits)
          </Link>
        </div>
        <div className="p-4 border-t border-white/5 text-xs text-gray-500 truncate">
          <div className="uppercase font-bold text-white mb-1">Auteur Identifié</div>
          {user.email}
        </div>
      </aside>

      {/* Conteneur de l'app Admin interne */}
      <main className="flex-1 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
}
