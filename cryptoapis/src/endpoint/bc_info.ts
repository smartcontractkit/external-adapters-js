import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { DEFAULT_ENDPOINT } from '../config'

export const Name = 'bc_info'

const infoParams = {
  blockchain: false,
  path: false,
  network: false,
}

const convertPath: { [key: string]: string } = {
  height: 'headers',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, infoParams)
  if (validator.error) throw validator.error

  const blockchain = validator.validated.data.blockchain || 'btc'
  const network = validator.validated.data.network || 'mainnet'
  let path = validator.validated.data.path
  path = convertPath[path] || path
  const url = `/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/info`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  let result
  try {
    result = Requester.validateResultNumber(response.data, ['payload', path])
  } catch {
    result = { ...response.data.payload }
  }

  response.data.result = result

  return response
}
