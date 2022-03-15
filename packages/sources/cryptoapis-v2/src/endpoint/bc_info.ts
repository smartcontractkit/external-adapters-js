import { AdapterError, Requester, util, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { BLOCKCHAIN_NAME_BY_TICKER, BlockchainTickers } from '../config'

export const supportedEndpoints = ['height', 'difficulty']

export const endpointResultPaths = {
  height: ['data', 'item', 'height'],
  difficulty: ['data', 'item', 'blockchainSpecific', 'difficulty'],
}

export interface ResponseSchema {
  apiVersion: string
  requestId: string
  data: {
    item: {
      hash: string
      height: number
      previousBlockHash: string
      timestamp: number
      transactionsCount: number
      blockchainSpecific: {
        difficulty: string
        nonce: number
        size: number
        bits: string
        chainwork: string
        merkleRoot: string
        strippedSize: number
        version: number
        versionHex: string
        weight: number
      }
    }
  }
}

export const description =
  'https://developers.cryptoapis.io/technical-documentation/blockchain-data/unified-endpoints/get-latest-mined-block'

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

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  if (blockchain.toLowerCase() !== 'btc')
    throw new AdapterError({
      jobRunID,
      message: `Blockchain must be BTC`,
      statusCode: 400,
    })
  const network = validator.validated.data.network || 'mainnet'
  const resultPath = validator.validated.data.resultPath

  const url = util.buildUrlPath(
    `/v2/blockchain-data/:blockchain_name-specific/:network_name/blocks/last`,
    {
      blockchain_name: BLOCKCHAIN_NAME_BY_TICKER[blockchain.toLowerCase() as BlockchainTickers],
      network_name: network.toLowerCase(),
    },
  )

  const options = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(options)
  const result = Requester.validateResultNumber(response.data, resultPath)
  const responseWithCost = { ...response, data: { ...response.data } }
  return Requester.success(jobRunID, Requester.withResult(responseWithCost, result), config.verbose)
}
