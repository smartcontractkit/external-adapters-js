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

  const smoothers = secondsFromTransition ? ['ema', 'kalman'] : ['none']

  return smoothers.map((smoother) => {
    const smoothed = secondsFromTransition
      ? processUpdate(
          smoother as Smoother,
          param.asset,
          BigInt(price.price),
          price.spread,
          secondsFromTransition.value,
        )
      : {
          price: BigInt(price.price),
          x: 0n,
          p: 0n,
        }

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
