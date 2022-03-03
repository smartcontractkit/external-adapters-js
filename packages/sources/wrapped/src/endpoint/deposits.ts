import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, InputParameters, AxiosResponse } from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['deposits']

export interface ResponseSchema {
  [token: string]: Address[]
}

export interface Networks {
  [network: string]: string
}

export type Address = {
  address: string
  network: string
  chainId: string
}

const customError = (data: unknown) => {
  return typeof data !== 'object'
}

export const inputParameters: InputParameters = {
  symbol: {
    description: 'The symbol of the currency to query (`BTC`, `ETH`, `LTC`, etc.).',
    type: 'string',
    required: true,
  },
  network: {
    description:
      'The network of the currency to query (`ethereum`, `bitcoin`, `litecoin`, `stellar`, etc.).',
    required: false,
    type: 'string',
  },
  chainId: {
    description: 'The chainId of the currency to query',
    required: false,
    type: 'string',
    default: 'mainnet',
  },
}

const networks: Networks = {
  BCH: 'bitcoincash',
  BTC: 'bitcoin',
  CELO: 'celo',
  ETH: 'ethereum',
  FIL: 'filecoin',
  LTC: 'litecoin',
  WCELO: 'ethereum', // Wrapped Celo
  WCUSD: 'ethereum', // Wrapped Celo Dollar
  WFIL: 'ethereum', // Wrapped Filecoin
  WZEC: 'ethereum', // Wrapped Zcash
  XLM: 'stellar',
  XRP: 'ripple',
  XTZ: 'tezos',
  ZEC: 'zcash',
  ZRX: 'ethereum', // 0x
  cUSD: 'celo',
}

export const execute: ExecuteWithConfig<Config> = async (request, _, config) => {
  const validator = new Validator(request, inputParameters)

  const jobRunID = validator.validated.id
  const symbol = validator.validated.data.symbol
  const chainId = validator.validated.data.chainId
  const network = validator.validated.data.network || networks[symbol]
  const url = `/deposits`

  const options = { ...config.api, url }
  const response = await Requester.request<ResponseSchema>(options, customError)
  const addresses = response.data[symbol]

  if (!addresses) {
    const keys = Object.keys(response.data).join()
    throw new AdapterError({
      jobRunID,
      message: `Input, at 'symbol' path, must be one of the following values: ${keys}`,
      statusCode: 400,
    })
  }

  const result = addresses.map((address: Address) => ({
    address,
    network,
    chainId,
  }))

  return Requester.success(
    jobRunID,
    Requester.withResult(response, result as AxiosResponse<Address[]>),
  )
}
