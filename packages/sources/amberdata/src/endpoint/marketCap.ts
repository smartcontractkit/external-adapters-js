import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const Name = 'marketcap'

const customError = (data: any) => {
  return Object.keys(data.payload).length === 0
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

export const execute: ExecuteWithConfig<Config> = async (input, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const coin = validator.validated.data.base
  const market = validator.validated.data.quote
  const url = `/api/v2/market/tokens/prices/${coin.toLowerCase()}/latest`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig, customError)
  const coinData = response.data.payload.find(
    (asset: Record<string, any>) => asset.symbol.toUpperCase() === coin.toUpperCase(),
  )
  const result = Requester.validateResultNumber(coinData, [`marketCap${market.toUpperCase()}`])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response, result } : { result },
    result,
    status: 200,
  })
}
