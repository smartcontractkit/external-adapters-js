import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/ea-bootstrap'
import { Config } from '../config'
import { utils } from 'ethers'

export const supportedEndpoints = ['function']

export type TInputParameters = { signature: string; address: string; inputParams: string[] }
export const inputParameters: InputParameters<TInputParameters> = {
  signature: {
    aliases: ['function'],
    required: true,
    description:
      'Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts)',
  },
  address: {
    aliases: ['contract'],
    required: true,
    description: 'Address of the contract',
    type: 'string',
  },
  inputParams: {
    required: false,
    description: 'Array of function parameters in order',
    type: 'array',
  },
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

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
