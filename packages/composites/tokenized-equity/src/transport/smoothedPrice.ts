import { TwentyfourFiveMarketStatus } from '@chainlink/external-adapter-framework/adapter'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { Smoother } from '../endpoint/common'
import { calculateSecondsFromTransition } from '../lib/session/session'
import {
  WARMUP_MS as OVERNIGHT_EMA_WARMUP_MS,
  processOvernightUpdate,
} from '../lib/smoother/overnightSmoother'
import { processUpdate } from '../lib/smoother/smoother'
import { getPrice } from '../lib/streams'

export const smoothedStreamPrice = async (param: {
  asset: string
  regularStreamId?: string
  extendedStreamId?: string
  overnightStreamId?: string
  overnightStreamMaxAgeInSeconds?: number
  url: string
  tradingHoursUrl: string
  requester: Requester
  sessionMarket?: string
  sessionMarketType?: string
  sessionBoundaries: string[]
  sessionBoundariesTimeZone?: string
  smoother: Smoother
  decimals: number
}) => {
  const [price, secondsFromTransition] = await Promise.all([
    getPrice(
      param.url,
      param.requester,
      param.regularStreamId,
      param.extendedStreamId,
      param.overnightStreamId,
      param.overnightStreamMaxAgeInSeconds,
    ),
    calculateSecondsFromTransition(
      param.tradingHoursUrl,
      param.requester,
      param.sessionBoundaries,
      param.sessionBoundariesTimeZone,
      param.sessionMarket,
      param.sessionMarketType,
    ),
  ])

  const common = {
    rawPrice: price.price,
    decimals: param.decimals,
    stream: price.data,
  }

  // Gated on the live status of the feed that was actually selected, not on the
  // trading-hours schedule. Called once per tick and shared across the smoother
  // branches below, rather than duplicated per branch.
  const isOvernight = price.marketStatus === TwentyfourFiveMarketStatus.OVERNIGHT

  // Start feeding the overnight EMA a bit before the session actually begins, so it
  // isn't cold-starting at the exact moment it starts being published below. Only
  // POST_MARKET is checked because that's the status immediately preceding OVERNIGHT;
  // `secondsFromTransition` is the signed distance to the *nearest* session boundary
  // (shared with the transition blend above), which during POST_MARKET is the upcoming
  // overnight boundary.
  const isWarmingUpOvernight =
    price.marketStatus === TwentyfourFiveMarketStatus.POST_MARKET &&
    secondsFromTransition !== undefined &&
    secondsFromTransition.value < 0 &&
    secondsFromTransition.value >= -OVERNIGHT_EMA_WARMUP_MS / 1000

  const overnight = processOvernightUpdate(
    param.asset,
    BigInt(price.price),
    isOvernight || isWarmingUpOvernight,
  )

  // Only once the feed itself reports OVERNIGHT does the transition below get fed the
  // overnight EMA's price instead of the true raw price — warming up ahead of time only
  // affects when the overnight EMA starts accumulating state, not when it starts being
  // published. That still happens exactly at the boundary, same as before warm-up
  // existed, just handing off to a warm (and so less jumpy) EMA instead of a cold one.
  const transitionInputPrice = isOvernight ? overnight.price : BigInt(price.price)

  const smoothers = param.smoother === 'none' ? ['none'] : ['ema', 'kalman']

  return smoothers.map((smoother) => {
    const smoothed = secondsFromTransition
      ? processUpdate(
          smoother as Smoother,
          param.asset,
          transitionInputPrice,
          price.spread,
          secondsFromTransition.value,
        )
      : {
          price: transitionInputPrice,
          x: 0n,
          p: 0n,
        }

    // While overnight, `transitionInputPrice` above is already the overnight EMA's
    // price, so this is already the overnight-smoothed result — no separate override is
    // needed. The transition blend itself only covers the -10s/+60s window around the
    // boundary; well past that (the multi-hour middle of the overnight session), the
    // weight is 0 and this reduces to the overnight EMA's price directly.
    const result = (smoothed.price * 10n ** BigInt(param.decimals)) / 10n ** BigInt(price.decimals)

    return {
      result,
      ...common,
      smoother: {
        smoother,
        price: smoothed.price.toString(),
        x: smoothed.x.toString(),
        p: smoothed.p.toString(),
        secondsFromTransition: secondsFromTransition?.value,
      },
      sessionSource: secondsFromTransition?.source,
    }
  })
}
