export type FeedId = string

export interface Feed {
  feedID: FeedId
  name: string
  decimals: number
  asset: string
  quoteAsset: string
}

export interface Report {
  feedID: FeedId
  fullReport: string
  validFromTimestamp: number
  observationsTimestamp: number
}

/**
 * Market status indicator for V4 reports (Real World Assets).
 * Indicates whether the market for the asset is currently open, closed or unknown.
 */
export enum MarketStatus {
  /** Market status is unknown */
  UNKNOWN = 0,
  /** Market is closed */
  INACTIVE = 1,
  /** Market is open */
  ACTIVE = 2,
}

/**
 * Base interface for all reports before decoding
 */
export interface BaseReport {
  /** The unique identifier of the feed */
  feedID: string
  /** Earliest timestamp for which the report is applicable */
  validFromTimestamp: number
  /** Latest timestamp for which the report is applicable */
  observationsTimestamp: number
  /** The raw report data in hex format */
  fullReport: string
}

/**
 * Common fields present in all decoded Data Streams reports.
 */
export interface DecodedReportFields {
  nativeFee: bigint
  linkFee: bigint
  expiresAt: number
}

/**
 * Decoded V2 report format.
 */
export interface DecodedV2Report extends DecodedReportFields {
  /** Report format version identifier */
  version: 'V2'
  price: bigint
}

/**
 * Decoded V3 report format (Crypto Streams).
 * Report format for cryptocurrency markets that includes bid/ask spreads
 */
export interface DecodedV3Report extends DecodedReportFields {
  /** Report format version identifier */
  version: 'V3'
  price: bigint
  bid: bigint
  ask: bigint
}

/**
 * Decoded V4 report format (Real World Assets).
 *
 * Report format for real-world assets that includes market status information
 * to indicate when the underlying market is open, closed or unknown.
 */
export interface DecodedV4Report extends DecodedReportFields {
  /** Report format version identifier */
  version: 'V4'
  price: bigint
  marketStatus: MarketStatus
}

/**
 * Decoded V5 report format.
 * Interest rate with timestamp and duration metadata.
 */
export interface DecodedV5Report extends DecodedReportFields {
  version: 'V5'
  /** Interest rate value (int192) */
  rate: bigint
  /** Timestamp when the rate was observed */
  timestamp: number
  /** Duration for which the rate applies */
  duration: number
}

/**
 * Decoded V6 report format.
 * Multiple price values in a single payload.
 */
export interface DecodedV6Report extends DecodedReportFields {
  version: 'V6'
  price: bigint
  price2: bigint
  price3: bigint
  price4: bigint
  price5: bigint
}

/**
 * Decoded V7 report format.
 * Exchange rate report.
 */
export interface DecodedV7Report extends DecodedReportFields {
  version: 'V7'
  exchangeRate: bigint
}

/**
 * Decoded V8 report format (Non-OTC RWA Data Streams).
 */
export interface DecodedV8Report extends DecodedReportFields {
  version: 'V8'
  /** DON's consensus median price (18 decimal precision) */
  midPrice: bigint
  /** Timestamp of the last valid price update */
  lastUpdateTimestamp: number
  /** Market status - 0 (Unknown), 1 (Closed), 2 (Open) */
  marketStatus: MarketStatus
}

/**
 * Decoded V9 report format (NAV Data Streams).
 */
export interface DecodedV9Report extends DecodedReportFields {
  version: 'V9'
  /** DON's consensus NAV per share (18 decimal precision) */
  navPerShare: bigint
  /** Timestamp for the date the NAV report was produced */
  navDate: number
  /** DON's consensus for the total Assets Under Management (18 decimal precision) */
  aum: bigint
  /** Emergency pause flag (0 = normal, 1 = paused - do not consume NAV data) */
  ripcord: number
}

/**
 * Decoded V10 report format (Tokenized Equity).
 * Provides pricing data with multipliers for corporate actions and 24/7 tokenized pricing.
 */
export interface DecodedV10Report extends DecodedReportFields {
  version: 'V10'
  price: bigint
  /** Timestamp of the last valid price update */
  lastUpdateTimestamp: number
  /** Market status - 0 (Unknown), 1 (Closed), 2 (Open) */
  marketStatus: MarketStatus
  /** Currently applied multiplier accounting for past corporate actions */
  currentMultiplier: bigint
  /** Multiplier to be applied at the `activationDateTime` (set to 0 if none is scheduled) */
  newMultiplier: bigint
  /** When the next corporate action takes effect (set to 0 if none is scheduled) */
  activationDateTime: number
  /** 24/7 tokenized equity price */
  tokenizedPrice: bigint
}

/**
 * Complete decoded report structure received from Data Streams.
 *
 * This union type represents any valid decoded report format. The version field
 * can be used to determine the specific format and access version-specific fields.
 */
export type DecodedReport = (
  | DecodedV2Report
  | DecodedV3Report
  | DecodedV4Report
  | DecodedV5Report
  | DecodedV6Report
  | DecodedV7Report
  | DecodedV8Report
  | DecodedV9Report
  | DecodedV10Report
) & {
  /** Feed ID this report belongs to */
  feedID: string
  /** Earliest timestamp this report is valid for */
  validFromTimestamp: number
  /** Latest timestamp this report applies to */
  observationsTimestamp: number
}
