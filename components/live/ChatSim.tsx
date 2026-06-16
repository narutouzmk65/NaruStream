"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Send, Users, ShieldAlert, Heart, Trophy } from 'lucide-react';

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  color: string;
  badge?: 'mod' | 'sub' | 'vip' | 'none';
  time: string;
}

interface ChatSimProps {
  channelName: string;
  isWorldCup?: boolean;
}

const USER_COLORS = [
  '#F87171', '#FBBF24', '#34D399', '#60A5FA', 
  '#A78BFA', '#F472B6', '#38BDF8', '#FB7185',
  '#C084FC', '#2DD4BF', '#A3E635', '#FB923C'
];

const BOT_USERNAMES = [
  'FootFanatic', 'MaxLeDribbleur', 'Sofiane_93', 'LucasStreamer', 'LeBleuDu92',
  'Sarah_M', 'ZizouFan', 'NicoGoal', 'Cinephile75', 'KylianFan',
  'Julien_V', 'IPTV_Master', 'Marlon_G', 'Chine_Sport', 'GamerPro',
  'Amandine_R', 'WorldCup_HQ', 'Ultra_Supporter', 'LeTacleGlisse', 'Corner_Kicker'
];

const FOOTBALL_MESSAGES = [
  "ALLEZ LES BLEUS !!! 🇫🇷",
  "Mais non quel raté !",
  "BUTTTTTTT !!! Magnifique !",
  "Le gardien a fait un arrêt de malade mental",
  "Y'a pas penalty là ?!? L'arbitre abuse",
  "Mbappé est en feu ce soir 🔥",
  "Quelle passe décisive incroyable de Griezmann",
  "On va gagner la Coupe du Monde c'est sûr !",
  "Ça joue trop bien là",
  "Le défenseur s'est fait détruire sur le drible haha",
  "C'est tendu ce match...",
  "OUI !!! Allez la France !",
  "Carton jaune mérité.",
  "MDR le tacle de boucher",
  "Ce match est historique !",
  "On y croit 💪⚽",
  "Le gardien est exceptionnel aujourd'hui !",
  "Allez rentre la balle !!!",
  "Mais pourquoi il tire là ?!? 🤦‍♂️",
  "Incroyable ambiance dans le stade !"
];

const GENERAL_MESSAGES = [
  "Salut tout le monde !",
  "Propre le stream, merci pour le lien !",
  "La qualité est ouf en vrai 👌",
  "Ça ne bug pas chez moi, nickel",
  "C'est quoi le programme après ?",
  "Trop hâte de voir la suite",
  "Hello du Sud ! ☀️",
  "Excellent ce canal",
  "Ça marche super bien 👍",
  "Quelqu'un sait si c'est en rediffusion ?",
  "Merci l'admin pour l'IPTV !",
  "On adore la qualité 1080p",
  "Salut les gars !",
  "C'est en direct de quel pays ?",
  "Le flux est super stable"
];

