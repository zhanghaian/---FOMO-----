import { explosiveWords, fomoWords } from "./keyword-map";
import { clamp } from "./utils";

type ScoreInput = {
  keywordHits: number;
  comments: number;
  likes: number;
  favorites: number;
  commentGrowthRate: number;
  heatGrowthRate: number;
  publishedAt: string;
  text: string;
};

export function calculateHeatScore(input: ScoreInput) {
  const ageHours = Math.max(1, (Date.now() - new Date(input.publishedAt).getTime()) / 36e5);
  const decay = Math.exp(-ageHours / 96);
  const interaction = Math.log1p(input.comments * 2 + input.likes + input.favorites * 1.4);
  const velocity = input.commentGrowthRate * 0.22 + input.heatGrowthRate * 0.18;
  const score = input.keywordHits * 5.5 + interaction * 6.2 + velocity + decay * 18;
  return clamp(score);
}

export function calculateFomoScore(input: ScoreInput) {
  const fomoHitCount = countWords(input.text, fomoWords);
  const explosiveHitCount = countWords(input.text, explosiveWords);
  const commentVelocity = clamp(input.commentGrowthRate * 0.55, 0, 25);
  const heatGrowth = clamp(input.heatGrowthRate * 0.42, 0, 24);
  const fomoWordScore = clamp(fomoHitCount * 7, 0, 26);
  const explosiveScore = clamp(explosiveHitCount * 6, 0, 15);
  const crowding = clamp(Math.log1p(input.comments) * 1.6, 0, 10);

  return {
    score: clamp(commentVelocity + heatGrowth + fomoWordScore + explosiveScore + crowding),
    breakdown: {
      commentVelocity,
      heatGrowth,
      fomoWords: fomoWordScore,
      explosiveWords: explosiveScore,
      crowding
    }
  };
}

export function countWords(text: string, words: string[]) {
  return words.reduce((sum, word) => {
    const pattern = new RegExp(escapeRegExp(word), "gi");
    return sum + (text.match(pattern)?.length ?? 0);
  }, 0);
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
