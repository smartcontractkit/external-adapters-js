/**
 * Scales an integer from `fromDecimals` to `toDecimals`, truncating when
 * scaling down.
 */
export const scaleDecimals = (value: bigint, fromDecimals: number, toDecimals: number) =>
  toDecimals >= fromDecimals
    ? value * 10n ** BigInt(toDecimals - fromDecimals)
    : value / 10n ** BigInt(fromDecimals - toDecimals)
