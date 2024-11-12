import { balance } from '@chainlink/ea-factories'
import {
  AxiosRequestConfig,
  AxiosResponse,
  InputParameters,
  Requester,
  util,
} from '@chainlink/ea-bootstrap'
import type { Config, Account, ExecuteFactory } from '@chainlink/ea-bootstrap'
import { COINS, isCoinType, isChainType } from '../config'
import { TBalanceInputParameters } from '@chainlink/ea-factories/src/factories/balance'

export const supportedEndpoints = ['balance']

export const description = '[Address Balance Mass Check](https://blockchair.com/api/docs#link_390)'

export type TInputParameters = TBalanceInputParameters
export const inputParameters: InputParameters<TInputParameters> = balance.inputParameters

const getBalanceURI = (coin: string, chain: string) => {
  coin = Requester.toVendorName(coin, COINS)
  if (chain === 'testnet') coin = `${coin}-${chain}`
  return util.buildUrlPath(`/:coin/addresses/balances`, { coin })
}

const getBalances: balance.GetBalances = async (accounts, config) => {
  const { coin, chain } = accounts[0]
  const addresses = accounts.map((a) => a.address)

  const reqConfig: AxiosRequestConfig = {
    ...config.api,
    url: getBalanceURI(coin || '', chain || ''),
    params: { addresses: addresses.join(',') },
  }

  const response: AxiosResponse = await Requester.request(reqConfig)

  const toResultWithBalance = (acc: Account) => {
    // NOTE: Blockchair does not return 0 balances
    const balance = String(response.data.data[acc.address] ?? 0)
    return { ...acc, balance }
  }
  const resultWithBalance = accounts.map(toResultWithBalance)

  return {
    payload: response.data,
    result: resultWithBalance,
  }
}

const isSupported: balance.IsSupported = (coin, chain) => isChainType(chain) && isCoinType(coin)

export const makeExecute: ExecuteFactory<Config, TInputParameters> = (config?: Config) =>
  balance.make({ ...config, getBalances, isSupported })
