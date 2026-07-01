import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { Smoother } from '../endpoint/common'
import { getTokenMultiplier } from '../lib/xstocks'
import { smoothedStreamPrice } from './smoothedPrice'

export const MULTIPLIER_DECIMALS = 18n

export const calculatePrice = async (param: {
  asset: string
  provider: JsonRpcProvider
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
  const [result, multiplier] = await Promise.all([
    smoothedStreamPrice(param),
    getTokenMultiplier(param.asset, param.provider),
  ])

  return result.map((r) => ({
    ...r,
    tokenContract: {
      multiplier: multiplier.toString(),
    },
    result: ((BigInt(r.result) * multiplier) / 10n ** MULTIPLIER_DECIMALS).toString(),
  }))
}
