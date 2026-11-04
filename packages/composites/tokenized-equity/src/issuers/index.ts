import { coinbase } from './coinbase'
import { ondo } from './ondo'
import { robinhood } from './robinhood'
import { xstocks } from './xstocks'

export { Issuer, MULTIPLIER_DECIMALS } from './issuer'
export type { AssetRequest, MultiplierState } from './issuer'

// To support a new issuer, extend Issuer in its own file and add it here
export const issuers = { robinhood, coinbase, xstocks, ondo }

export type IssuerName = keyof typeof issuers

export const issuerNames = Object.keys(issuers) as IssuerName[]
