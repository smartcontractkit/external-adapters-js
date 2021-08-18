/**
 * Taken from github.com/renproject/ren-js@5bfaf3f
 * This provides a v1 interop layer so we can continue using legacy behaviour
 * with the new v2 package
 */

import { RenNetwork, RenNetworks } from '@renproject/interfaces'

export enum RenContract {
  Btc2Eth = 'BTC0Btc2Eth',
  Eth2Btc = 'BTC0Eth2Btc',
  Zec2Eth = 'ZEC0Zec2Eth',
  Eth2Zec = 'ZEC0Eth2Zec',
  Bch2Eth = 'BCH0Bch2Eth',
  Eth2Bch = 'BCH0Eth2Bch',
}
export const RenContracts = [
  RenContract.Btc2Eth,
  RenContract.Eth2Btc,
  RenContract.Zec2Eth,
  RenContract.Eth2Zec,
  RenContract.Bch2Eth,
  RenContract.Eth2Bch,
]

export const resolveInToken = (sendToken: string): RenContract => {
  switch (sendToken) {
    case 'BTC':
      return RenContract.Btc2Eth
    case 'BCH':
      return RenContract.Bch2Eth
    case 'ZEC':
      return RenContract.Zec2Eth
    default:
      return sendToken as RenContract
  }
}

export const isRenContract = (maybeRenContract: any): maybeRenContract is RenContract =>
  RenContracts.indexOf(maybeRenContract) !== -1

export const isRenNetwork = (maybeRenNetwork: any): maybeRenNetwork is RenNetwork =>
  RenNetworks.indexOf(maybeRenNetwork) !== -1

export enum Asset {
  BTC = 'BTC',
  ZEC = 'ZEC',
  ETH = 'ETH',
  BCH = 'BCH',
}
export const Assets = [Asset.BTC, Asset.ZEC, Asset.ETH, Asset.BCH]
export const isAsset = (maybeAsset: any): maybeAsset is Asset => Assets.indexOf(maybeAsset) !== -1 // tslint:disable-line: no-any

interface RenContractDetails {
  asset: Asset
  from: string
  to: string
}

const renContractRegex = /^(.*)0(.*)2(.*)$/
const defaultMatch = [undefined, undefined, undefined, undefined]

/**
 * parseRenContract splits a RenVM contract (e.g. `BTC0Eth2Btc`) into the asset
 * (`BTC`), the origin chain (`Eth`) and the target chain (`Btc`).
 */
export const parseRenContract = (renContract: RenContract): RenContractDetails => {
  // re.exec("BTC0Eth2Btc") => ['BTC0Eth2Btc', 'BTC', 'Eth', 'Btc']
  const [, asset, from, to] = renContractRegex.exec(renContract) || defaultMatch
  if (!asset || !from || !to) {
    throw new Error(`Invalid Ren Contract "${renContract}"`)
  }

  return {
    asset: asset as Asset,
    from: from,
    to: to,
  }
}

export enum RenTokens {
  BTC = 'BTC',
  ZEC = 'ZEC',
  BCH = 'BCH',
}

export const getTokenName = (
  tokenOrContract: RenTokens | RenContract | Asset | ('BTC' | 'ZEC' | 'BCH'),
): RenTokens => {
  switch (tokenOrContract) {
    case RenTokens.BTC:
    case RenTokens.ZEC:
    case RenTokens.BCH:
      return tokenOrContract as RenTokens
    case Asset.BTC:
    case 'BTC':
      return RenTokens.BTC
    case Asset.ZEC:
    case 'ZEC':
      return RenTokens.ZEC
    case Asset.BCH:
    case 'BCH':
      return RenTokens.BCH
    case Asset.ETH:
      throw new Error(`Unexpected token ${tokenOrContract}`)
    default:
      return getTokenName(parseRenContract(tokenOrContract).asset)
  }
}
