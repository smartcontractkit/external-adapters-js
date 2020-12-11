import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { AdapterRequest, AdapterResponse, Address, Account, Config } from '@chainlink/types'
import { DEFAULT_CONFIRMATIONS, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { isCoinType, isChainType } from '.'

export const Name = 'balance'

type RequestData = {
  dataPath: string
  confirmations: number
}

type ResponseWithResult = {
  response?: any
  result?: Account
}

const WARNING_NO_OPERATION_COIN = 'No Operation: unsupported coin type'
const WARNING_NO_OPERATION_CHAIN = 'No Operation: unsupported chain type'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

const getBalanceURI = (network: string, address: string, confirmations: number, chain: string) => {
  network = network.toUpperCase()
  if (chain === 'testnet') network = network + 'TEST'
  return `/api/v2/get_address_balance/${network}/${address}/${confirmations}`
}

const toBalances = async (
  jobRunID: string,
  config: Config,
  addresses: Address[],
  confirmations: number = DEFAULT_CONFIRMATIONS,
): Promise<ResponseWithResult[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.address)
        throw new AdapterError({
          jobRunID,
          message: WARNING_NO_OPERATION_MISSING_ADDRESS,
          statusCode: 400,
        })

      if (!addr.coin) addr.coin = 'btc'
      if (isCoinType(addr.coin) === false)
        throw Requester.errored(jobRunID, WARNING_NO_OPERATION_COIN, 400)
      if (!addr.chain) addr.chain = 'mainnet'
      if (isChainType(addr.chain) === false)
        throw Requester.errored(jobRunID, WARNING_NO_OPERATION_CHAIN, 400)

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(addr.coin, addr.address, confirmations, addr.chain),
      }

      const response = await Requester.request(reqConfig)

      return {
        response: response.data,
        result: { ...addr, balance: response.data.data.confirmed_balance },
      }
    }),
  )

const reduceResponse = (responses: ResponseWithResult[], config: Config) =>
  responses.reduce(
    (accumulator, current) => {
      accumulator.responses = [...accumulator.responses, current.response]
      accumulator.result = [...accumulator.result, current.result]
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
export const execute = async (config: Config, request: AdapterRequest): Promise<Address[]> => {
  const validator = new Validator(request, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const data: RequestData = validator.validated.data
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw new AdapterError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a non-empty array.`,
      statusCode: 400,
    })

  const responses = await toBalances(jobRunID, config, inputData)
  return reduceResponse(responses, config)
}

// data: response.data,
// result: response.data.result,
// statusCode: response.status,
