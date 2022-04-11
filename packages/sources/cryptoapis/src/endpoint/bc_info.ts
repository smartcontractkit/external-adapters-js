import { Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths = {
  height: 'headers',
  difficulty: 'difficulty',
}

export const description =
  'https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/common/index#common'

export const inputParameters: InputParameters = {
  blockchain: {
    aliases: ['coin', 'market'],
    description: 'The blockchain to retrieve info for',
    options: ['BTC', 'ETH', 'LTC', 'ETC', 'BCH', 'DOGE', 'DASH'],
    required: true,
    type: 'string',
  },
  network: {
    description: 'The blockchain network name',
    default: 'mainnet',
    required: true,
    type: 'string',
  },
}

export interface ResponseSchema {
  payload: {
    difficulty: number
    headers: number
    chain: string
    chainWork: string
    mediantime: number
    blocks: number
    bestBlockHash: string
    currency: string
    transactions: number
    verificationProgress: number
  }
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const resultPath = validator.validated.data.resultPath
  const url = util.buildUrlPath('/v1/bc/:blockchain/:network/info', {
    blockchain: blockchain.toLowerCase(),
    network: network.toLowerCase(),
  })

  const reqConfig = { ...config.api, url }

  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, ['payload', resultPath])

  return Requester.success(jobRunID, Requester.withResult(response, result), config.verbose)
}
