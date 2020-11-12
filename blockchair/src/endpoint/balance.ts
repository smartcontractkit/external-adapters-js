import objectPath from 'object-path'
import { Requester, Validator } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'
import { Config, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType } from '.'

export const Name = 'balance'

type Address = {
  address: string
  coin?: CoinType
  chain?: ChainType
  balance?: number
  warning?: string
}

type AddressGroup = {
  addresses: string[]
  result: Address[]
}

type GroupedAddresses = {
  [network: string]: AddressGroup
}

type ResponseWithResult = {
  response: any
  result: Address[]
}

type RequestData = {
  dataPath: string
  confirmations: number
}

const coins: { [ticker: string]: string } = {
  btc: 'bitcoin',
  dash: 'dash',
  doge: 'dogecoin',
  ltc: 'litecoin',
  zec: 'zcash',
  bch: 'bitcoin-cash',
  bsv: 'bitcoin-sv',
  grs: 'groestlcoin',
}

const WARNING_NO_OPERATION_TESTNET =
  'No Operation: only testnet supported by blockcypher adapter is btc'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'
const WARNING_NO_OPERATION_ADDRESS_NOT_FOUND = 'No Operation: address does not exist on network'

const group = (addresses: Address[]) => {
  const output: GroupedAddresses = {}
  for (const addr of addresses) {
    if (!addr?.address) addr.warning = WARNING_NO_OPERATION_MISSING_ADDRESS
    if (!addr?.coin) {
      addr.coin = 'btc'
    }
    if (!addr?.chain) {
      addr.chain = 'mainnet'
    }
    const { address, coin, chain } = addr
    if (output[`${coin}-${chain}`]) {
      output[`${coin}-${chain}`].addresses.push(address)
      output[`${coin}-${chain}`].result.push(addr)
    } else output[`${coin}-${chain}`] = { addresses: [address], result: [addr] }
  }
  return output
}

const getBalanceURI = (jobRunID: string, addresses: string[], chain: string, coin: string) => {
  coin = coins[coin]
  if (!coin) throw Requester.errored(jobRunID, `Unsupported coin parameter`, 400)
  if (chain === 'testnet') {
    if (coin === 'bitcoin') coin = 'bitcoin/testnet'
    else throw Requester.errored(jobRunID, WARNING_NO_OPERATION_TESTNET, 400)
  }
  return `/${coin}/addresses/balances?addresses=${addresses.join(',')}`
}

const getBalances = async (
  jobRunID: string,
  config: Config,
  groupedData: GroupedAddresses,
): Promise<ResponseWithResult[]> =>
  Promise.all(
    Object.entries(groupedData).map(async ([network, reqData]) => {
      const [coin, chain] = network.split('-')
      let { result } = reqData

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(),
        url: getBalanceURI(jobRunID, reqData.addresses, chain, coin),
      }

      const response = await Requester.request(reqConfig)

      result = result.map((r) => {
        r.balance = response.data.data[r.address]
        if (!r.balance) r.warning = WARNING_NO_OPERATION_ADDRESS_NOT_FOUND
        return r
      })

      return {
        response: response.data,
        result,
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
  const groupedData = group(inputData)
  const response = await getBalances(jobRunID, config, groupedData)
  return reduceResponse(response)
}
