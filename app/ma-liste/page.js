'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MaListe() {
  const [myList, setMyList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyList();
  }, []);

  const fetchMyList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's list with movie details
      const { data, error } = await supabase
        .from('user_lists')
        .select(`
          id,
          movies (
            id,
            title,
            poster_url,
            release_year,
            category
          )
        `)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) throw error;
      setMyList(data || []);
    } catch (error) {
      console.error('Error fetching my list:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromList = async (movieId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_lists')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) throw error;
      fetchMyList(); // Refresh the list
    } catch (error) {
      console.error('Error removing from list:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        color: 'white' 
      }}>
        Chargement...
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '2rem', 
      maxWidth: '1400px', 
      margin: '0 auto' 
    }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none' }}>
          ← Retour à l'accueil
        </Link>
      </div>

      <h1 style={{ 
        color: 'white', 
        fontSize: '2.5rem', 
        marginBottom: '2rem',
        textShadow: '0 0 10px var(--primary-color)'
      }}>
        Ma Liste
      </h1>

      {myList.length === 0 ? (
        <div style={{ 
          color: 'white', 
          fontSize: '1.2rem', 
          textAlign: 'center', 
          padding: '4rem' 
        }}>
          Tu n'as pas encore ajouté de films à ta liste !
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '1.5rem' 
        }}>
          {myList.map((item) => (
            <div key={item.id} style={{ position: 'relative' }}>
              <Link href={`/movie/${item.movies?.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ 
                  position: 'relative', 
                  borderRadius: '8px', 
                  overflow: 'hidden', 
                  cursor: 'pointer',
                  transition: 'transform 0.3s ease',
                  boxShadow: '0 0 20px rgba(0,0,0,0.3)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  <img 
                    src={item.movies?.poster_url || '/placeholder.png'} 
                    alt={item.movies?.title}
                    style={{ 
                      width: '100%', 
                      height: '300px', 
                      objectFit: 'cover' 
                    }}
                  />
                  <div style={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    left: 0, 
                    right: 0, 
                    background: 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)',
                    padding: '1rem'
                  }}>
                    <h3 style={{ 
                      color: 'white', 
                      margin: 0, 
                      fontSize: '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {item.movies?.title}
                    </h3>
                    {item.movies?.release_year && (
                      <p style={{ 
                        color: '#aaa', 
                        margin: '0.25rem 0 0 0', 
                        fontSize: '0.875rem' 
                      }}>
                        {item.movies.release_year}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              <button
                onClick={() => removeFromList(item.movies?.id)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(255,0,0,0.8)',
                  border: 'none',
                  color: 'white',
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,0,0,1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,0,0,0.8)'}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
