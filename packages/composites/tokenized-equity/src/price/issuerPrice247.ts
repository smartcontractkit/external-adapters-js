import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { AssetRequest, IssuerName, issuers, MULTIPLIER_DECIMALS } from '../issuers'
import { Settings } from '../issuers/issuer'
import { ChainProviders } from '../lib/chains'
import {
  DataEngineV11Data,
  getDataEngineResult,
  PriceField,
  TargetEndpoint,
} from '../lib/dataEngine'
import { scaleDecimals } from '../lib/decimals'
import {
  getFallbackSessionTransitions,
  getGatingTimezone,
} from '../lib/session/fallbackSessionSchedule'
import { gateIssuer247Report } from '../lib/session/issuer247Gating'
import { parseMarketSessionOverride } from '../lib/session/sessionStart'
import { getSessionTransitionsCached, SessionTransition } from '../lib/session/tradingHoursSession'

const logger = makeLogger('IssuerPrice247')

type PriceParams = {
  settings: Settings
  requester: Requester
  providers: ChainProviders
  targetEndpoint: TargetEndpoint
  feedId: string
  resultPath: PriceField
  decimals: number
  multiplier?: AssetRequest & { issuer: IssuerName }
  marketSessionOverride?: string
}

// Session-start gating (TDD: docs/issuer-247-session-start-gating-tdd.md): the 24/7
// feeds are NYSE-tokenized equities, so the gate always resolves against the nyse
// schedule — tradinghours is queried with type '24/5' (its only nyse fin_id), while
// the fallback uses the '24/7' view, which carries phase end times from which
// closedSpanStartMs derives the closed-span (weekend/holiday) start. The asymmetry
// is safe because the '24/5' and '24/7' fallback views are identical — pinned by a
// view-equality test in fallbackSessionSchedule.test.ts so a future divergence
// fails loudly.
const GATE_MARKET = 'nyse'
const GATE_TRADINGHOURS_TYPE = '24/5'
const GATE_FALLBACK_TYPE = '24/7'

// When gating is enabled: fetch the tradinghours schedule (through the shared
// stale-while-revalidate cache, falling back to the hard-coded per-market schedule
// when no schedule has ever been fetched) and reject the report when its
// lastSeenTimestampNs predates the start of the session its marketStatus declares.
// Returns the gatingSessionSource for the response; undefined when gating is off.
// The marketSessionOverride 400s live in the endpoint's customInputValidation, so
// they are rejected before any upstream call.
const gateReport = async (
  settings: Settings,
  requester: Requester,
  marketSessionOverride: string | undefined,
  data: DataEngineV11Data,
): Promise<{ gatingSessionSource?: 'TRADINGHOURS' | 'FALLBACK' }> => {
  if (!settings.ISSUER_247_SESSION_START_GATING_ENABLED) {
    return {}
  }
  const nowMs = Date.now()
  const timezone = getGatingTimezone(GATE_MARKET, GATE_FALLBACK_TYPE)
  if (timezone === undefined) {
    // Unreachable today (nyse/24/7 has a fallback entry); fail fast with a clear
    // message rather than passing a silent undefined into the tradinghours fetch.
    throw new Error(
      `No gating timezone configured for market=${GATE_MARKET} type=${GATE_FALLBACK_TYPE}`,
    )
  }
  const tradingHoursUrl = settings.SOURCE_ADAPTER_URL.get('TRADING_HOURS')

  let transitions: SessionTransition[] | undefined
  try {
    const cached = await getSessionTransitionsCached(
      tradingHoursUrl,
      requester,
      timezone,
      GATE_MARKET,
      GATE_TRADINGHOURS_TYPE,
      settings.TRADINGHOURS_SESSION_CACHE_TTL_MS,
    )
    if (cached.stale) {
      logger.debug(
        `Gating on a cached tradinghours schedule past its TTL (refreshedAtMs=${cached.refreshedAtMs}, ttlMs=${cached.ttlMs}); background refresh in flight`,
      )
    }
    transitions = cached.value
  } catch (e) {
    logger.error(
      `TradingHoursEA request failed; 24/7 session-start gating uses the hard-coded fallback schedule: ${e}`,
    )
  }

  const overrideStatus = parseMarketSessionOverride(marketSessionOverride)

  return gateIssuer247Report({
    marketStatus: data.marketStatus,
    lastSeenTimestampNs: data.lastSeenTimestampNs,
    nowMs,
    transitions,
    fallbackTransitions: getFallbackSessionTransitions(GATE_MARKET, GATE_FALLBACK_TYPE, nowMs),
    ...(overrideStatus !== undefined ? { marketSessionOverride: overrideStatus } : {}),
  })
}

