import { balance } from '@chainlink/ea-factories'
import { Requester } from '@chainlink/external-adapter'
import { Config } from '@chainlink/types'
import { isCoinType, isChainType, TESTNET_BLOCKCHAINS } from '.'
import { util } from '@chainlink/ea-bootstrap'

export const Name = 'balance'

const getBalanceURI = (address: string, chain: string, coin: string) => {
  if (chain === 'testnet') chain = Requester.toVendorName(coin, TESTNET_BLOCKCHAINS) || chain
  return `/v1/bc/${coin}/${chain}/address/${address}`
}

const getBalance: balance.GetBalance = async (account, config) => {
  const options = {
    ...config.api,
    url: getBalanceURI(account.address, account.chain as string, account.coin as string),
  }

  const response = await Requester.request(options)
  const balance = util.convertUnits(account.chain, response.data.payload.balance)

  return {
    payload: response.data,
    result: [{ ...account, balance }],
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute = (config: Config) => balance.make({ ...config, getBalance, isSupported })
