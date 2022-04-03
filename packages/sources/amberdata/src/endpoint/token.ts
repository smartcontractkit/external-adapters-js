import { AdapterError, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import includes from './../config/includes.json'

export const supportedEndpoints = ['marketcap', 'token']

const customError = (data: ResponseSchema) => {
  return Object.keys(data.payload).length === 0
}

export const description = 'Gets the asset USD Market Cap from Amberdata.'

export const inputParameters: InputParameters = {
  base: {
    required: true,
    aliases: ['from', 'coin'],
    description: 'The symbol of the currency to query',
    type: 'string',
  },
}

export interface ResponseSchema {
  status: number
  title: string
  description: string
  payload: Payload[]
}

export interface Payload {
  address: string
  circulatingSupply: string
  dailyPercentChangeUSD: string
  dailyVolumeUSD: string
  hourlyPercentChangeUSD: string
  marketCapUSD: string
  name: string
  priceUSD: string
  symbol: string
  totalSupply: string
  weeklyPercentChangeUSD: string
  decimals: string
  timestamp: number
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters, {}, { includes })

  const jobRunID = validator.validated.id
  const coin = validator.validated.data.base
  const resultPath = validator.validated.data.resultPath || 'marketCapUSD'
  const url = util.buildUrlPath(`/api/v2/market/tokens/prices/:coin/latest`, {
    coin: coin.toLowerCase(),
  })

  const reqConfig = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset: { symbol: string }) => asset.symbol.toUpperCase() === coin.toUpperCase(),
  )
  if (coinData) {
    const result = Requester.validateResultNumber(coinData, [resultPath])
    return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
  }

  throw new AdapterError({
    jobRunID,
    message: `Could not retrieve valid data`,
    statusCode: 400,
  })
}
