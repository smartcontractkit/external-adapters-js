import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { LCDClient } from '@terra-money/terra.js'
import { Config } from '../config'

export const supportedEndpoints = ['view']

export const inputParameters: InputParameters = {
  address: ['address', 'contract'],
  query: true,
  params: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const address = validator.validated.data.address
  const query = validator.validated.data.query
  const params = validator.validated.data.params

  const terra = new LCDClient({
    URL: config.rpcUrl,
    chainID: config.chainId,
  })

  const result = await terra.wasm.contractQuery(address, query, params)

  const response = {
    data: { result },
    result,
  }

  return Requester.success(jobRunID, response, config.verbose)
}
