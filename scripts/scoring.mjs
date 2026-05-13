import { explosiveWords, fomoWords } from "./constants.mjs";

export function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function countWords(text, words) {
  return words.reduce((sum, word) => {
    const pattern = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
    return sum + (text.match(pattern)?.length ?? 0);
  }, 0);
}

export function heatScore({ keywordHits, comments, likes, favorites, commentGrowthRate, heatGrowthRate, publishedAt }) {
  const ageHours = Math.max(1, (Date.now() - new Date(publishedAt).getTime()) / 36e5);
  const decay = Math.exp(-ageHours / 72);
  const interaction = Math.log1p(comments * 2.2 + likes + favorites * 1.35);
  return clamp(keywordHits * 2.4 + interaction * 4.1 + commentGrowthRate * 0.16 + heatGrowthRate * 0.13 + decay * 8);
}

export function fomoScore({ text, comments, commentGrowthRate, heatGrowthRate }) {
  const fomoHitCount = countWords(text, fomoWords);
  const explosiveHitCount = countWords(text, explosiveWords);
  const textUnits = Math.max(1, text.length / 180);
  const fomoDensity = fomoHitCount / textUnits;
  const explosiveDensity = explosiveHitCount / textUnits;
  const breakdown = {
    commentVelocity: clamp(commentGrowthRate * 0.32, 0, 22),
    heatGrowth: clamp(heatGrowthRate * 0.26, 0, 22),
    fomoWords: clamp(fomoDensity * 8.5, 0, 26),
    explosiveWords: clamp(explosiveDensity * 7, 0, 14),
    crowding: clamp(Math.log1p(comments) * 1.15, 0, 8)
  };
  return { score: clamp(Object.values(breakdown).reduce((sum, value) => sum + value, 0)), breakdown };
}
