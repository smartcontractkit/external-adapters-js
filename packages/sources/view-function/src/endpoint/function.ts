import { AdapterError, Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { Contract, utils } from 'ethers'

export const supportedEndpoints = ['function']

export const inputParameters: InputParameters = {
  signature: ['function', 'signature'],
  address: ['address', 'contract'],
  inputParams: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const fnSignature = validator.validated.data.signature
  const params = validator.validated.data.inputParams || []

  if (typeof address !== 'string' || !address.length) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'address' or 'contract' path, must be a non-empty string.`,
      statusCode: 400,
    })
  }

  if (typeof fnSignature !== 'string' || !fnSignature.length) {
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'signature' or 'function' path, must be a non-empty string.`,
      statusCode: 400,
    })
  }

  const contract = new Contract(address, [fnSignature], config.provider)
  const fnName = Object.keys(contract.functions)[1]
  let executionResult = await contract[fnName](...params)

  if (typeof executionResult === 'string') {
    executionResult = utils.toUtf8Bytes(executionResult)
  }

  let result
  try {
    result = utils.hexZeroPad(executionResult, 32)
  } catch (e) {
    result = executionResult
  }

  const response = {
    jobRunID,
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
    data: result,
  }

  return Requester.success(jobRunID, Requester.withResult(response, result))
}
