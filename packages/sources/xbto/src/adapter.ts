import { Config, ExecuteFactory, ExecuteWithConfig } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/ea-bootstrap'

const customParams = {
  market: false,
}

const endpoints: Record<string, string> = {
  brent: 'api',
  wti: 'api/index_cl',
}

export const execute: ExecuteWithConfig<Config> = async (input, _, config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const market = validator.validated.data.market || 'brent'
  const url = `https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com/${
    endpoints[market.toLowerCase()]
  }`

  const auth = {
    username: '',
    password: config.apiKey || '',
  }

  const reqConfig = {
    ...config.api,
    url,
    auth,
  }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['index'])
  return Requester.success(jobRunID, response)
}

export const makeConfig = (prefix?: string): Config => Requester.getDefaultConfig(prefix)

export const makeExecute: ExecuteFactory<Config> = (config) => {
  return async (request, context) => execute(request, context, config || makeConfig())
}
