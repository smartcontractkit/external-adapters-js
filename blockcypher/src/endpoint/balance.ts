import bcypher from 'blockcypher'
import { balance } from '@chainlink/ea-factories'
import { Config, Account } from '@chainlink/types'
import { ImplConfig } from '../config'
import { CoinType, ChainType, isCoinType, isChainType } from '.'
import { response } from 'express'

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

const chunk = (amount: number, data: any[]) => {
  const output: any[][] = []
  const length = data.length
  if (amount < 1 || length < 1) return output
  const chunks = Math.ceil(data.length / amount)
  for (let i = 0; i < chunks; i++) {
    const offset = amount * i
    const slice = data.slice(offset, offset + amount)
    output.push(slice)
  }
  return output
}

const throttle = async (amount: number, data: any[], callback: any) => {
  const chunks = chunk(amount, data)
  const responses = await Promise.all(
    chunks.map(async (c, i) => {
      await new Promise((resolve) => setTimeout(resolve, i * 1000))
      return await callback(c)
    }),
  )
  return responses.flat()
}

const getBalances: balance.GetBalances<ImplConfig> = async (accounts, config) => {
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

  const response = config.throttle
    ? await throttle(config.throttle, addresses, _getAddrBal)
    : await _getAddrBal(addresses)

  const responseLookup: { [key: string]: AddressBalance } = {}
  response.forEach((a) => (responseLookup[a.address] = a))

  const toResultWithBalance = (acc: Account) => ({
    ...acc,
    balance: String(responseLookup[acc.address].final_balance),
  })
  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: ImplConfig) =>
  balance.make<ImplConfig>({ ...config, getBalances, isSupported })
