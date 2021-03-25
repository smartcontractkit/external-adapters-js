import { Validator, Requester } from '@chainlink/ea-bootstrap'
import { AdapterResponse, AdapterRequest, Execute } from '@chainlink/types'
import { getAllocations } from './index-allocations'
import { makeConfig, Config } from './config'

const customParams = {
  name: false,
  asset: false,
  address: true,
  adapter: true,
  source: true,
  quote: false,
}

export const execute = async (input: AdapterRequest, config: Config): Promise<AdapterResponse> => {
  const validator = new Validator(input, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const asset = validator.validated.data

  const allocations = await getAllocations(
    asset.adapter,
    asset.address,
    config.rpcUrl,
    config.network,
  )

  const response = await Requester.request({
    ...config.taConfig,
    data: {
      id: jobRunID,
      data: { ...validator.validated.data, allocations },
    },
  })
  return Requester.success(jobRunID, response)
}

export const makeExecute = (config?: Config): Execute => {
  return async (request: AdapterRequest) => execute(request, config || makeConfig())
}
