// World Cup 2026 - AI Prediction Service
// Uses LLM to generate match predictions based on team statistics

import { invokeLLM } from "./_core/llm";
import type { WorldCupMatch } from "./data/worldcupMatches";

export interface AIPrediction {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  predictedHomeWinOdds: number;
  predictedAwayWinOdds: number;
  confidence: number; // 0-100
  reasoning: string;
  keyFactors: string[];
  historicalContext?: string;
}

/**
 * Generate AI prediction for a World Cup match using LLM
 */
export async function generateMatchPrediction(
  match: WorldCupMatch
): Promise<AIPrediction> {
  const prompt = `You are an expert football (soccer) analyst specializing in World Cup predictions.

Analyze this World Cup 2026 match and provide a prediction:

**Match Details:**
- Home Team: ${match.homeTeam.name} (FIFA Rank: #${match.homeTeam.fifaRank})
- Away Team: ${match.awayTeam.name} (FIFA Rank: #${match.awayTeam.fifaRank})
- Stage: ${match.stage}
- Group: ${match.group || "N/A"}
- Stadium: ${match.stadium}, ${match.city}
- Kickoff: ${match.kickoffUtc}

**Current Market Odds:**
- Home Win: ${match.yesOdds}%
- Away Win: ${match.noOdds}%

Based on:
1. FIFA Rankings and recent form
2. Head-to-head history (if applicable)
3. Team composition and key players
4. Tactical matchups
5. Home/away advantage
6. Tournament stage dynamics

Provide your prediction in this exact JSON format:
{
  "predictedHomeWinOdds": <number 0-100>,
  "predictedAwayWinOdds": <number 0-100>,
  "confidence": <number 0-100>,
  "reasoning": "<brief explanation of prediction>",
  "keyFactors": ["<factor1>", "<factor2>", "<factor3>"],
  "historicalContext": "<any relevant historical context>"
}

Ensure predictedHomeWinOdds + predictedAwayWinOdds = 100.
Confidence should reflect how certain you are about this prediction.`;

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "You are an expert football analyst. Always respond with valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ] as const,
      response_format: {
        type: "json_schema" as const,
        json_schema: {
          name: "match_prediction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              predictedHomeWinOdds: {
                type: "number",
                description: "Predicted odds for home team win (0-100)",
              },
              predictedAwayWinOdds: {
                type: "number",
                description: "Predicted odds for away team win (0-100)",
              },
              confidence: {
                type: "number",
                description: "Confidence level of prediction (0-100)",
              },
              reasoning: {
                type: "string",
                description: "Brief explanation of the prediction",
              },
              keyFactors: {
                type: "array",
                items: { type: "string" },
                description: "Key factors influencing the prediction",
              },
              historicalContext: {
                type: "string",
                description: "Relevant historical context",
              },
            },
            required: [
              "predictedHomeWinOdds",
              "predictedAwayWinOdds",
              "confidence",
              "reasoning",
              "keyFactors",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content || typeof content !== "string") {
      throw new Error("No response from LLM");
    }

    const prediction = JSON.parse(content);

    return {
      matchId: match.id,
      homeTeam: match.homeTeam.name,
      awayTeam: match.awayTeam.name,
      predictedHomeWinOdds: Math.round(prediction.predictedHomeWinOdds),
      predictedAwayWinOdds: Math.round(prediction.predictedAwayWinOdds),
      confidence: Math.min(100, Math.max(0, Math.round(prediction.confidence))),
      reasoning: prediction.reasoning || "",
      keyFactors: prediction.keyFactors || [],
      historicalContext: prediction.historicalContext,
    };
  } catch (error) {
    console.error("Error generating AI prediction:", error);
    // Fallback to simple heuristic-based prediction
    return generateFallbackPrediction(match);
  }
}

/**
 * Fallback prediction using simple heuristics when LLM fails
 */
function generateFallbackPrediction(match: WorldCupMatch): AIPrediction {
  const rankDiff = match.awayTeam.fifaRank - match.homeTeam.fifaRank;
  const homeAdvantage = 5; // 5% home advantage

  // Simple ELO-like calculation
  let homeOdds = 50 + homeAdvantage;
  if (rankDiff > 0) {
    homeOdds += Math.min(rankDiff * 0.5, 15);
  } else {
    homeOdds -= Math.min(Math.abs(rankDiff) * 0.5, 15);
  }

  homeOdds = Math.max(20, Math.min(80, homeOdds));
  const awayOdds = 100 - homeOdds;

  return {
    matchId: match.id,
    homeTeam: match.homeTeam.name,
    awayTeam: match.awayTeam.name,
    predictedHomeWinOdds: Math.round(homeOdds),
    predictedAwayWinOdds: Math.round(awayOdds),
    confidence: 60,
    reasoning: `Based on FIFA rankings: ${match.homeTeam.name} (#${match.homeTeam.fifaRank}) vs ${match.awayTeam.name} (#${match.awayTeam.fifaRank}). Home advantage factored in.`,
    keyFactors: [
      `FIFA Ranking Difference: ${Math.abs(rankDiff)} positions`,
      "Home Field Advantage",
      "Tournament Stage: " + match.stage,
    ],
  };
}

/**
 * Batch generate predictions for multiple matches
 */
export async function generateBatchPredictions(
  matches: WorldCupMatch[]
): Promise<AIPrediction[]> {
  const predictions: AIPrediction[] = [];

  // Process in batches to avoid rate limiting
  const batchSize = 3;
  for (let i = 0; i < matches.length; i += batchSize) {
    const batch = matches.slice(i, i + batchSize);
    const batchPredictions = await Promise.all(
      batch.map((match) => generateMatchPrediction(match))
    );
    predictions.push(...batchPredictions);

    // Add delay between batches
    if (i + batchSize < matches.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return predictions;
}

/**
 * Calculate prediction accuracy metrics
 */
export function calculatePredictionMetrics(
  predictions: AIPrediction[],
  actualResults?: Record<string, "home" | "away" | "draw">
) {
  const totalPredictions = predictions.length;
  const avgConfidence =
    predictions.reduce((sum, p) => sum + p.confidence, 0) / totalPredictions;

  let correctPredictions = 0;
  if (actualResults) {
    for (const prediction of predictions) {
      const result = actualResults[prediction.matchId];
      if (result === "home" && prediction.predictedHomeWinOdds > 50) {
        correctPredictions++;
      } else if (result === "away" && prediction.predictedAwayWinOdds > 50) {
        correctPredictions++;
      }
    }
  }

  return {
    totalPredictions,
    avgConfidence: Math.round(avgConfidence),
    accuracy: actualResults
      ? Math.round((correctPredictions / totalPredictions) * 100)
      : null,
  };
}
