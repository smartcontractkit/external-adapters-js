import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { utils } from 'ethers'
// import { Config } from '../config'

// This should be filled in with a lowercase name corresponding to the API endpoint
export const supportedEndpoints = ['balance']

export const endpointResultPaths = {
  example: 'price',
}

export interface ResponseSchema {
  data: {
    // Some data
  }
}

// const customError = (data: any) => data.Response === 'Error'

export const inputParameters: InputParameters = {
  addresses: ['addresses'],
}

export const execute: ExecuteWithConfig<any> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const addresses = validator.validated.data.addresses

  const response = await config.provider.getBalance(addresses)
  console.log('response', utils.formatEther(response))
  // const result = Requester.validateResultNumber(response.data,)

  return Requester.success(jobRunID, response)
}
