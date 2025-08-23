import { db } from "@db";
import { feedback, learningStats } from "@shared/schema";
import { eq, and, sql } from "drizzle-orm";

// Bayesian learning system for adaptive AI generation
export class BayesianLearningSystem {
  
  // Update learning statistics based on user feedback
  static async updateLearningStats(feedbackData: {
    gifId: number;
    overallRating: number;
    objectQuality?: number;
    movementRealism?: number;
    environmentAccuracy?: number;
    lightingCoherence?: number;
    specificIssues?: Record<string, boolean>;
  }, generationParams: {
    style: string;
    quality: string;
    prompt: string;
  }) {
    
    const categories = [
      { category: 'object', rating: feedbackData.objectQuality, issues: ['object_distortion'] },
      { category: 'movement', rating: feedbackData.movementRealism, issues: ['unnatural_motion', 'temporal_inconsistency'] },
      { category: 'environment', rating: feedbackData.environmentAccuracy, issues: ['wrong_environment'] },
      { category: 'lighting', rating: feedbackData.lightingCoherence, issues: ['lighting_issues'] }
    ];

    for (const { category, rating, issues } of categories) {
      if (rating) {
        await this.updateHeuristicStats(category, 'base_generation', rating, generationParams);
        
        // Update specific issue tracking
        if (feedbackData.specificIssues) {
          for (const issue of issues) {
            if (feedbackData.specificIssues[issue]) {
              await this.updateHeuristicStats(category, `avoid_${issue}`, 1, generationParams); // Low rating for issues
            }
          }
        }
      }
    }
    
    // Update overall generation effectiveness
    await this.updateHeuristicStats('overall', 'generation_success', feedbackData.overallRating, generationParams);
  }

  // Update specific heuristic statistics using Bayesian inference
  private static async updateHeuristicStats(
    category: string,
    heuristic: string,
    rating: number,
    context: { style: string; quality: string; prompt: string }
  ) {
    const existing = await db.query.learningStats.findFirst({
      where: and(
        eq(learningStats.category, category),
        eq(learningStats.heuristic, heuristic)
      )
    });

    const isSuccess = rating >= 4; // 4-5 star ratings considered successful
    const contextMetadata = {
      style: context.style,
      quality: context.quality,
      common_prompts: [context.prompt.substring(0, 50)],
      effectiveness_trends: { [context.style]: rating }
    };

    if (existing) {
      // Bayesian update: combine prior with new evidence
      const newSuccessCount = existing.successCount + (isSuccess ? 1 : 0);
      const newTotalCount = existing.totalCount + 1;
      const newAverageRating = Math.round(
        ((existing.averageRating * existing.totalCount) + (rating * 100)) / newTotalCount
      );

      await db.update(learningStats)
        .set({
          successCount: newSuccessCount,
          totalCount: newTotalCount,
          averageRating: newAverageRating,
          lastUpdated: new Date(),
          contextMetadata: {
            ...existing.contextMetadata,
            ...contextMetadata,
            effectiveness_trends: {
              ...existing.contextMetadata?.effectiveness_trends,
              [context.style]: rating
            }
          }
        })
        .where(eq(learningStats.id, existing.id));
    } else {
      // Initialize new heuristic
      await db.insert(learningStats).values({
        category,
        heuristic,
        successCount: isSuccess ? 1 : 0,
        totalCount: 1,
        averageRating: rating * 100,
        contextMetadata
      });
    }
  }

