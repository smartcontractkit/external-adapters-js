import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'

export const NAME = 'price'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin', 'ids'],
  quote: ['quote', 'to', 'market', 'convert'],
}

const convertId: Record<string, string> = {
  FNX: 'FNX2',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  let ids = validator.validated.data.base.toUpperCase()
  const convert = validator.validated.data.quote.toUpperCase()
  const jobRunID = validator.validated.id
  const url = `/currencies/ticker`
  // Correct common tickers that are misidentified
  ids = convertId[ids] || ids

  const params = {
    ids,
    convert,
    key: config.apiKey,
  }
  const reqConfig = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(reqConfig, customError)
  const result = Requester.validateResultNumber(response.data[0], ['price'])
  return Requester.success(jobRunID, {
    data: { ...response.data[0], result },
    result,
    status: 200,
  })
}
