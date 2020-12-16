import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'
import { COINS } from '.'

export const Name = 'difficulty'

const inputParams = {
  blockchain: ['blockchain', 'coin'],
}

export const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const blockchain = Requester.toVendorName(
    validator.validated.data.blockchain.toLowerCase(),
    COINS,
  )
  const url = `/${blockchain}/stats`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'difficulty'])
  return Requester.success(jobRunID, response)
}
