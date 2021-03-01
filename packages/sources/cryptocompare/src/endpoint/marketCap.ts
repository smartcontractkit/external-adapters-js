import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'marketcap'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
  base: ['base', 'from', 'coin'],
  quote: ['quote', 'to', 'market'],
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
  const marketCaps = symbols.map((symbol) => {
    const key = symbol
    const result = Requester.validateResultNumber(response.data, [
      'RAW',
      symbol.toUpperCase(),
      tsyms,
      'MKTCAP',
    ])
    return [key, result]
  })

  const result = marketCaps[0][1]

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
