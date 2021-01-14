import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const Name = 'dominance'

const inputParams = {
  market: ['market', 'to', 'quote'],
}

const convert: { [key: string]: string } = {
  BTC: 'bitcoin',
}

export const execute = async (config: Config, request: AdapterRequest): Promise<number> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const url = 'https://api.coinpaprika.com/v1/global'
  const options = {
    ...config.api,
    url,
  }
  const symbol: string = validator.validated.data.market.toUpperCase()

  const response = await Requester.request(options)
  return Requester.validateResultNumber(response.data, [`${convert[symbol]}_dominance_percentage`])
}
