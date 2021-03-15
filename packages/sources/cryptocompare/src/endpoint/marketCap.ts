import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, ResponsePayload } from '@chainlink/types'

export const NAME = 'marketcap'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
}

const getPayload = (symbols: string[], prices: any, quote: string) => {
  const payloadEntries = symbols.map((symbol) => {
    const key = symbol
    const val = {
      quote: {
        [quote.toUpperCase()]: {
          marketCap: Requester.validateResultNumber(prices, [
            'RAW',
            symbol.toUpperCase(),
            quote.toUpperCase(),
            'MKTCAP',
          ]),
        },
      },
    }
    return [key, val]
  })

  const payload: ResponsePayload = Object.fromEntries(payloadEntries)
  return payload
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = `/data/pricemultifull`
  const base = validator.validated.data.base
  const symbols = Array.isArray(base) ? base : [base]
  const tsyms = validator.validated.data.quote.toUpperCase()
  const fsyms = symbols.map((s) => s.toUpperCase()).join(',')

  const params = {
    fsyms,
    tsyms,
  }

  const options = {
    ...config.api,
    url,
    params,
  }

  const response = await Requester.request(options, customError)
  const payload = getPayload(symbols, response.data, tsyms)

  const result = ''
  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result, payload } : { result, payload },
    result,
    status: 200,
  })
}
