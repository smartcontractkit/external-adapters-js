import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { getBaseURL } from '../config'
import { COINS } from '.'

export const Name = 'difficulty'

const inputParams = {
  blockchain: ['blockchain', 'coin'],
}

export const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error

  const blockchain = Requester.toVendorName(
    validator.validated.data.blockchain.toLowerCase(),
    COINS,
  )
  const url = `/${blockchain}/stats`

  const reqConfig = { ...config.api, baseURL: getBaseURL(), url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'difficulty'])
  return response
}
