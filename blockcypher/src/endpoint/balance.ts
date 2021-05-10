import bcypher from 'blockcypher'
import { balance } from '@chainlink/ea-factories'
import { Account } from '@chainlink/types'
import { Config } from '../config'
import { CoinType, ChainType, isCoinType, isChainType } from '.'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'balance'

// blockcypher response type for addr balance query
type AddressBalance = {
  address: string
  total_received: number
  total_sent: number
  balance: number
  unconfirmed_balance: number
  final_balance: number
  n_tx: number
  unconfirmed_n_tx: number
  final_n_tx: number
}

// rewrite chain id for bcypher
const getChainId = (coin: CoinType, chain: ChainType): string => {
  switch (chain) {
    case 'mainnet':
      return 'main'
    case 'testnet':
      return coin === 'btc' ? 'test3' : 'test'
  }
}

const getBalances: balance.GetBalances<Config> = async (accounts, config) => {
  const addresses = accounts.map((a) => a.address)
  const { coin, chain } = accounts[0]
  const chainId = getChainId(coin as CoinType, chain as ChainType)
  const api = new bcypher(coin, chainId, config.apiKey)
  const params = { confirmations: config.confirmations }

  const _getAddrBal = (addrs: string[]) =>
    new Promise<AddressBalance[]>((resolve, reject) => {
      api.getAddrBal(
        addrs.join(';'),
        params,
        (error: Error, body: AddressBalance | AddressBalance[]) => {
          const data = addrs.length > 1 ? (body as AddressBalance[]) : [body as AddressBalance]
          error ? reject(error) : resolve(data)
        },
      )
    })

  const response = config.ratelimit
    ? await util.throttle(config.ratelimit, addresses, _getAddrBal)
    : await _getAddrBal(addresses)

  const addrLookup: { [key: string]: AddressBalance } = {}
  response.forEach((r: any) => (addrLookup[r.address] = r))

  const addBalance = (acc: Account) => ({
    ...acc,
    balance: String(addrLookup[acc.address].final_balance),
  })
  const resultWithBalance = accounts.map(addBalance)

  return {
    payload: response,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) =>
  balance.make<Config>({ ...config, getBalances, isSupported })
