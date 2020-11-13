import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, getBaseURL } from '../config'

export const Name = 'difficulty'

const inputParams = {
  blockchain: ['blockchain', 'coin'],
}

const convertBlockchain: { [key: string]: string } = {
  BTC: 'bitcoin',
  BCH: 'bitcoin-cash',
  BSV: 'bitcoin-sv',
  ETH: 'ethereum',
  LTC: 'litecoin',
}

export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  let blockchain = validator.validated.data.blockchain
  if (blockchain in convertBlockchain) blockchain = convertBlockchain[blockchain]

  const url = `/${blockchain.toLowerCase()}/stats`

  const reqConfig = { ...config.api, baseURL: getBaseURL(), url }

  const response = await Requester.request(reqConfig)
  response.data.result = Requester.validateResultNumber(response.data, ['data', 'difficulty'])
  return response
}
