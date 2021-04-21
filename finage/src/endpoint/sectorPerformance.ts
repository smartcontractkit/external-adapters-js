import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'sector-performance'

const customParams = {
  symbol: true,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol

  const reqConfig = {
    ...config.api,
    params: {
      apiKey: config.apiKey,
    },
    url: `detail/stock/${symbol}`,
  }

  let response = await Requester.request(reqConfig, null, 2)
  const sector = response.data.sector

  response = await Requester.request({
    ...reqConfig,
    url: `market-information/us/sector-performance`,
  })

  const result = parseFloat(
    response.data.find((entry: { sector: string }) => entry.sector === sector).change_percentage,
  )

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
