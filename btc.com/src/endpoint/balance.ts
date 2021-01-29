import { balance } from '@chainlink/ea-factories'
import { isChainType, isCoinType } from '.'
import * as blocktrail from 'blocktrail-sdk'
import { ImplConfig } from '../config'

export const NAME = 'balance'

const getBalance: balance.GetBalance<ImplConfig> = async (account, config) => {
  const client = blocktrail.BlocktrailSDK({
    apiKey: config.apiKey,
    apiSecret: config.apiSecret,
    network: account.coin?.toUpperCase(),
    testnet: account.chain === 'testnet',
  })

  const response: any = await new Promise((resolve, reject) =>
    client.address(account.address, (error: any, address: any) =>
      error ? reject(error) : resolve(address),
    ),
  )

  return {
    payload: response,
    result: [{ ...account, balance: String(response.balance) }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: ImplConfig) =>
  balance.make<ImplConfig>({ ...config, getBalance, isSupported })
