import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
}

const convertId: { [key: string]: string } = {
  FNX: 'FNX2',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  let ids = validator.validated.data.base.toUpperCase()
  const convert = validator.validated.data.quote.toUpperCase()

  // Correct common tickers that are misidentified
  if (ids in convertId) {
    ids = convertId[ids]
  }

  const params = {
    ids,
    convert,
    key: util.getRandomRequiredEnv('API_KEY'),
  }
  const reqConfig = {
    ...config.api,
    params,
    baseURL: 'https://api.nomics.com/v1/currencies/ticker',
  }

  const response = await Requester.request(reqConfig, customError)
  response.data = response.data[0]
  response.data.result = Requester.validateResultNumber(response.data, ['price'])
  return response.data
}
