import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'delta-skew-3020'

const customParams = {
  symbol: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol

  const options = {
    ...config.api,
    headers: { ...config.api.headers, 'x-oracle': config.apiKey },
    data: `{"query":"query LinkPool3020Skew($symbol: SymbolEnumType){LinkPool3020Skew(symbol: $symbol){twentyfiveDeltaSkew30Day}}","variables":{"symbol":"${symbol}"}}`,
  }

  const response = await Requester.request(options)
  const result = Requester.validateResultNumber(response.data, [
    'data',
    'LinkPool3020Skew',
    0,
    'twentyfiveDeltaSkew30Day',
  ])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
