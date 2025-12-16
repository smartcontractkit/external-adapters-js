import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRegistryData } from '../lib/registry'
import { SessionAwareSmoother } from '../lib/smoother'
import { getPrice } from '../lib/streams'

const smoother = new SessionAwareSmoother()

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

  const smoothedPrice = smoother.processUpdate(BigInt(price.price), 0)

  const result =
    (smoothedPrice * multiplier * 10n ** BigInt(param.decimals)) /
    10n ** BigInt(price.decimals) /
    10n ** MULTIPLIER_DECIMALS

  return {
    result: result.toString(),
    decimals: param.decimals,
    registry: {
      sValue: multiplier.toString(),
      paused,
    },
    stream: price.data,
  }
}
