import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

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
import { getSessionTransitions, SessionTransition } from '../lib/session/tradingHoursSession'

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
// closedSpanStartMs derives the closed-span (weekend/holiday) start.
const GATE_MARKET = 'nyse'
const GATE_TRADINGHOURS_TYPE = '24/5'
const GATE_FALLBACK_TYPE = '24/7'

// When gating is enabled: fetch the tradinghours schedule (falling back to the
// hard-coded per-market schedule) and reject the report when its
// lastSeenTimestampNs predates the start of the session its marketStatus declares.
// Returns the gatingSessionSource for the response; undefined when gating is off.
const gateReport = async (
  settings: Settings,
  requester: Requester,
  marketSessionOverride: string | undefined,
  data: DataEngineV11Data,
): Promise<{ gatingSessionSource?: 'TRADINGHOURS' | 'FALLBACK' }> => {
  // The override is a staging/test hook; reject it explicitly unless it has been
  // opted into via config, and again when the check it hooks into is off, instead
  // of silently ignoring it (mirrors the 24/5 validation in smoothedPrice).
  if (marketSessionOverride && !settings.ALLOW_MARKET_SESSION_OVERRIDE) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Parameter marketSessionOverride requires ALLOW_MARKET_SESSION_OVERRIDE=true`,
    })
  }
  if (marketSessionOverride && !settings.ISSUER_247_SESSION_START_GATING_ENABLED) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Parameter marketSessionOverride requires ISSUER_247_SESSION_START_GATING_ENABLED=true`,
    })
  }
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
    transitions = await getSessionTransitions(
      tradingHoursUrl,
      requester,
      timezone,
      GATE_MARKET,
      GATE_TRADINGHOURS_TYPE,
    )
  } catch (e) {
    logger.error(
      `TradingHoursEA request failed; 24/7 session-start gating uses the hard-coded fallback schedule: ${e}`,
    )
  }

  return gateIssuer247Report({
    marketStatus: data.marketStatus,
    lastSeenTimestampNs: data.lastSeenTimestampNs,
    nowMs,
    transitions,
    fallbackTransitions: getFallbackSessionTransitions(GATE_MARKET, GATE_FALLBACK_TYPE, nowMs),
    failOnIndeterminate: settings.ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION,
    ...(marketSessionOverride !== undefined
      ? {
          marketSessionOverride:
            TwentyfourFiveMarketStatus[
              marketSessionOverride as keyof typeof TwentyfourFiveMarketStatus
            ],
        }
      : {}),
  })
}

/**
 * The 24/7 stream price, times the issuer's on-chain multiplier when one is
 * requested. The multiplied price is truncated to the output decimals only once.
 */
export const calculatePrice = async ({
  settings,
  providers,
  multiplier,
  ...param
}: PriceParams) => {
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

  // Request the price in the multiplier's decimals so both share a scale.
  // Note: the multiplier RPC runs before gating, so a report the gate rejects
  // still pays for the multiplier fetch. Warm-up windows are short and rare, so
  // the wasted call is accepted rather than restructuring the Promise.all.
  const [price, value] = await Promise.all([
    getDataEngineResult({ ...stream, decimals: MULTIPLIER_DECIMALS }),
    issuer.getMultiplier(multiplier, provider),
  ])
  const gating = await gateReport(
    settings,
    param.requester,
    param.marketSessionOverride,
    price.data,
  )

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
