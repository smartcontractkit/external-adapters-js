import { Requester, Validator, AdapterInputError } from '@chainlink/ea-bootstrap'
import type {
  Config,
  ExecuteWithConfig,
  InputParameters,
  AxiosResponse,
} from '@chainlink/ea-bootstrap'

export const supportedEndpoints = ['deposits']

export interface ResponseSchema {
  [token: string]: string[]
}

export interface Networks {
  [network: string]: string
}

export type Address = {
  address: string
  network: string
  chainId: string
}

const customError = (data: unknown) => typeof data !== 'object'

export type TInputParameters = { symbol: string; network: string; chainId: string }
export const inputParameters: InputParameters<TInputParameters> = {
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

interface ResponseWithResult extends Partial<AxiosResponse> {
  result: Record<string, string>[]
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
    throw new AdapterInputError({
      jobRunID,
      message: `Input, at 'symbol' path, must be one of the following values: ${keys}`,
      statusCode: 400,
    })
  }

  const addressResult: Address[] = addresses.map((address: string) => ({
    address,
    network,
    chainId,
  }))

  const result: ResponseWithResult = {
    ...response,
    result: addressResult,
    data: {
      result: addressResult,
    },
  }

  return Requester.success(jobRunID, result)
}
