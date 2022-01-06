import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['historical']

export const inputParameters: InputParameters = {
  base: ['base', 'from', 'coin', 'sym', 'symbol'],
  convert: ['quote', 'to', 'market', 'convert'],
  start: false,
  end: false,
  count: false,
  interval: false,
  cid: false,
  aux: false,
  skipInvalid: false,
}

export interface ResponseSchema {
  status: {
    timestamp: string
    error_code: number
    error_message: string | null
    elapsed: number
    credit_count: number
    notice: unknown | undefined
  }
  data: {
    quotes: {
      timestamp: string
      quote: {
        [quote: string]: {
          price: number
          volume_24h: number
          market_cap: number
          timestamp: string
        }
      }
    }[]
    id: number
    name: string
    symbol: string
    is_active: number
    is_fiat: number
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.base?.toUpperCase()
  const convert = validator.validated.data.convert?.toUpperCase()
  const time_start = validator.validated.data.start
  const time_end = validator.validated.data.end
  const count = validator.validated.data.count
  const interval = validator.validated.data.interval
  const convert_id = validator.validated.data.cid
  const aux = validator.validated.data.aux
  const skip_invalid = validator.validated.data.skipInvalid
  const url = 'cryptocurrency/quotes/historical'

  const params = {
    symbol,
    time_start,
    time_end,
    count,
    interval,
    convert,
    convert_id,
    aux,
    skip_invalid,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request<ResponseSchema>(options)
  return Requester.success(jobRunID, response, true)
}
