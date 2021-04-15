import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'atm-iv'

const customParams = {
  symbol: true,
  day: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const day = validator.validated.data.day

  const options = {
    ...config.api,
    headers: { ...config.api.headers, 'x-oracle': config.apiKey },
    data: `{"query":"query LinkPoolAtmIv($symbol: SymbolEnumType){LinkPoolAtmIv(symbol: $symbol){tenDayIv thirtyDayIv sixtyDayIv nintyDayIv oneHundredeightyDayIv}}","variables":{"symbol":"${symbol}"}}`,
  }

  const response = await Requester.request(options)

  const result = Requester.validateResultNumber(response.data, ['data', 'LinkPoolAtmIv', 0, day])

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
