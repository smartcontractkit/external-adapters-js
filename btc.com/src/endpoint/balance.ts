import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { AdapterRequest, Address, Account, Config } from '@chainlink/types'
import { DEFAULT_DATA_PATH, getBaseURL } from '../config'

export const Name = 'balance'

type RequestData = {
  dataPath: string
  confirmations: number
}

type ResponseWithResult = {
  response: any
  result: Account
  warning?: string
}

const WARNING_NO_OPERATION = 'No Operation: only btc mainnet is supported by BTC.com adapter'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

const getBalanceURI = (address: string) => `/v3/address/${address}`

const toBalances = async (
  config: Config,
  addresses: Address[],
  jobRunID: string,
): Promise<ResponseWithResult[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      const warnedResponse = {
        result: { ...addr, balance: 0 },
        response: null,
      }

      if (!addr.address)
        throw new AdapterError({
          jobRunID,
          message: WARNING_NO_OPERATION_MISSING_ADDRESS,
          statusCode: 400,
        })

      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...warnedResponse, warning: WARNING_NO_OPERATION }
      if (!addr.chain) addr.chain = 'mainnet'
      if (addr.chain !== 'mainnet') return { ...warnedResponse, warning: WARNING_NO_OPERATION }

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(addr.address),
      }

      const response = await Requester.request(reqConfig)

      return {
        response: response.data,
        result: { ...addr, balance: response.data.data.balance },
      }
    }),
  )

const reduceResponse = (responses: ResponseWithResult[]) =>
  responses.reduce(
    (accumulator, current) => {
      accumulator.data.responses = [...accumulator.data.responses, current.response]
      accumulator.data.result = [...accumulator.data.result, current.result]
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

  const responses = await toBalances(config, inputData, jobRunID)
  return reduceResponse(responses)
}
