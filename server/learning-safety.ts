import { db } from "@db";

/**
 * Safety system to prevent the learning algorithm from making animations worse
 * when ratings are consistently low
 */
export class LearningSafety {
  /**
   * Check if learning adjustments should be disabled based on recent performance
   */
  static async shouldDisableLearning(): Promise<boolean> {
    // Get the last 5 feedback entries
    const recentFeedback = await db.query.feedback.findMany({
      limit: 5,
      orderBy: (feedback, { desc }) => [desc(feedback.createdAt)]
    });

    if (recentFeedback.length < 3) {
      return false; // Not enough data, allow learning
    }

    // Calculate average rating
    const avgRating = recentFeedback.reduce((sum, f) => sum + f.overallRating, 0) / recentFeedback.length;
    
    // Count how many have critical issues
    const criticalIssueCount = recentFeedback.filter(f => {
      const issues = f.specificIssues as Record<string, boolean> || {};
      return issues.morphing || issues.object_distortion || issues.temporal_inconsistency;
    }).length;

    // Disable learning if:
    // 1. Average rating is very low (< 2.0)
    // 2. More than 60% have critical issues
    return avgRating < 2.0 || (criticalIssueCount / recentFeedback.length) > 0.6;
  }

  /**
   * Get safe baseline parameters when learning is disabled
   */
  static getSafeParameters() {
    return {
      guidanceAdjustment: 0,
      stepsAdjustment: 0,
      condAugAdjustment: 0,
      promptEnhancements: ['high quality', 'professional', 'detailed']
    };
  }

  /**
   * Log safety decisions for debugging
   */
  static async logSafetyDecision(disabled: boolean, reason?: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Learning Safety: ${disabled ? 'DISABLED' : 'ENABLED'} ${reason ? `- ${reason}` : ''}`);
  }
}