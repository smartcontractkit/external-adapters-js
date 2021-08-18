import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config, InputParameters } from '@chainlink/types'
import { DEFAULT_ENDPOINT, BLOCKCHAIN_NAME_MAP } from '../config'

export const supportedEndpoints = ['height', 'difficulty']

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

export const inputParameters: InputParameters = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
  network: false,
}

const payloadDataPaths: { [key: string]: string[] } = {
  height: ['data', 'item', 'height'],
  difficulty: ['data', 'item', 'blockchainSpecific', 'difficulty'],
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const payloadDataPath = payloadDataPaths[endpoint]
  if (!payloadDataPath) {
    throw new Error(`${endpoint} has no payload data path and is invalid`)
  }
  const url = `/v2/blockchain-data/${
    BLOCKCHAIN_NAME_MAP[blockchain.toLowerCase()]
  }/${network.toLowerCase()}/blocks/last`
  const reqConfig = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(reqConfig)
  const result = Requester.validateResultNumber(response.data, payloadDataPath)
  const responseWithCost = { ...response, data: { ...response.data, cost: 5 } }
  return Requester.success(jobRunID, Requester.withResult(responseWithCost, result), config.verbose)
}
