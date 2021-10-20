import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { Config } from '../config'
import { utils } from 'ethers'

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

  const iface = new utils.Interface([fnSignature])
  const fnName = iface.functions[Object.keys(iface.functions)[0]].name

  const encoded = iface.encodeFunctionData(fnName, [...params])

  const result = await config.provider.call({
    to: address,
    data: encoded,
  })

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
