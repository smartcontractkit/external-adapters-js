import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const Name = 'token'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

// Bridging the Chainlink endpoint to the response data key
export enum Paths {
  TotalSupply = 'totalSupply',
  MarketCap = 'marketCapUSD',
}

const customParams = {
  base: ['base', 'from', 'coin'],
  path: false,
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const path = validator.validated.data.path || Paths.MarketCap
  const url = `/api/v2/market/tokens/prices/${coin.toLowerCase()}/latest`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset: Record<string, any>) => asset.symbol.toUpperCase() === coin.toUpperCase(),
  )
  response.data.result = Requester.validateResultNumber(coinData, [path])

  return Requester.success(jobRunID, response, config.verbose)
}
