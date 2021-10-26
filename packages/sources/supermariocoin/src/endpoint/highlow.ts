import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { DEFAULT_BASE_URL } from '../config'

export const supportedEndpoints = ['highlow']

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

  if (response.data.length) {
    let highestBalanceAddress = response.data[0].address
    let lowestBalanceAddress = response.data[0].address
    let highestBalance = response.data[0].balance
    let lowestBalance = response.data[0].balance

    for (let i = 1; i < response.data.length; i++) {
      if (response.data[i].balance > highestBalance) {
        highestBalanceAddress = response.data[i].address
        highestBalance = response.data[i].balance
      }

      if (response.data[i].balance < lowestBalance) {
        lowestBalanceAddress = response.data[i].address
        lowestBalance = response.data[i].balance
      }
    }

    response.data.result = {
      highestBalanceAddress,
      lowestBalanceAddress,
    }
  } else {
    response.data.result = {}
  }

  return Requester.success(jobRunID, response, true)
}
