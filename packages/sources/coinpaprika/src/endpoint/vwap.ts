import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { NAME as AdapterName } from '../config'
import { getCoinIds, getSymbolToId } from '../util'

export const supportedEndpoints = ['vwap', 'crypto-vwap']

export const endpointResultPaths = {
  vwap: '0.price',
  'crypto-vwap': '0.price',
}

export const inputParameters: InputParameters = {
  base: {
    aliases: ['base', 'from', 'coin'],
    type: 'string',
    required: true,
  },
  hours: {
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

const formatUtcDate = (date: Date) => `${date.toISOString().split('T')[0]}T00:00:00Z`

export const execute: ExecuteWithConfig<Config> = async (request, context, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.overrideSymbol(AdapterName) as string
  const coinid = validator.validated.data.coinid as string | undefined

  // If coinid was provided or base was overridden, that symbol will be fetched
  let coin = coinid || (symbol !== validator.validated.data.base && symbol)
  if (!coin) {
    const coinIds = await getCoinIds(context, jobRunID)
    coin = getSymbolToId(symbol, coinIds)
  }

  const url = `v1/tickers/${coin.toLowerCase()}/historical`
  const resultPath = validator.validated.data.resultPath
  const hours = validator.validated.data.hours

  const endDate = new Date()
  const subMs = validator.validated.data.hours * 60 * 60 * 1000
  const startDate = new Date(endDate.getTime() - subMs)

  const params = {
    start: formatUtcDate(startDate),
    end: formatUtcDate(endDate),
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
