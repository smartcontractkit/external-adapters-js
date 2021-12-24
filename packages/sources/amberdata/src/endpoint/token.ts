import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['marketcap', 'token']

const customError = (data: ResponseSchema) => {
  return Object.keys(data.payload).length === 0
}

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin'],
  resultPath: false,
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
  const validator = new Validator(input, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const resultPath = validator.validated.data.resultPath || 'marketCapUSD'
  const url = `/api/v2/market/tokens/prices/${coin.toLowerCase()}/latest`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset) => asset.symbol.toUpperCase() === coin.toUpperCase(),
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
