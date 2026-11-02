import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { config } from '../config'

export type Settings = typeof config.settings

// Every supported issuer returns its multiplier as an 18 decimal fixed point
// number. Hardcoded, like the issuer-specific endpoints, rather than read from chain.
export const MULTIPLIER_DECIMALS = 18

export type IssuerParams = {
  // Token address of the tokenized asset
  asset: string
  // Issuer registry contract, for issuers that keep the multiplier in a registry
  registry?: string
}

export type IssuerRequest = IssuerParams & {
  // Robinhood chain network, e.g. mainnet. Only used by robinhood
  network?: string
}

export type MultiplierData = {
  multiplier: bigint
  paused: boolean
}

export type Rpc = {
  url: string
  chainId?: number
}

/**
 * Reads the on-chain multiplier of a tokenized asset for one issuer. The
 * price of the tokenized asset is the underlying price times the multiplier.
 */
export interface Issuer {
  name: string
  // Fixed point decimals of the multiplier returned by read
  multiplierDecimals: number
  // Throws an AdapterInputError for a request this issuer cannot serve
  validate: (settings: Settings, request: IssuerRequest) => void
  // RPC of the chain the multiplier is read from
  rpc: (settings: Settings, request: IssuerRequest) => Rpc
  read: (params: IssuerParams, provider: JsonRpcProvider) => Promise<MultiplierData>
}

// Builds an Issuer with the hardcoded 18 decimal multiplier
export const defineIssuer = (spec: Omit<Issuer, 'multiplierDecimals'>): Issuer => ({
  multiplierDecimals: MULTIPLIER_DECIMALS,
  ...spec,
})

const missingRegistryMessage = (issuer: string) =>
  `Missing required parameter registry for issuer '${issuer}'`

// Validation helper for issuers that keep the multiplier in a registry contract
export const requireRegistry = (issuer: string, request: IssuerRequest) => {
  if (!request.registry) {
    throw new AdapterInputError({ statusCode: 400, message: missingRegistryMessage(issuer) })
  }
}

// Validation helper for issuers on a fixed chain: its RPC URL env var is set
export const requireRpcUrl = (settings: Settings, envVar: 'ETHEREUM_RPC_URL' | 'BASE_RPC_URL') => {
  if (!settings[envVar]) {
    throw new AdapterInputError({ statusCode: 400, message: `Missing ${envVar}` })
  }
}

export const ethereumRpc = (settings: Settings): Rpc => ({
  url: settings.ETHEREUM_RPC_URL,
  chainId: settings.ETHEREUM_RPC_CHAIN_ID,
})

export const baseRpc = (settings: Settings): Rpc => ({
  url: settings.BASE_RPC_URL,
  chainId: settings.BASE_RPC_CHAIN_ID,
})

export const getRegistry = (issuer: string, params: IssuerParams): string => {
  if (!params.registry) {
    throw new AdapterInputError({ statusCode: 400, message: missingRegistryMessage(issuer) })
  }
  return params.registry
}

export const assertNotPaused = (issuer: Issuer, asset: string, paused: boolean) => {
  if (paused) {
    throw new AdapterError({
      statusCode: 503,
      message: `asset: '${asset}' paused for issuer '${issuer.name}'`,
    })
  }
}