/**
 * The 24/7 stream price, times the issuer's on-chain multiplier when one is
 * requested. The multiplied price is truncated to the output decimals only once.
 */
// Explicit union so the multiplied-only fields (rawMultipliedPrice, multiplier)
// are present iff a multiplier was requested — the non-multiplied variant types
// them `never` instead of leaving them as optional-but-maybe-present.
type GatingTelemetry = {
  gatingSessionSource?: 'TRADINGHOURS' | 'FALLBACK'
}
export type Issuer247Price = GatingTelemetry & {
  result: string
  decimals: number
  rawPrice: string
  rawPriceDecimals: number
  rawMultipliedPrice?: never
  rawMultipliedPriceDecimals?: never
  dataEngine: DataEngineV11Data
  multiplier?: never
}
export type Issuer247MultipliedPrice = GatingTelemetry & {
  result: string
  decimals: number
  rawPrice: string
  rawPriceDecimals: number
  rawMultipliedPrice: string
  rawMultipliedPriceDecimals: number
  dataEngine: DataEngineV11Data
  multiplier: {
    issuer: string
    network?: string
    value: string
    decimals: number
  }
}
export const calculatePrice = async ({
  settings,
  providers,
  multiplier,
  ...param
}: PriceParams): Promise<Issuer247Price | Issuer247MultipliedPrice> => {
  // Validated in endpoint's customInputValidation
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const stream = { ...param, url: settings.SOURCE_ADAPTER_URL.get('DATA_ENGINE')! }

  if (!multiplier) {
    const { result, data } = await getDataEngineResult(stream)
    const gating = await gateReport(settings, param.requester, param.marketSessionOverride, data)
    return {
      result,
      decimals: param.decimals,
      rawPrice: result,
      rawPriceDecimals: param.decimals,
      dataEngine: data,
      ...gating,
    }
  }

  const issuer = issuers[multiplier.issuer]
  const provider = providers.get(issuer.chain(settings, multiplier))

  // Request the price in the multiplier's decimals so both share a scale. The
  // multiplier RPC does not depend on the price fetch, so it overlaps it: with
  // gating OFF the two run in parallel (the pre-gating behavior — no added
  // latency on the default path); with gating ON the multiplier RPC is started
  // only after the gate passes, so a report the gate rejects does not pay for
  // the multiplier fetch.
  const gatingEnabled = settings.ISSUER_247_SESSION_START_GATING_ENABLED
  // startMultiplierFetch wraps issuer.getMultiplier so the RPC can be kicked off
  // eagerly (gating off — it overlaps the price fetch) or started lazily after
  // the gate passes (gating on). The .catch defers any rejection into the
  // awaited result below, so an eagerly started fetch cannot surface as an
  // unhandled rejection if the price path throws first.
  const startMultiplierFetch = (): Promise<bigint | Error> =>
    issuer.getMultiplier(multiplier, provider).catch((e) => e as Error)
  const multiplierPromise = gatingEnabled ? undefined : startMultiplierFetch()
  const price = await getDataEngineResult({ ...stream, decimals: MULTIPLIER_DECIMALS })
  const gating = await gateReport(
    settings,
    param.requester,
    param.marketSessionOverride,
    price.data,
  )
  const multiplierResult = await (multiplierPromise ?? startMultiplierFetch())
  if (multiplierResult instanceof Error) {
    throw multiplierResult
  }
  const value = multiplierResult

  const rawMultipliedPrice = BigInt(price.result) * value
  const rawMultipliedPriceDecimals = 2 * MULTIPLIER_DECIMALS

  return {
    result: scaleDecimals(
      rawMultipliedPrice,
      rawMultipliedPriceDecimals,
      param.decimals,
    ).toString(),
    decimals: param.decimals,
    rawPrice: price.result,
    rawPriceDecimals: MULTIPLIER_DECIMALS,
    rawMultipliedPrice: rawMultipliedPrice.toString(),
    rawMultipliedPriceDecimals,
    dataEngine: price.data,
    ...gating,
    multiplier: {
      issuer: multiplier.issuer,
      network: multiplier.network,
      value: value.toString(),
      decimals: MULTIPLIER_DECIMALS,
    },
  }
}
