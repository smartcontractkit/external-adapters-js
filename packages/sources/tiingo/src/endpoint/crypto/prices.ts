import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'prices'

export interface ResponseSchema {
  ticker: string
  baseCurrency: string
  quoteCurrency: string
  priceData: {
    date: string
    open: number
    high: number
    low: number
    close: number
    volume: number
    volumeNotional: number
    fxOpen: number
    fxHigh: number
    fxLow: number
    fxClose: number
    fxVolumeNotional: number
    fxRate: number
    tradesDone: number
  }[]
}

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
  field: false,
}

// When an invalid symbol is given the response body is empty
const customError = (data: ResponseSchema[]) => !data.length

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const base = validator.validated.data.base.toLowerCase()
  const quote = validator.validated.data.quote.toLowerCase()
  const field = validator.validated.data.field || 'fxClose'
  const url = '/tiingo/crypto/prices'

  const options = {
    ...config.api,
    params: {
      token: config.apiKey,
      baseCurrency: base,
      convertCurrency: quote,
      consolidateBaseCurrency: true,
      resampleFreq: '24hour',
    },
    url,
  }

  const response = await Requester.request(options, customError)
  response.data.result = Requester.validateResultNumber(response.data as ResponseSchema[], [
    0,
    'priceData',
    0,
    field,
  ])

  return Requester.success(jobRunID, response, config.verbose)
}
