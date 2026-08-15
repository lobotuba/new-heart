/** Lowercases, strips punctuation, and splits into words for order-aware comparison. */
export function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[.,;:!?"'"'—–-]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

/** Longest common subsequence length — rewards recalling words in the right order over just the right bag of words. */
function lcsLength(a: string[], b: string[]): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0))
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1])
    }
  }
  return dp[a.length][b.length]
}

/** Fraction (0-1) of the correct text's words recovered, in order, by the typed attempt. */
export function recallScore(attempt: string, correctText: string): number {
  const correctWords = normalizeWords(correctText)
  if (correctWords.length === 0) return 0
  const attemptWords = normalizeWords(attempt)
  return lcsLength(attemptWords, correctWords) / correctWords.length
}

export const PASS_THRESHOLD = 0.8
