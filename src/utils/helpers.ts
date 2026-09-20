import React from 'react';
import { Festival, FestivalStatus } from '../types';
import { Circle, X } from 'lucide-react';
import { parseISO, isValid, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColorStyles = (status: FestivalStatus) => {
  switch(status) {
    case FestivalStatus.POR_ENVIAR: return 'bg-red-100 text-red-700 border-red-200';
    case FestivalStatus.PROXIMAMENTE: return 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200';
    case FestivalStatus.EN_REVISION: return 'bg-orange-100 text-orange-700 border-orange-200';
    case FestivalStatus.SELECCIONADO: return 'bg-sky-100 text-sky-700 border-sky-200';
    case FestivalStatus.NO_SELECCIONADO: return 'bg-slate-100 text-rose-800/60 border-rose-200/50';
    case FestivalStatus.PROYECTADO: return 'bg-indigo-100 text-indigo-700 border-indigo-200';
    case FestivalStatus.GANADO: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case FestivalStatus.EN_DUDA: return 'bg-violet-100 text-violet-700 border-violet-200';
    case FestivalStatus.DESCALIFICADO: return 'bg-slate-200 text-slate-700 border-slate-300';
    case FestivalStatus.CERRADO: return 'bg-slate-100 text-slate-800 border-slate-500 shadow-sm';
    default: return 'bg-slate-100 text-slate-700 border-slate-200';
  }
};

export const getStatusIconColor = (status: FestivalStatus): string => {
  switch (status) {
    case FestivalStatus.POR_ENVIAR: return 'text-red-600';
    case FestivalStatus.PROXIMAMENTE: return 'text-fuchsia-600';
    case FestivalStatus.EN_REVISION: return 'text-orange-500';
    case FestivalStatus.SELECCIONADO: return 'text-sky-600';
    case FestivalStatus.NO_SELECCIONADO: return 'text-rose-600';
    case FestivalStatus.PROYECTADO: return 'text-indigo-600';
    case FestivalStatus.GANADO: return 'text-amber-500';
    case FestivalStatus.EN_DUDA: return 'text-violet-600';
    case FestivalStatus.DESCALIFICADO: return 'text-slate-500';
    case FestivalStatus.CERRADO: return 'text-slate-600';
    default: return 'text-slate-600';
  }
};

export const getStatusIcon = (status: FestivalStatus, className: string = 'h-3 w-3') => {
  const iconColor = getStatusIconColor(status);
  if (status === FestivalStatus.NO_SELECCIONADO || status === FestivalStatus.DESCALIFICADO || status === FestivalStatus.CERRADO) {
    return React.createElement(X, { className: cn(className, iconColor) });
  }
  return React.createElement(Circle, { className: cn(className, "fill-current", iconColor) });
};

export const formatDisplayDate = (dateStr: string | undefined): string => {
  if (!dateStr) return 'A confirmar';
  const d = parseFestivalDate(dateStr);
  if (!d || isNaN(d.getTime())) return dateStr;
  
  if (dateStr.includes('T')) {
    return format(d, "dd/MM/yyyy - HH:mm'hs'", { locale: es });
  }
  return format(d, "dd/MM/yyyy", { locale: es });
};

export const formatDateForInput = (dateStr: string | undefined): string => {
  const d = parseFestivalDate(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  return format(d, 'yyyy-MM-dd');
};

export const formatDateTimeForInput = (dateStr: string | undefined): string => {
  const d = parseFestivalDate(dateStr);
  if (!d || isNaN(d.getTime())) return '';
  return format(d, "yyyy-MM-dd'T'HH:mm");
};

export const parseFestivalDate = (dateStr: string | undefined): Date | null => {
  if (!dateStr) return null;
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr) || /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/.test(dateStr)) {
    const dStr = dateStr.split('T')[0];
    const [y, m, d] = dStr.split('-');
    return new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  } else if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    return parseISO(dateStr);
  }

  const ddmmyyyy = dateStr.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
  }

  const months: Record<string, number> = {
    'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5, 
    'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
  };
  const ddmon = dateStr.match(/^(\d{1,2})-(\w{3})-(\d{4})$/);
  if (ddmon) {
    const m = months[ddmon[2].toLowerCase()];
    if (m !== undefined) {
      return new Date(parseInt(ddmon[3]), m, parseInt(ddmon[1]));
    }
  }

  return null;
};

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "")
    .trim();
}

export function getLevenshteinDistance(a: string, b: string): number {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function isSimilarMatch(text: string, search: string): boolean {
  if (!text) return false;
  if (!search) return true;
  
  const normText = normalizeText(text);
  const normSearch = normalizeText(search);
  
  // 1. Direct normalized substring match
  if (normText.includes(normSearch)) return true;
  
  // 2. Token/word-based matching (allows matching different order of words)
  const searchTokens = normSearch.split(/\s+/).filter(Boolean);
  if (searchTokens.length === 0) return true;
  
  const allTokensMatch = searchTokens.every(token => normText.includes(token));
  if (allTokensMatch) return true;
  
  // 3. Typo/Similarity tolerance (Levenshtein Distance)
  // Ensure ALL search tokens match (either exactly or via close fuzzy match)
  const textWords = normText.split(/\s+/).filter(Boolean);
  const allTokensFuzzyMatch = searchTokens.every(token => {
    if (normText.includes(token)) return true;
    if (token.length >= 4) {
      return textWords.some(word => {
        if (Math.abs(word.length - token.length) <= 1) {
          const dist = getLevenshteinDistance(word, token);
          return dist <= 1;
        }
        return false;
      });
    }
    return false;
  });

  return allTokensFuzzyMatch;
}

export function getTimeSinceSubmitted(festival: Festival): string | null {
  if (!festival) return null;
  const history = festival.statusHistory || [];
  const submittedEntry = [...history].reverse().find(
    (entry) => entry.status !== FestivalStatus.POR_ENVIAR && entry.status !== FestivalStatus.PROXIMAMENTE && entry.status !== FestivalStatus.EN_DUDA
  ) || history[history.length - 1];

  if (submittedEntry?.timestamp) {
    const time = new Date(submittedEntry.timestamp).getTime();
    if (!isNaN(time)) {
      const diffMs = Date.now() - time;
      if (diffMs < 0) return 'Recientemente';
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 60) return `hace ${Math.max(1, diffMins)} min`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `hace ${diffHours} hs`;
      const diffDays = Math.floor(diffHours / 24);
      return `hace ${diffDays} d`;
    }
  }
  return null;
}

