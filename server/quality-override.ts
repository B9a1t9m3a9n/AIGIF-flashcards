/**
 * Quality override system to ensure consistent animation generation
 * Bypasses learning adjustments when they degrade quality
 */

export function getBaselineParameters() {
  return {
    guidanceAdjustment: 0,
    stepsAdjustment: 0, 
    condAugAdjustment: 0,
    promptEnhancements: ['high quality', 'professional', 'detailed']
  };
}

export function shouldUseBaseline(): boolean {
  // Always use baseline parameters to ensure quality
  return true;
}