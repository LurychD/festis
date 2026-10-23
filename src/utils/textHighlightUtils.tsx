import React from 'react';

const COMMON_STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'del', 'en', 'y', 'e', 'o', 'u', 'a', 'con', 'por', 'para',
  'the', 'of', 'and', 'in', 'on', 'at', 'to', 'for', 'with', 'by'
]);

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractMeaningfulTokens(text: string): string[] {
  if (!text || typeof text !== 'string') return [];
  const clean = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const tokens = clean
    .split(/[^a-z0-9]+/i)
    .filter((t) => t.length >= 2 && !COMMON_STOP_WORDS.has(t));

  return Array.from(new Set(tokens));
}

export function findMatchingTokens(textA: string, textB: string): Set<string> {
  const tokensA = extractMeaningfulTokens(textA);
  const tokensB = new Set(extractMeaningfulTokens(textB));
  const matches = new Set<string>();

  for (const t of tokensA) {
    if (tokensB.has(t)) {
      matches.add(t);
    }
  }

  return matches;
}

export function renderHighlightedText(text: string, matchingTokens: Set<string>): React.ReactNode {
  if (!text) return text;
  if (!matchingTokens || matchingTokens.size === 0) return text;

  const sortedTokens = Array.from(matchingTokens).sort((a, b) => b.length - a.length);
  const escaped = sortedTokens.map(escapeRegExp).join('|');
  if (!escaped) return text;

  const regex = new RegExp(`(\\b(?:${escaped})\\b)`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    const norm = part
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

    if (matchingTokens.has(norm)) {
      return (
        <mark
          key={idx}
          className="bg-amber-200 text-amber-900 font-bold px-1 rounded"
        >
          {part}
        </mark>
      );
    }
    return part;
  });
}

export function highlightMatchingTokens(textA: string, textB: string): {
  highlightedA: React.ReactNode;
  highlightedB: React.ReactNode;
  matchingCount: number;
} {
  const matches = findMatchingTokens(textA, textB);
  return {
    highlightedA: renderHighlightedText(textA, matches),
    highlightedB: renderHighlightedText(textB, matches),
    matchingCount: matches.size,
  };
}
