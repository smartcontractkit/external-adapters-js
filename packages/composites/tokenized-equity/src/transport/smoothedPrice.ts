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

  // Only once the feed itself reports OVERNIGHT does the transition below decay
  // towards the overnight EMA's price instead of the true raw price — warming up
  // ahead of time only affects when the overnight EMA starts accumulating state, not
  // when it starts being published. That still happens exactly at the boundary, same
  // as before warm-up existed, just handing off to a warm (and so less jumpy) EMA
  // instead of a cold one. The filter itself is always fed the true raw price below,
  // at both the entry and exit of the overnight session — only the target it decays
  // towards away from the boundary changes.
  const targetPrice = isOvernight ? overnight.price : BigInt(price.price)

  const smoothers = param.smoother === 'none' ? ['none'] : ['ema', 'kalman']

  return smoothers.map((smoother) => {
    const smoothed = secondsFromTransition
      ? processUpdate(
          smoother as Smoother,
          param.asset,
          BigInt(price.price),
          targetPrice,
          price.spread,
          secondsFromTransition.value,
        )
      : {
          price: targetPrice,
          x: 0n,
          p: 0n,
        }

    // Well past the -10s/+60s window around either session boundary, weight is 0 and
    // this reduces to `targetPrice` directly — the overnight EMA's price throughout
    // the multi-hour middle of the overnight session, or the raw price otherwise.
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
