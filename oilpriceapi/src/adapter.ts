import { Execute } from '@chainlink/types'
import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig } from './config'

const commonKeys: Record<string, string> = {
  bz: 'BRENT_CRUDE_USD',
  brent: 'BRENT_CRUDE_USD',
}

const customParams = {
  base: ['type', 'base', 'asset', 'from', 'market'],
  endpoint: false,
}

const customError = (data: Record<string, unknown>) => {
  return data.data === null
}

export const execute: Execute = async (input, config: Config) => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const endpoint = validator.validated.data.endpoint || 'prices/latest'
  const url = `https://api.oilpriceapi.com/v1/${endpoint}`
  // eslint-disable-next-line camelcase
  let by_code = validator.validated.data.base.toLowerCase()
  if (commonKeys[by_code]) {
    // eslint-disable-next-line camelcase
    by_code = commonKeys[by_code]
  }

  const params = {
    by_code,
  }

  const headers = {
    Authorization: `Token ${config.apikey}`,
  }

  const response = await Requester.request({ url, params, headers }, customError)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'price'])
  return Requester.success(jobRunID, response)
}

// Export function to integrate with Chainlink node
export const executeWithDefaults: Execute = async (request) => execute(request, getConfig())