export default function ChatSim({ channelName, isWorldCup = false }: ChatSimProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [viewerCount, setViewerCount] = useState(1280);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Generate initial messages
  useEffect(() => {
    const initialMsgs: ChatMessage[] = [];
    const count = 15;
    const msgPool = isWorldCup ? FOOTBALL_MESSAGES : GENERAL_MESSAGES;

    for (let i = 0; i < count; i++) {
      const isWC = isWorldCup;
      const username = BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)];
      const message = msgPool[Math.floor(Math.random() * msgPool.length)];
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      
      const badgeRand = Math.random();
      const badge = badgeRand > 0.9 ? 'mod' : badgeRand > 0.75 ? 'vip' : badgeRand > 0.5 ? 'sub' : 'none';

      initialMsgs.push({
        id: Math.random().toString(36).substring(2, 9),
        username,
        message,
        color,
        badge,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    }

    setMessages(initialMsgs);
    setViewerCount(isWorldCup ? Math.floor(Math.random() * 50000) + 12000 : Math.floor(Math.random() * 3000) + 200);
  }, [channelName, isWorldCup]);

  // Scroll to bottom helper
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate incoming messages in real-time
  useEffect(() => {
    const msgPool = isWorldCup ? FOOTBALL_MESSAGES : GENERAL_MESSAGES;

    const interval = setInterval(() => {
      const username = BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)];
      const message = msgPool[Math.floor(Math.random() * msgPool.length)];
      const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
      
      const badgeRand = Math.random();
      const badge = badgeRand > 0.95 ? 'mod' : badgeRand > 0.85 ? 'vip' : badgeRand > 0.6 ? 'sub' : 'none';

      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        username,
        message,
        color,
        badge,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev.slice(-49), newMsg]); // Keep last 50 messages
      
      // Slightly fluctuate viewer count
      setViewerCount(prev => prev + Math.floor(Math.random() * 11) - 5);
    }, Math.floor(Math.random() * 2000) + 1000); // Between 1 and 3 seconds

    return () => clearInterval(interval);
  }, [isWorldCup]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(36).substring(2, 9),
      username: 'Vous',
      message: inputValue,
      color: '#60A5FA', // Cyan/Neon blue for the user
      badge: 'mod', // Admin/Mod badge for self
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Simulated reaction to user message after 1-2 seconds
    setTimeout(() => {
      const reactionMessage = isWorldCup
        ? "Grave d'accord avec toi !"
        : "Totalement ! Ça stream propre.";
      
      const responder: ChatMessage = {
        id: Math.random().toString(36).substring(2, 9),
        username: BOT_USERNAMES[Math.floor(Math.random() * BOT_USERNAMES.length)],
        message: `@Vous ${reactionMessage}`,
        color: USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)],
        badge: 'sub',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, responder]);
    }, 1500);
  };

  const getBadgeIcon = (badge?: string) => {
    switch (badge) {
      case 'mod':
        return <span title="Modérateur"><ShieldAlert size={12} className="text-red-500 mr-1 inline" /></span>;
      case 'vip':
        return <span title="VIP"><Trophy size={12} className="text-yellow-400 mr-1 inline" /></span>;
      case 'sub':
        return <span title="Abonné"><Heart size={12} className="text-pink-500 fill-pink-500 mr-1 inline" /></span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070B24] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-[#0A1033] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping"></span>
          <span className="font-bold text-xs uppercase tracking-widest text-white font-outfit">Live Chat</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-white/5 px-2 py-1 rounded-md">
          <Users size={12} className="text-[var(--color-neon)]" />
          <span>{viewerCount.toLocaleString()} spectateurs</span>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="text-[10px] text-gray-500 text-center py-2 bg-white/3 rounded-lg border border-white/5 px-2">
          Bienvenue dans le chat du direct pour <strong>{channelName}</strong>. Restez poli et respectueux envers les autres spectateurs.
        </div>
        
        {messages.map((msg) => (
          <div key={msg.id} className="text-sm leading-relaxed break-all hover:bg-white/3 p-1 rounded transition duration-150">
            <span className="text-[10px] text-gray-500 mr-2">{msg.time}</span>
            <span className="inline-flex items-center">
              {getBadgeIcon(msg.badge)}
            </span>
            <span 
              className="font-bold mr-2 cursor-pointer hover:underline" 
              style={{ color: msg.color }}
            >
              {msg.username} :
            </span>
            <span className="text-gray-200">{msg.message}</span>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Message Input Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-[#0A1033] border-t border-white/5 flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Envoyer un message..."
          className="flex-1 bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-neon)]/60 transition"
        />
        <button 
          type="submit"
          className="p-2.5 rounded-lg bg-[var(--color-neon)]/20 text-[var(--color-neon)] border border-[var(--color-neon)]/40 hover:bg-[var(--color-neon)]/40 hover:border-[var(--color-neon)] transition duration-200"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
