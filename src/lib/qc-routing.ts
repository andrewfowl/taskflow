// Agreement-driven QC routing (risk-based sampling, docs/data-production.md §8).
// Decides, at the moment an item completes its K annotations, whether a human
// must review it or the annotators' consensus is strong enough to accept it
// outright — with a random audit sample kept in the review queue as the safety
// valve (and the signal for tuning the threshold). Pure and dependency-free.

export type RouteDecision = "AUTO_ACCEPT" | "REVIEW" | "SAMPLED_REVIEW";

export function routeItem(opts: {
  // Inter-annotator agreement (0..1), or null when there is nothing to
  // corroborate (fewer than 2 annotations).
  agreement: number | null;
  // Gold items carry an expected answer precisely so a human checks calibration.
  isGold: boolean;
  // Batch policy: null = feature off, review every item.
  autoAcceptThreshold: number | null;
  // Fraction of auto-accept-eligible items still audited by a human (0..1).
  reviewSampleRate: number;
  // Injectable for tests / determinism; defaults to Math.random.
  random?: () => number;
}): RouteDecision {
  const { agreement, isGold, autoAcceptThreshold, reviewSampleRate } = opts;
  if (autoAcceptThreshold == null) return "REVIEW";
  if (isGold) return "REVIEW";
  if (agreement == null || agreement < autoAcceptThreshold) return "REVIEW";
  const roll = (opts.random ?? Math.random)();
  return roll < reviewSampleRate ? "SAMPLED_REVIEW" : "AUTO_ACCEPT";
}
