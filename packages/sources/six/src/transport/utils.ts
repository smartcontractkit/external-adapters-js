/**
 * Build a GraphQL subscription query for SIX streaming market data.
 */
export const buildSubscriptionQuery = (
  ticker: string,
  bc: string,
  conflationPeriod: string,
): string => {
  const streamId = `${ticker}_${bc}`
  return `subscription {
    startStream(
      scheme: TICKER_BC,
      ids: ["${streamId}"],
      streamId: "${streamId}",
      conflationType: INTERVAL,
      conflationPeriod: "${conflationPeriod}"
    ) {
      type
      requestedId
      streamId
      requestedScheme
      last { value size unixTimestamp }
      bestBid { value size unixTimestamp }
      bestAsk { value size unixTimestamp }
      mid { value unixTimestamp }
      volume { value unixTimestamp }
    }
  }`
}

/**
 * Build a GraphQL mutation to close a stream.
 */
export const buildCloseStreamQuery = (ticker: string, bc: string): string => {
  const streamId = `${ticker}_${bc}`
  return `mutation { closeStream(streamId: "${streamId}") { type streamId } }`
}

/**
 * v11 marketStatus uint32 enum values.
 *
 *   0 = unknown
 *   1 = pre-market
 *   2 = open
 *   3 = post-market
 *   4 = closed
 */
export const MARKET_STATUS_UNKNOWN = 0
export const MARKET_STATUS_PRE_MARKET = 1
export const MARKET_STATUS_OPEN = 2
export const MARKET_STATUS_POST_MARKET = 3
export const MARKET_STATUS_CLOSED = 4

/**
 * Map SIX Market Base `marketStatus` enum (ACTIVE/INACTIVE/REFERENCE_ONLY/OTHER)
 * to the Chainlink Data Streams v11 RWA Advanced `marketStatus` uint32.
 */
const MARKET_BASE_STATUS_MAP: Record<string, number> = {
  ACTIVE: MARKET_STATUS_OPEN,
  INACTIVE: MARKET_STATUS_CLOSED,
  REFERENCE_ONLY: MARKET_STATUS_UNKNOWN,
  OTHER: MARKET_STATUS_UNKNOWN,
}

export const mapMarketBaseStatusToV11 = (status: string | undefined): number => {
  if (!status) return MARKET_STATUS_UNKNOWN
  return MARKET_BASE_STATUS_MAP[status.toUpperCase()] ?? MARKET_STATUS_UNKNOWN
}

/**
 * Convert SIX unix timestamp (seconds with microsecond precision) to milliseconds.
 */
export const toMilliseconds = (unixTimestamp: number | undefined): number | undefined => {
  if (unixTimestamp == null) return undefined
  return Math.round(unixTimestamp * 1e3)
}
