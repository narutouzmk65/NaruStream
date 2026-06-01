'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Rediriger vers l'admin séparé
    window.location.href = 'https://naru-stream-admin.vercel.app';
  }, []);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: 'white'
    }}>
      <h1>Redirection vers l'admin...</h1>
    </div>
  );
}
