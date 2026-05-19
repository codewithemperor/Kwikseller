export interface SuggestionCandidate {
  name: string;
  category?: string;
  price?: string | number;
  count?: string;
}

const STOP_WORDS = new Set(["the", "a", "an", "and", "or", "for", "with", "of"]);

export function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length];
}

export function similarityScore(query: string, candidate: SuggestionCandidate) {
  const queryTokens = tokenize(query);
  const haystack = `${candidate.name} ${candidate.category ?? ""}`.toLowerCase();
  const candidateTokens = tokenize(haystack);

  if (!queryTokens.length) return 0;

  let score = 0;
  for (const queryToken of queryTokens) {
    for (const candidateToken of candidateTokens) {
      if (candidateToken === queryToken) score += 8;
      else if (candidateToken.startsWith(queryToken) || queryToken.startsWith(candidateToken)) score += 5;
      else if (candidateToken.includes(queryToken) || queryToken.includes(candidateToken)) score += 3;
      else {
        const distance = levenshtein(queryToken, candidateToken);
        const maxLength = Math.max(queryToken.length, candidateToken.length);
        if (maxLength > 3 && distance / maxLength <= 0.35) score += 2;
      }
    }
  }

  return score;
}

export function getSimilarSuggestions<T extends SuggestionCandidate>(
  query: string,
  candidates: T[],
  limit = 6,
) {
  const scored = candidates
    .map((candidate, index) => ({
      candidate,
      score: similarityScore(query, candidate),
      index,
    }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const matches = scored.filter((item) => item.score > 0).map((item) => item.candidate);
  return (matches.length ? matches : candidates).slice(0, limit);
}

