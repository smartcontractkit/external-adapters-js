import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig } from './config'

const customParams = {
  market: false,
}

const endpoints: Record<string, string> = {
  brent: '/api',
  wti: 'api/index_cl',
}

export const execute: Execute = async (input, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const market = validator.validated.data.market || 'brent'
  const url = `https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com/${
    endpoints[market.toLowerCase()]
  }`

  const auth = {
    password: config.password,
  }

  const response = await Requester.request({ url, auth })
  response.data.result = Requester.validateResultNumber(response.data, ['index'])
  return Requester.success(jobRunID, response)
}

// Export function to integrate with Chainlink node
export const executeWithDefaults: Execute = async (request) => execute(request, getConfig())
