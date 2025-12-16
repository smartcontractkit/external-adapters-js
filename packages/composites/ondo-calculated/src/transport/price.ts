import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { getRegistryData } from '../lib/registry'
import { SessionAwareSmoother } from '../lib/smoother'
import { getPrice } from '../lib/streams'

const smoother = new SessionAwareSmoother()

export const calculatePrice = async (
  asset: string,
  registry: string,
  provider: JsonRpcProvider,
  regularStreamId: string,
  extendedStreamId: string,
  overnightStreamId: string,
  url: string,
  requester: Requester,
  decimals: number,
) => {
  const [price, { multiplier, paused }] = await Promise.all([
    getPrice(regularStreamId, extendedStreamId, overnightStreamId, url, requester),
    getRegistryData(asset, registry, provider),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: ${asset} pasued on registry ${registry}`,
    })
  }

  const smoothedPrice = smoother.processUpdate(BigInt(price.price), 0)

  //  multiplier is in 18 decimals
  const result = (smoothedPrice * multiplier) / 10n ** 18n
  const scaledResult =
    price.decimals > decimals
      ? result / 10n ** BigInt(price.decimals - decimals)
      : result * 10n ** BigInt(decimals - price.decimals)

  return {
    result: scaledResult.toString(),
    decimals,
    registry: {
      sValue: multiplier.toString(),
      paused,
    },
    stream: price.data,
  }
}
