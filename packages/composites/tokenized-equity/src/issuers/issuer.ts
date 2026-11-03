import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { config } from '../config'

export type Settings = typeof config.settings

// Every issuer returns its multiplier as an 18 decimal fixed point number.
// Hardcoded, like the issuer-specific endpoints, rather than read from chain.
export const MULTIPLIER_DECIMALS = 18

export type IssuerRequest = {
  // Token address of the tokenized asset
  asset: string
  // Issuer registry contract. Only used by registry issuers
  registry?: string
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
 * An issuer of tokenized assets. The price of a tokenized asset is the price of
 * its underlying asset times the multiplier the issuer keeps on chain.
 */
export abstract class Issuer {
  abstract readonly name: string

  /** The RPC of the chain the multiplier is read from. */
  abstract rpc(settings: Settings, request: IssuerRequest): Rpc

  /** Reads the multiplier and pause state from chain. */
  protected abstract fetch(
    request: IssuerRequest,
    provider: JsonRpcProvider,
  ): Promise<MultiplierData>

  /** Throws an AdapterInputError for a request this issuer cannot serve. */
  validate(settings: Settings, request: IssuerRequest): void {
    this.rpc(settings, request)
  }

  /** Reads the multiplier, refusing a paused asset. */
  async read(request: IssuerRequest, provider: JsonRpcProvider): Promise<MultiplierData> {
    const data = await this.fetch(request, provider)
    if (data.paused) {
      throw new AdapterError({
        statusCode: 503,
        message: `asset: '${request.asset}' paused for issuer '${this.name}'`,
      })
    }
    return data
  }

  /** RPC of an issuer that reads from one fixed chain, set by `<CHAIN>_RPC_URL`. */
  protected fixedChainRpc(settings: Settings, chain: 'ETHEREUM' | 'BASE'): Rpc {
    const url = settings[`${chain}_RPC_URL`]
    if (!url) {
      throw new AdapterInputError({ statusCode: 400, message: `Missing ${chain}_RPC_URL` })
    }
    return { url, chainId: settings[`${chain}_RPC_CHAIN_ID`] }
  }
}

/** An issuer that keeps the multiplier of each asset in a registry contract. */
export abstract class RegistryIssuer extends Issuer {
  protected abstract readonly fetchFromRegistry: (
    asset: string,
    registry: string,
    provider: JsonRpcProvider,
  ) => Promise<MultiplierData>

  override validate(settings: Settings, request: IssuerRequest): void {
    this.registry(request)
    super.validate(settings, request)
  }

  protected fetch(request: IssuerRequest, provider: JsonRpcProvider): Promise<MultiplierData> {
    return this.fetchFromRegistry(request.asset, this.registry(request), provider)
  }

  private registry({ registry }: IssuerRequest): string {
    if (!registry) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing required parameter registry for issuer '${this.name}'`,
      })
    }
    return registry
  }
}
