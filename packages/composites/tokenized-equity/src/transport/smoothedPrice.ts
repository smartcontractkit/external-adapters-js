import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { Smoother } from '../endpoint/common'
import { calculateSecondsFromTransition } from '../lib/session/session'
import { processUpdate } from '../lib/smoother/smoother'
import { getPrice } from '../lib/streams'

export const smoothedStreamPrice = async (param: {
  asset: string
  regularStreamId: string
  extendedStreamId: string
  overnightStreamId: string
  overnightStreamMaxAgeInSeconds?: number
  url: string
  tradingHoursUrl: string
  requester: Requester
  sessionMarket: string
  sessionMarketType: string
  sessionBoundaries: string[]
  sessionBoundariesTimeZone: string
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

  return ['ema', 'kalman'].map((smoother) => {
    const smoothed = smooth(smoother as Smoother, param, price, secondsFromTransition.value)
    return {
      result: smoothed.result,
      ...common,
      smoother: smoothed.smoother,
      sessionSource: secondsFromTransition.source,
    }
  })
}

const smooth = (
  smoother: Smoother,
  param: { asset: string; decimals: number },
  price: { price: string; spread: bigint; decimals: number },
  secondsFromTransition: number,
) => {
  const smoothed = processUpdate(
    smoother,
    param.asset,
    BigInt(price.price),
    price.spread,
    secondsFromTransition,
  )

  const result = (smoothed.price * 10n ** BigInt(param.decimals)) / 10n ** BigInt(price.decimals)

  return {
    result: result,
    smoother: {
      smoother,
      price: smoothed.price.toString(),
      x: smoothed.x.toString(),
      p: smoothed.p.toString(),
      secondsFromTransition,
    },
  }
}
