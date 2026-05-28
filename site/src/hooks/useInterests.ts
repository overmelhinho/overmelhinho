'use client';

import { useCallback } from 'react';

const STORAGE_KEY = '@overmelhinho:interests';
const MAX_HISTORY = 15; // Keeps the last 15 segment visits

export function useInterests() {
  const trackSegment = useCallback((segmentId: number) => {
    if (typeof window === 'undefined' || !segmentId) return;
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let history: number[] = stored ? JSON.parse(stored) : [];
      
      // Add the new segment to the end
      history.push(segmentId);
      
      // Keep only the last MAX_HISTORY items
      if (history.length > MAX_HISTORY) {
        history = history.slice(history.length - MAX_HISTORY);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to track interest', e);
    }
  }, []);

  const getTopSegments = useCallback((limit: number = 2): number[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const history: number[] = JSON.parse(stored);
      
      // Count frequencies
      const frequencies: Record<number, number> = {};
      history.forEach(id => {
        frequencies[id] = (frequencies[id] || 0) + 1;
      });
      
      // Sort by frequency (descending)
      const sorted = Object.entries(frequencies)
        .sort((a, b) => b[1] - a[1])
        .map(([id]) => Number(id));
        
      return sorted.slice(0, limit);
    } catch (e) {
      console.error('Failed to get top segments', e);
      return [];
    }
  }, []);

  return { trackSegment, getTopSegments };
}
