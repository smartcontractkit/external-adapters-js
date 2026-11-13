import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { JsonRpcProvider } from 'ethers'
import { Smoother } from '../endpoint/common'
import { issuers } from '../issuers'
import { smoothedStreamPrice } from './smoothedPrice'

const MULTIPLIER_DECIMALS = 18n

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
  // xstocks ignores Asset Paused by GTM decision, see docs/adr/0002
  const [result, { multiplier }] = await Promise.all([
    smoothedStreamPrice(param),
    issuers.xstocks.read(param, param.provider),
  ])

  return result.map((r) => ({
    ...r,
    tokenContract: {
      multiplier: multiplier.toString(),
    },
    result: ((BigInt(r.result) * multiplier) / 10n ** MULTIPLIER_DECIMALS).toString(),
  }))
}
