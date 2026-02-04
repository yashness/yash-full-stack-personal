/**
 * Feature flags configuration.
 * Features are controlled via environment variables for maximum flexibility.
 * This allows features to be enabled/disabled without regenerating the project.
 *
 * Environment variables:
 * - NEXT_PUBLIC_FEATURE_COPILOT: Enable AI copilot chat interface
 * - NEXT_PUBLIC_FEATURE_AUTH: Enable authentication (via Clerk)
 * - NEXT_PUBLIC_FEATURE_CANVAS: Enable agentic canvas interface
 * - NEXT_PUBLIC_FEATURE_FLOW_BUILDER: Enable visual flow builder
 * - NEXT_PUBLIC_FEATURE_MCP_CREATOR: Enable MCP (Model Context Protocol) creator
 * - NEXT_PUBLIC_FEATURE_SKILL_CREATOR: Enable skill/agent creator
 * - NEXT_PUBLIC_FEATURE_PRICING: Enable pricing/billing pages
 * - NEXT_PUBLIC_FEATURE_ADMIN: Enable admin dashboard
 */

/**
 * Parse boolean environment variable with fallback
 */
function parseEnvBool(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Feature flags - configure via environment variables
 */
export const FEATURES = {
  // Core features
  copilot: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_COPILOT, true),
  auth: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_AUTH, true),

  // Advanced AI features
  canvas: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_CANVAS, false),
  flowBuilder: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_FLOW_BUILDER, false),
  mcpCreator: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_MCP_CREATOR, false),
  skillCreator: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_SKILL_CREATOR, false),

  // Business features
  pricing: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_PRICING, true),
  admin: parseEnvBool(process.env.NEXT_PUBLIC_FEATURE_ADMIN, false),
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * Check if a feature is enabled.
 */
export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature];
}

/**
 * Get all enabled features (useful for debugging)
 */
export function getEnabledFeatures(): FeatureKey[] {
  return (Object.keys(FEATURES) as FeatureKey[]).filter(
    (key) => FEATURES[key]
  );
}
