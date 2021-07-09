import { Requester, Validator } from '@chainlink/ea-bootstrap'
import { ExecuteWithConfig, Config } from '@chainlink/types'
import { DEFAULT_ENDPOINT } from '../config'
import { BLOCKCHAIN_NAME_MAP } from "./index"

export const Name = 'bc_info'

const statsParams = {
  blockchain: ['blockchain', 'coin'],
  endpoint: false,
  network: false,
}

const payloadDataPaths: { [key: string]: string[] } = {
  "height": ["data", "item", "height"],
  "difficulty": ["data", "item", "blockchainSpecific", "difficulty"]
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, statsParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const blockchain = validator.validated.data.blockchain
  const network = validator.validated.data.network || 'mainnet'
  const endpoint = validator.validated.data.endpoint || DEFAULT_ENDPOINT
  const payloadDataPath = payloadDataPaths[endpoint]
  if (!payloadDataPath) {
    throw new Error(`${endpoint} has no payload data path and is invalid`)
  }
  const url = `/v2/blockchain-data/${BLOCKCHAIN_NAME_MAP[blockchain.toLowerCase()]}/${network.toLowerCase()}/blocks/last`

  const reqConfig = { ...config.api, url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, payloadDataPath)

  return Requester.success(jobRunID, response, config.verbose)
}