import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Smoother } from '../endpoint/price'
import { getRegistryData } from '../lib/registry'
import { calculateSecondsFromTransition } from '../lib/session/session'
import { processUpdate } from '../lib/smoother/smoother'
import { getPrice } from '../lib/streams'

const MULTIPLIER_DECIMALS = 18n

export const calculatePrice = async (param: {
  asset: string
  registry: string
  provider: JsonRpcProvider
  regularStreamId: string
  extendedStreamId: string
  overnightStreamId: string
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
  const [price, { multiplier, paused }, secondsFromTransition] = await Promise.all([
    getPrice(
      param.regularStreamId,
      param.extendedStreamId,
      param.overnightStreamId,
      param.url,
      param.requester,
    ),
    getRegistryData(param.asset, param.registry, param.provider),
    calculateSecondsFromTransition(
      param.tradingHoursUrl,
      param.requester,
      param.sessionBoundaries,
      param.sessionBoundariesTimeZone,
      param.sessionMarket,
      param.sessionMarketType,
    ),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: ${param.asset} paused on registry ${param.registry}`,
    })
  }

  const common = {
    rawPrice: price.price,
    decimals: param.decimals,
    registry: {
      sValue: multiplier.toString(),
      paused,
    },
    stream: price.data,
  }

  return ['ema', 'kalman'].map((smoother) => {
    const smoothed = smooth(smoother as Smoother, param, price, secondsFromTransition, multiplier)
    return {
      result: smoothed.result,
      ...common,
      smoother: smoothed.smoother,
    }
  })
}

const smooth = (
  smoother: Smoother,
  param: { asset: string; decimals: number },
  price: { price: string; spread: bigint; decimals: number },
  secondsFromTransition: number,
  multiplier: bigint,
) => {
  const smoothed = processUpdate(
    smoother,
    param.asset,
    BigInt(price.price),
    price.spread,
    secondsFromTransition,
  )

  const result =
    (smoothed.price * multiplier * 10n ** BigInt(param.decimals)) /
    10n ** BigInt(price.decimals) /
    10n ** MULTIPLIER_DECIMALS

  return {
    result: result.toString(),
    smoother: {
      smoother,
      price: smoothed.price.toString(),
      x: smoothed.x.toString(),
      p: smoothed.p.toString(),
      secondsFromTransition,
    },
  }
}