  // Get adaptive prompt modifiers based on learned statistics
  static async getAdaptiveModifiers(
    style: string,
    quality: string,
    basePrompt: string
  ): Promise<{
    objectEnhancements: string[];
    movementEnhancements: string[];
    environmentEnhancements: string[];
    lightingEnhancements: string[];
    avoidanceTerms: string[];
  }> {
    
    const stats = await db.query.learningStats.findMany({
      where: sql`${learningStats.contextMetadata}->>'style' = ${style} OR ${learningStats.contextMetadata} IS NULL`
    });

    const enhancements = {
      objectEnhancements: [],
      movementEnhancements: [],
      environmentEnhancements: [],
      lightingEnhancements: [],
      avoidanceTerms: []
    };

    // Apply Bayesian weighting to determine best modifiers
    for (const stat of stats) {
      const effectiveness = stat.averageRating / 100; // Convert back to 1-5 scale
      const confidence = Math.min(stat.totalCount / 10, 1); // Confidence based on sample size
      const weight = effectiveness * confidence;

      if (weight >= 0.7) { // High confidence and effectiveness
        switch (stat.category) {
          case 'object':
            if (stat.heuristic === 'base_generation') {
              enhancements.objectEnhancements.push('detailed textures', 'realistic proportions', 'consistent form');
            }
            break;
          case 'movement':
            if (stat.heuristic === 'base_generation') {
              enhancements.movementEnhancements.push('natural physics', 'smooth motion', 'realistic momentum');
            } else if (stat.heuristic.startsWith('avoid_')) {
              enhancements.avoidanceTerms.push(stat.heuristic.replace('avoid_', ''));
            }
            break;
          case 'environment':
            if (stat.heuristic === 'base_generation') {
              enhancements.environmentEnhancements.push('contextually appropriate setting', 'detailed background', 'environmental coherence');
            }
            break;
          case 'lighting':
            if (stat.heuristic === 'base_generation') {
              enhancements.lightingEnhancements.push('consistent lighting', 'natural shadows', 'proper illumination');
            }
            break;
        }
      }
    }

    return enhancements;
  }

  // Get personalized quality recommendations
  static async getQualityRecommendations(style: string): Promise<{
    recommendedQuality: string;
    reasoning: string;
  }> {
    const overallStats = await db.query.learningStats.findMany({
      where: and(
        eq(learningStats.category, 'overall'),
        sql`${learningStats.contextMetadata}->>'style' = ${style}`
      )
    });

    if (overallStats.length === 0) {
      return {
        recommendedQuality: 'standard',
        reasoning: 'No previous feedback data available for this style'
      };
    }

    // Find quality level with highest success rate
    const qualityPerformance = overallStats.reduce((acc, stat) => {
      const quality = stat.contextMetadata?.quality || 'standard';
      const successRate = stat.successCount / stat.totalCount;
      
      if (!acc[quality] || successRate > acc[quality].rate) {
        acc[quality] = { rate: successRate, count: stat.totalCount };
      }
      return acc;
    }, {} as Record<string, { rate: number; count: number }>);

    const bestQuality = Object.entries(qualityPerformance)
      .filter(([_, data]) => data.count >= 2) // Require at least 2 samples
      .sort(([, a], [, b]) => b.rate - a.rate)[0];

    if (bestQuality) {
      return {
        recommendedQuality: bestQuality[0],
        reasoning: `Based on ${bestQuality[1].count} previous generations, ${bestQuality[0]} quality achieved ${Math.round(bestQuality[1].rate * 100)}% success rate for ${style} style`
      };
    }

    return {
      recommendedQuality: 'standard',
      reasoning: 'Insufficient data for quality recommendation'
    };
  }
}

// Storage functions for feedback
export const feedbackStorage = {
  async saveFeedback(feedbackData: {
    gifId: number;
    userId?: number;
    overallRating: number;
    objectQuality?: number;
    movementRealism?: number;
    environmentAccuracy?: number;
    lightingCoherence?: number;
    textualFeedback?: string;
    specificIssues?: Record<string, boolean>;
  }) {
    const [savedFeedback] = await db.insert(feedback).values(feedbackData).returning();
    return savedFeedback;
  },

  async getFeedbackForGif(gifId: number) {
    return await db.query.feedback.findMany({
      where: eq(feedback.gifId, gifId),
      orderBy: (feedback, { desc }) => [desc(feedback.createdAt)]
    });
  },

  async getAverageFeedback(gifId: number) {
    const result = await db
      .select({
        avgOverall: sql<number>`AVG(${feedback.overallRating})`,
        avgObject: sql<number>`AVG(${feedback.objectQuality})`,
        avgMovement: sql<number>`AVG(${feedback.movementRealism})`,
        avgEnvironment: sql<number>`AVG(${feedback.environmentAccuracy})`,
        avgLighting: sql<number>`AVG(${feedback.lightingCoherence})`,
        count: sql<number>`COUNT(*)`
      })
      .from(feedback)
      .where(eq(feedback.gifId, gifId));

    return result[0];
  }
};