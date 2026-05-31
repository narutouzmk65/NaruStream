"use client";

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SearchBar({ onSearch }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmedQuery = query.trim();
    if (onSearch) {
      onSearch(trimmedQuery);
    } else if (trimmedQuery) {
      router.push(`/?q=${encodeURIComponent(trimmedQuery)}`);
    } else {
      router.push(`/`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="search-container">
      <input 
        type="text" 
        placeholder="Rechercher un film..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />
      <button type="submit" className="search-button">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
      </button>
    </form>
  );
}
