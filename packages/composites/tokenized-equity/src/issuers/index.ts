import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { coinbase } from './coinbase'
import { Issuer } from './issuer'
import { ondo } from './ondo'
import { robinhood } from './robinhood'
import { xstocks } from './xstocks'

export { MULTIPLIER_DECIMALS } from './issuer'
export type { Issuer, IssuerRequest, MultiplierData, Rpc } from './issuer'
export { coinbase, ondo, robinhood, xstocks }

// To support a new issuer, extend Issuer (or RegistryIssuer) and add it here
const issuers = new Map<string, Issuer>(
  [robinhood, coinbase, xstocks, ondo].map((issuer) => [issuer.name, issuer]),
)

export const issuerNames = [...issuers.keys()]

export const getIssuer = (name: string): Issuer => {
  const issuer = issuers.get(name)
  if (!issuer) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Unsupported issuer '${name}'. Supported issuers: ${issuerNames.join(', ')}`,
    })
  }
  return issuer
}
