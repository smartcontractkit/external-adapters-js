import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType, isCoinType, isChainType } from '.'

export const Name = 'balance'

type Address = {
  address: string
  coin?: CoinType
  chain?: ChainType
  balance?: number
  warning?: string
}

type RequestData = {
  dataPath: string
  confirmations: number
}

type ResponseWithResult = {
  response: any
  result: Address
}

const WARNING_NO_OPERATION_COIN = 'No Operation: unsupported coin'
const WARNING_NO_OPERATION_CHAIN =
  "No Operation: invalid chain parameter, must be one of 'mainnet' or 'testnet'"
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

const getBalanceURI = (address: string, chain: string, coin: string) =>
  `/v1/bc/${coin}/${chain}/address/${address}`

const getBalances = async (config: Config, addresses: Address[]): Promise<ResponseWithResult[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.address) return { ...addr, warning: WARNING_NO_OPERATION_MISSING_ADDRESS }

      if (!addr.coin) addr.coin = 'btc'
      if (isCoinType(addr.coin) === false) return { ...addr, warning: WARNING_NO_OPERATION_COIN }

      if (!addr.chain) addr.chain = 'mainnet'
      if (isChainType(addr.chain) === false) return { ...addr, warning: WARNING_NO_OPERATION_CHAIN }

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(addr.address, addr.chain, addr.coin),
      }

      try {
        const response = await Requester.request(reqConfig)
        return {
          response,
          result: { ...addr, balance: response.data.payload.balance },
        }
      } catch (error) {
        return error
      }
    }),
  )

const reduceResponse = (responses: ResponseWithResult[]) =>
  responses.reduce(
    (accumulator, current) => {
      accumulator.data.responses = [...accumulator.data.responses, current.response]
      accumulator.data.responses = [...accumulator.data.result, current.result]
      return accumulator
    },
    {
      data: { responses: [], result: [] },
      status: 200,
    } as any,
  )

export const inputParams = {
  dataPath: false,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const execute = async (config: Config, request: AdapterRequest) => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const data: RequestData = validator.validated.data
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw Requester.errored(
      jobRunID,
      `Input, at '${dataPath}' path, must be a non-empty array.`,
      400,
    )

  try {
    const responses = await getBalances(config, inputData)
    return reduceResponse(responses)
  } catch (error) {
    throw Requester.errored(jobRunID, error)
  }
}
