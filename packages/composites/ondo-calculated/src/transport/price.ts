import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRegistryData } from '../lib/registry'
import { calculateSecondsFromTransition } from '../lib/session'
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
  requester: Requester
  sessionBoundaries: string[]
  sessionBoundariesTimeZone: string
  smoother: string
  decimals: number
}) => {
  const [price, { multiplier, paused }] = await Promise.all([
    getPrice(
      param.regularStreamId,
      param.extendedStreamId,
      param.overnightStreamId,
      param.url,
      param.requester,
    ),
    getRegistryData(param.asset, param.registry, param.provider),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: ${param.asset} paused on registry ${param.registry}`,
    })
  }

  const secondsFromTransition = calculateSecondsFromTransition(
    param.sessionBoundaries,
    param.sessionBoundariesTimeZone,
  )

  const smoothed = processUpdate(
    param.smoother,
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
    rawPrice: price.price,
    decimals: param.decimals,
    registry: {
      sValue: multiplier.toString(),
      paused,
    },
    stream: price.data,
    smoother: {
      price: smoothed.price.toString(),
      x: smoothed.x.toString(),
      p: smoothed.p.toString(),
      secondsFromTransition,
    },
  }
}
