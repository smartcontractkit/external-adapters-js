import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const Name = 'token'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

export enum TokenEndpoints {
  MarketCap = 'marketcap',
  TotalSupply = 'totalsupply',
}

const paths: Record<TokenEndpoints, string> = {
  [TokenEndpoints.MarketCap]: 'marketCapUSD',
  [TokenEndpoints.TotalSupply]: 'totalSupply',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  endpoint: true,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const endpoint: TokenEndpoints = validator.validated.data.endpoint
  const path = paths[endpoint] || 'marketCapUSD'
  const url = `/api/v2/market/tokens/prices/${coin.toLowerCase()}/latest`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset: Record<string, any>) => asset.symbol.toUpperCase() === coin.toUpperCase(),
  )
  response.data.result = Requester.validateResultNumber(coinData, [path])

  return Requester.success(jobRunID, response, config.verbose)
}
