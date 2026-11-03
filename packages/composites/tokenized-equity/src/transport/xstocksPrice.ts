import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
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
  const [result, { multiplier, paused }] = await Promise.all([
    smoothedStreamPrice(param),
    issuers.xstocks.read(param, param.provider),
  ])

  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: '${param.asset}' paused`,
    })
  }

  return result.map((r) => ({
    ...r,
    tokenContract: {
      multiplier: multiplier.toString(),
      paused,
    },
    result: ((BigInt(r.result) * multiplier) / 10n ** MULTIPLIER_DECIMALS).toString(),
  }))
}
