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
      tradingEvent { category unixTimestamp }
    }
  }`
}

/**
 * Map SIX trading event categories to v11 marketStatus uint32 enum.
 *
 * v11 marketStatus values:
 *   0 = unknown
 *   1 = pre-market
 *   2 = open
 *   3 = post-market
 *   4 = closed
 *
 * SIX category strings documented:
 *   - OPEN_MARKET / CONTINUOUS_TRADING / TRADING -> open
 *   - PRE_OPEN / OPENING_AUCTION / PRE_TRADING -> pre-market
 *   - POST_TRADING / CLOSING_AUCTION / POST_CLOSE -> post-market
 *   - CLOSED_MARKET / CLOSED / NO_TRADING -> closed
 *   - else -> unknown
 */
export const MARKET_STATUS_UNKNOWN = 0
export const MARKET_STATUS_PRE_MARKET = 1
export const MARKET_STATUS_OPEN = 2
export const MARKET_STATUS_POST_MARKET = 3
export const MARKET_STATUS_CLOSED = 4

const OPEN_CATEGORIES = new Set(['OPEN_MARKET', 'CONTINUOUS_TRADING', 'TRADING'])
const PRE_MARKET_CATEGORIES = new Set(['PRE_OPEN', 'OPENING_AUCTION', 'PRE_TRADING'])
const POST_MARKET_CATEGORIES = new Set(['POST_TRADING', 'CLOSING_AUCTION', 'POST_CLOSE'])
const CLOSED_CATEGORIES = new Set(['CLOSED_MARKET', 'CLOSED', 'NO_TRADING'])

export const mapTradingEventToMarketStatus = (category: string | undefined): number => {
  if (!category) return MARKET_STATUS_UNKNOWN
  const c = category.toUpperCase()
  if (OPEN_CATEGORIES.has(c)) return MARKET_STATUS_OPEN
  if (PRE_MARKET_CATEGORIES.has(c)) return MARKET_STATUS_PRE_MARKET
  if (POST_MARKET_CATEGORIES.has(c)) return MARKET_STATUS_POST_MARKET
  if (CLOSED_CATEGORIES.has(c)) return MARKET_STATUS_CLOSED
  return MARKET_STATUS_UNKNOWN
}

/**
 * Build a GraphQL mutation to close a stream.
 */
export const buildCloseStreamQuery = (ticker: string, bc: string): string => {
  const streamId = `${ticker}_${bc}`
  return `mutation { closeStream(streamId: "${streamId}") { type streamId } }`
}

/**
 * Convert SIX unix timestamp (seconds with microsecond precision) to nanoseconds.
 * SIX returns e.g. 1683551220.652753 -> needs to become 1683551220652753000n
 */
export const toNanoseconds = (unixTimestamp: number | undefined): number | undefined => {
  if (unixTimestamp == null) return undefined
  return Math.round(unixTimestamp * 1e9)
}

/**
 * Convert SIX unix timestamp (seconds with microsecond precision) to milliseconds.
 */
export const toMilliseconds = (unixTimestamp: number | undefined): number | undefined => {
  if (unixTimestamp == null) return undefined
  return Math.round(unixTimestamp * 1e3)
}
