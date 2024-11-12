import { ExecuteWithConfig, Config, Validator, InputParameters } from '@chainlink/ea-bootstrap'
import { Requester } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['totalMarketCap', 'totalmcap', 'globalmarketcap']

export type TInputParameters = Record<string, never>
export const inputParameters: InputParameters<TInputParameters> = {}

export const description =
  "Returns the totalMarketCap value provided by coinranking's 'stats' endpoint"

export interface ResponseSchema {
  status: string
  data: {
    referenceCurrencyRate: number
    totalCoins: number
    totalMarkets: number
    totalExchanges: number
    totalMarketCap: string
    total24hVolume: string
    btcDominance: number
    bestCoins: {
      uuid: string
      symbol: string
      name: string
      iconUrl: string
      coinrankingUrl: string
    }[]
    newestCoins: {
      uuid: string
      symbol: string
      name: string
      iconUrl: string
      coinrankingUrl: string
    }[]
  }
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, inputParameters)
  const jobRunID = validator.validated.id

  const response = await Requester.request<ResponseSchema>({
    ...config.api,
    url: 'stats',
  })
  const result = Requester.validateResultNumber(response.data, ['data', 'totalMarketCap'])
  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
