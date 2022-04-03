import { Logger, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, InputParameters } from '@chainlink/types'
import { getAllocations } from '../index-allocations'
import { DEFAULT_NETWORK, DEFAULT_RPC_URL, ExtendedConfig } from '../config'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'

export const supportedEndpoints = ['allocation']

const inputParameters: InputParameters = {
  name: {
    required: false,
    description: 'Index Name',
  },
  asset: {
    required: false,
    description: 'Asset Name',
  },
  address: {
    required: true,
    description: 'Address of the SetToken',
  },
  adapter: {
    required: true,
    description: 'Address of the adapter contrac',
  },
}

export const execute: ExecuteWithConfig<ExtendedConfig> = async (request, context, config) => {
  Logger.warn(
    `WARN: This EA will be deprecated, 'set-token-index' will be used for future reference.`,
  )
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const asset = validator.validated.data
  const network = config.network || DEFAULT_NETWORK
  const url = config.RPC_URL || DEFAULT_RPC_URL

  const allocations = await getAllocations(asset.adapter, asset.address, url, network)

  const _execute = TokenAllocation.makeExecute()
  return await _execute({ id: jobRunID, data: { ...request.data, allocations } }, context)
}
