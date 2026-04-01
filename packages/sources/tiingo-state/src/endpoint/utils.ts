/**
 * @deprecated This function was a no-op due to a factory-function bug: it returned a
 * transform function instead of executing one, so toLowerCase() never ran.
 * Case normalization is now handled at the framework level via NORMALIZE_CASE_INPUTS.
 * Kept as a stub for backward compatibility; remove on next major version.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
export function tiingoCommonSubscriptionRequestTransform() {}
