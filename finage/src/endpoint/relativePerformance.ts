import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'relative-performance'

const customParams = {
  symbol: true,
}

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}-${month < 10 ? `0${month}` : month}-${day}`
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const startDate = new Date(Date.now() - 3 * 86400000)
  const endDate = new Date()

  let reqConfig = {
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
  const sectorPerformance = parseFloat(
    response.data.find((entry: { sector: string }) => entry.sector === sector).change_percentage,
  )

  response = await Requester.request({
    ...reqConfig,
    params: { ...reqConfig.params, limit: 2, sort: 'desc' },
    url: `agg/stock/${symbol}/1/day/${formatDate(startDate)}/${formatDate(endDate)}`,
  })
  const equityPerformance = parseFloat(
    (
      (100 * (response.data.results[0].c - response.data.results[1].c)) /
      response.data.results[1].c
    ).toFixed(4),
  )

  const result = parseFloat((equityPerformance - sectorPerformance).toFixed(4))

  return Requester.success(jobRunID, {
    data: config.verbose ? { result } : { result },
    result,
    status: 200,
  })
}
