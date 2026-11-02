import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { coinbase } from './coinbase'
import { Issuer } from './issuer'
import { ondo } from './ondo'
import { robinhood } from './robinhood'
import { xstocks } from './xstocks'

export {
  assertNotPaused,
  defineIssuer,
  getRegistry,
  MULTIPLIER_DECIMALS,
  requireRegistry,
  requireRpcUrl,
} from './issuer'
export type { Issuer, IssuerParams, IssuerRequest, MultiplierData, Rpc } from './issuer'

// Issuers by name. To support a new issuer, build it with defineIssuer and add it here.
export const issuerDirectory = {
  robinhood,
  coinbase,
  xstocks,
  ondo,
} satisfies Record<string, Issuer>

export type IssuerName = keyof typeof issuerDirectory

export const issuerNames = Object.keys(issuerDirectory) as IssuerName[]

// Own properties only: `in` would also accept inherited names like "toString"
export const isIssuerName = (name: string): name is IssuerName =>
  Object.prototype.hasOwnProperty.call(issuerDirectory, name)

export const getIssuer = (name: string): Issuer => {
  if (!isIssuerName(name)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Unsupported issuer '${name}'. Supported issuers: ${issuerNames.join(', ')}`,
    })
  }
  return issuerDirectory[name]
}
