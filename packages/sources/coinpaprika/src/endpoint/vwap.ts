import { Requester, util, Validator, Overrider } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds } from '../util'
import internalOverrides from '../config/overrides.json'

export const supportedEndpoints = ['vwap', 'crypto-vwap']

export const endpointResultPaths = {
  vwap: '0.price',
  'crypto-vwap': '0.price',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['from', 'coin'],
    type: 'string',
    required: true,
  },
  hours: {
    description: 'Number of hours to get VWAP for',
    type: 'number',
    default: 24,
  },
  coinid: {
    description: 'The coin ID (optional to use in place of `base`)',
    required: false,
    type: 'string',
  },
}

export type ResponseSchema = {
  timestamp: string
  price: number
  volume_24h: number
  market_cap: number
}[]

const customError = (data: ResponseSchema) => !data.length

const formatUtcDate = (date: Date) => date.toISOString().split('T')[0]

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)
  const jobRunID = validator.validated.id
  const base = validator.validated.data.base
  const coinid = validator.validated.data.coinid as string | undefined

  let coin = coinid
  if (!coin) {
    const overrider = new Overrider(
      internalOverrides,
      request.data?.overrides,
      AdapterName,
      jobRunID,
    )
    const [overriddenCoin, remainingSym] = overrider.performOverrides(base)
    if (remainingSym.length === 0) {
      coin = overriddenCoin[base]
    } else {
      const coinsResponse = await getCoinIds(context, jobRunID)
      const requestedCoin = Overrider.convertRemainingSymbolsToIds(
        overriddenCoin,
        remainingSym.map((sym) => sym.toUpperCase()),
        coinsResponse,
      )
      coin = requestedCoin[base]
    }
  }
  const url = util.buildUrlPath('v1/tickers/:coin/historical', { coin: coin.toLowerCase() })
  const resultPath = validator.validated.data.resultPath
  const hours = validator.validated.data.hours

  const endDate = new Date()
  const subMs = validator.validated.data.hours * 60 * 60 * 1000
  const startDate = new Date(endDate.getTime() - subMs)

  const params = {
    start: formatUtcDate(startDate),
    interval: `${hours}h`,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options, customError)
  const result = Requester.validateResultNumber(response.data, resultPath)

  const returnResponse = {
    ...response,
    data: {
      ...response.data,
      cost: 2,
    },
  }

  return Requester.success(jobRunID, Requester.withResult(returnResponse, result), config.verbose)
}
