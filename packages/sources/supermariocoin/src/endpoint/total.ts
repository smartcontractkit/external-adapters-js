import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_BASE_URL } from '../config'

export const supportedEndpoints = ['total']

export const inputParameters: InputParameters = {}

export interface GoldCoinBalance {
  address: string
  balance: number
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const url = DEFAULT_BASE_URL
  const options = {
    ...config.api,
    url,
    params: {
      // my_api_key: config.apiKey,
    },
  }

  const response = await Requester.request(options)
  response.data.result = {
    total: response.data.reduce((prev: number, curr: GoldCoinBalance) => {
      return prev + curr.balance
    }, 0),
  }

  return Requester.success(jobRunID, response, true)
}
