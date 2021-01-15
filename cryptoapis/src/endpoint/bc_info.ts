import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest, Config } from '@chainlink/types'
import { DEFAULT_ENDPOINT } from '../config'

export const Name = 'bc_info'

const statsParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
  network: false,
}

const convertEndpoint: { [key: string]: string } = {
  height: 'headers',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, statsParams)
  if (validator.error) throw validator.error

  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  let endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  endpoint = convertEndpoint[endpoint] || endpoint
  const url = `/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/info`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['payload', endpoint])
  return response
}
