import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const Name = 'globalmarketcap'

const inputParams = {
  market: ['market', 'to', 'quote'],
}

export const execute = async (config: Config, request: AdapterRequest): Promise<number> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const url = 'https://api.coinpaprika.com/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol = validator.validated.data.market.toLowerCase()

  const response = await Requester.request(options)
  return Requester.validateResultNumber(response.data, [`market_cap_${symbol}`])
}
