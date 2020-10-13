import objectPath from 'object-path'
import { Requester } from '@chainlink/external-adapter'
import { AdapterRequest } from '@chainlink/types'

import { Config, DEFAULT_CONFIRMATIONS, DEFAULT_DATA_PATH, getBaseURL } from '../config'
import { CoinType, ChainType } from '.'

export const Name = 'balance'

type Address = {
  address: string
  coin?: CoinType
  chain?: ChainType
  balance?: number
}

type RequestData = {
  dataPath: string
  confirmations: number
}

const WARNING_NO_OPERATION =
  'No Operation: only btc mainnet/testnet chains are supported by blockchain.com adapter'
const WARNING_NO_OPERATION_MISSING_ADDRESS = 'No Operation: address param is missing'

const getBalanceURI = (address: string, confirmations: number) =>
  `/q/addressbalance/${address}?confirmations=${confirmations}`

const toBalances = async (
  config: Config,
  addresses: Address[],
  confirmations: number = DEFAULT_CONFIRMATIONS,
): Promise<Address[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.address) return { ...addr, warning: WARNING_NO_OPERATION_MISSING_ADDRESS }

      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...addr, warning: WARNING_NO_OPERATION }

      if (!addr.chain) addr.chain = 'mainnet'
      if (addr.chain !== 'mainnet' && addr.chain !== 'testnet')
        return { ...addr, warning: WARNING_NO_OPERATION }

      const reqConfig = {
        ...config.api,
        baseURL: getBaseURL(addr.chain),
        url: getBalanceURI(addr.address, confirmations),
      }

      return {
        ...addr,
        balance: (await Requester.request(reqConfig)).data,
      }
    }),
  )

export const inputParams = {
  dataPath: false,
  confirmations: false,
}

// Export function to integrate with Chainlink node
export const execute = async (
  config: Config,
  request: AdapterRequest,
  data: RequestData,
): Promise<Address[]> => {
  const dataPath = data.dataPath || DEFAULT_DATA_PATH
  const inputData = <Address[]>objectPath.get(request.data, dataPath)

  // Check if input data is valid
  if (!inputData || !Array.isArray(inputData) || inputData.length === 0)
    throw Error(`Input, at '${dataPath}' path, must be a non-empty array.`)

  return await toBalances(config, inputData, data.confirmations)
}
