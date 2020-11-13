import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, getBaseURL } from '../config'

export const Name = 'difficulty'

const difficultyParams = {
  blockchain: ['blockchain', 'coin'],
  network: false,
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, difficultyParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const url = `/v1/bc/${blockchain.toLowerCase()}/${network.toLowerCase()}/info`

  const reqConfig = { ...config.api, baseURL: getBaseURL(), url }

  try {
    const response = await Requester.request(reqConfig)
    response.data.result = Requester.validateResultNumber(response.data, ['payload', 'difficulty'])
    return response
  } catch (error) {
    throw Requester.errored(jobRunID, error)
  }
}
