import { Requester, Validator } from '@chainlink/external-adapter'
import { Config, getConfig, logConfig, DEFAULT_CONFIRMATIONS } from './config'

type Address = {
  address: string
  coin: CoinType
  chain?: ChainType
  balance?: number
}
type CoinType = string & 'btc'
type ChainType = string & 'main'
type JobSpecRequest = {
  id: string
  data: { addresses: Address[]; confirmations: number }
}
type Callback = (statusCode: number, data: Record<string, unknown>) => void

const inputParams = {
  addresses: true,
  confirmations: true,
}

const config: Config = getConfig()
logConfig(config)

const WARNING_NO_OPERATION =
  'No Operation: only btc main chain is supported by blockchain.com adapter'

const getBalanceURI = (address: string, confirmations: number) =>
  `/q/addressbalance/${address}?confirmations=${confirmations}`

const toBalances = async (
  addresses: Address[],
  confirmations: number = DEFAULT_CONFIRMATIONS
): Promise<Address[]> =>
  Promise.all(
    addresses.map(async (addr: Address) => {
      if (!addr.coin) addr.coin = 'btc'
      if (addr.coin !== 'btc') return { ...addr, warning: WARNING_NO_OPERATION }

      if (!addr.chain) addr.chain = 'main'
      if (addr.chain !== 'main')
        return { ...addr, warning: WARNING_NO_OPERATION }

      const reqConfig = {
        ...config.api,
        url: getBalanceURI(addr.address, confirmations),
      }
      return {
        ...addr,
        balance: (await Requester.request(reqConfig)).data,
      }
    })
  )

// Export function to integrate with Chainlink node
export const createRequest = (
  request: JobSpecRequest,
  callback: Callback
): void => {
  const validator = new Validator(callback, request, inputParams)
  const jobRunID = validator.validated.id

  const _handleResponse = (out: Address[]): void => {
    callback(
      200,
      Requester.success(jobRunID, {
        data: { result: out },
        result: out,
        status: 200,
      })
    )
  }

  const _handleError = (err: Error): void =>
    callback(500, Requester.errored(jobRunID, err))

  const { data } = validator.validated

  toBalances(data.addresses, data.confirmations)
    .then(_handleResponse)
    .catch(_handleError)
}
