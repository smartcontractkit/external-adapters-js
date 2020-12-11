import objectPath from 'object-path'
import { Requester, Validator, AdapterError } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config, Address, Account } from '@chainlink/types'
import { DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType, COINS } from '.'

export const Name = 'balance'

type AddressGroup = {
  addresses: string[]
  result: Account[]
}

type GroupedAddresses = {
  [network: string]: AddressGroup
}

type ResponseWithResult = {
  response: any
  result: Account[]
}

type RequestData = {
  dataPath: string
  confirmations: number
}

const WARNING_NO_OPERATION_TESTNET =
  'No Operation: only testnet supported by blockchair adapter is btc'

const group = (jobRunID: string, addresses: Address[]) => {
  const output: GroupedAddresses = {}

  for (const addr of addresses) {
    if (!addr.address)
      throw new AdapterError({
        jobRunID,
        message: `Addresses are required`,
        statusCode: 400,
      })

    let { address, coin, chain } = addr
    coin = addr.coin || 'btc'
    chain = addr.chain || 'mainnet'
    coin = Requester.toVendorName(coin, COINS)
    if (!coin)
      throw new AdapterError({
        jobRunID,
        message: `Unsupported coin parameter`,
        statusCode: 500,
      })
    if (chain === 'testnet' && coin == 'bitcoin') coin = 'bitcoin/testnet'

    const key = coin
    output[key] = output[key] || { addresses: [], result: [] }
    output[key].addresses.push(address)
    output[key].result.push(addr)
  }
  return output
}

const getBalanceURI = (addresses: string[], coin: string) =>
  `/${coin}/addresses/balances?addresses=${addresses.join(',')}`

const getBalances = async (
  jobRunID: string,
  config: Config,
  groupedData: GroupedAddresses,
): Promise<ResponseWithResult[]> =>
  Promise.all(
    Object.entries(groupedData).map(async ([coin, reqData]) => {
      const { result } = reqData

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(reqData.addresses, coin),
      }

      const response = await Requester.request(reqConfig)

      const toResultWithBalance = (r: Address) => {
        const balance = response.data.data[r.address]
        return { ...r, balance }
      }
      const resultWithBalance: Account[] = result.map(toResultWithBalance)

      return {
        response: response.data,
        result: resultWithBalance,
      }
    }),
  )

const reduceResponse = (responses: ResponseWithResult[]) =>
  responses.reduce(
    (accumulator, current) => {
      accumulator.data.responses.push(current.response)
      accumulator.data.result = [...accumulator.data.result, ...current.result]
      return accumulator
    },
    { data: { responses: [], result: [] }, status: 200 } as any,
  )

export const inputParams = {
  dataPath: false,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const execute: ExecuteWithConfig = async (input, config) => {
  const validator = new Validator(input, inputParams)
  if (validator.error) throw validator.error
  const jobRunID = validator.validated.id

  const data: RequestData = validator.validated.data
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(input.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw new AdapterError({
      jobRunID,
      message: `Input, at '${dataPath}' path, must be a non-empty array.`,
      statusCode: 400,
    })
  const groupedData = group(jobRunID, inputData)
  const response = await getBalances(jobRunID, config, groupedData)
  return reduceResponse(response)
}
