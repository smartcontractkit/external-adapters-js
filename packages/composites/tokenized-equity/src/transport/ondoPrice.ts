import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Smoother } from '../endpoint/common'
import { getRegistryData } from '../lib/registry'

import { smoothedStreamPrice } from './smoothedPrice'

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
  const [result, { multiplier, paused }] = await Promise.all([
    smoothedStreamPrice(param),
    getRegistryData(param.asset, param.registry, param.provider),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: ${param.asset} paused on registry ${param.registry}`,
    })
  }

  return result.map((r) => ({
    ...r,
    registry: {
      sValue: multiplier.toString(),
      paused,
    },
    result: ((BigInt(r.result) * multiplier) / 10n ** MULTIPLIER_DECIMALS).toString(),
  }))
}
