import { Requester } from '@chainlink/external-adapter-framework/util/requester'

import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { Smoother } from '../endpoint/common'

import { ethers } from 'ethers'
import { getMultiplier } from '../lib/sourceAdapter'
import { smoothedStreamPrice } from './smoothedPrice'

const MULTIPLIER_DECIMALS = 18n

export const calculatePrice = async (param: {
  asset: string
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
  sourceAdapter: string
  sourceAdapterUrl: string
  sourceAdapterParams: string
}) => {
  const [result, { multiplier, activationDateTime, newMultiplier }] = await Promise.all([
    smoothedStreamPrice(param),
    getMultiplier(
      param.sourceAdapter,
      param.sourceAdapterUrl,
      param.sourceAdapterParams,
      param.requester,
    ),
  ])

  validateNumber(multiplier, 'multiplier', param.asset)
  validateNumber(newMultiplier, 'newMultiplier', param.asset)
  validateNumber(activationDateTime, 'activationDateTime', param.asset)

  const currentMultiplier =
    Number(activationDateTime) * 1000 > Date.now() ? multiplier : newMultiplier

  if (Number(currentMultiplier) <= 0) {
    throw new AdapterError({
      statusCode: 503,
      message: `Non-positive ${multiplier} or ${newMultiplier} for asset: ${param.asset}`,
    })
  }

  return result.map((r) => ({
    ...r,
    currentMultiplier: Number(currentMultiplier),
    newMultiplier: Number(newMultiplier),
    activationDateTime: Number(activationDateTime),
    scaledUiAmount: {
      multiplier: scale(multiplier).toString(),
      newMultiplier: scale(newMultiplier).toString(),
      newMultiplierEffectiveTimestamp: Number(activationDateTime),
    },
    result: ((BigInt(r.result) * scale(currentMultiplier)) / 10n ** MULTIPLIER_DECIMALS).toString(),
  }))
}

const scale = (num: number | string) =>
  ethers.parseUnits(num.toString(), Number(MULTIPLIER_DECIMALS))

const validateNumber = (value: string | number, name: string, asset: string) => {
  const exist = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '')
  if (!exist || !Number.isFinite(Number(value))) {
    throw new AdapterError({
      statusCode: 503,
      message: `Invalid ${name} value ${value} for asset: ${asset}`,
    })
  }
}
