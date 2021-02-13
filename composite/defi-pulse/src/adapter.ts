import {Validator, logger} from '@chainlink/external-adapter'
import {AdapterResponse, AdapterRequest, Execute} from '@chainlink/types'
import {getAllocations} from './index-allocations'
import * as TokenAllocation from '@chainlink/token-allocation-adapter'
import {makeConfig, Config} from './config'

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  logger.debug(`defi-pulse - DATA_PROVIDER: ${process.env.DATA_PROVIDER}`)
  logger.debug(`defi-pulse - adapter: ${asset.adapter}`)
  logger.debug(`defi-pulse - address: ${asset.address}`)
  logger.debug(`defi-pulse - rpcUrl: ${config.rpcUrl}`)
  logger.debug(`defi-pulse - network: ${config.network}`)
  logger.debug('defi-pulse - input: ', input)

  const allocations = await getAllocations(
    asset.adapter,
    asset.address,
    config.rpcUrl,
    config.network,
  )

  const _execute = TokenAllocation.makeExecute()
  return await _execute({id: jobRunID, data: {...input.data, allocations}})
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
