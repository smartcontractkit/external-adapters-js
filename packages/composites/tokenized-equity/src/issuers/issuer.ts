import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { JsonRpcProvider } from 'ethers'
import { config } from '../config'
import { Chain } from '../lib/chains'

export type Settings = typeof config.settings

/**
 * Every issuer keeps its multiplier as an 18 decimal fixed point number.
 * Hardcoded, like the issuer-specific endpoints, rather than read from chain
 * (docs/adr/0004): confirm the decimals when onboarding an issuer or asset.
 */
export const MULTIPLIER_DECIMALS = 18

export type AssetRequest = {
  /** Token address of the tokenized asset */
  asset: string
  /** Registry contract, for issuers that keep multipliers in one */
  registry?: string
  /** Network of the issuer's chain, for issuers with more than one */
  network?: string
}

export type MultiplierState = {
  multiplier: bigint
  paused: boolean
}

/**
 * An issuer of tokenized assets. A tokenized asset is worth its underlying asset
 * times the multiplier the issuer keeps on chain.
 */
export abstract class Issuer {
  abstract readonly name: string

  /**
   * The chain the asset's multiplier lives on. Throws when the request doesn't
   * say which, or the adapter isn't configured for it.
   */
  abstract chain(settings: Settings, request: AssetRequest): Chain

  /** Reads the asset's multiplier and pause state from chain. */
  abstract read(request: AssetRequest, provider: JsonRpcProvider): Promise<MultiplierState>

  /** Rejects a request this issuer cannot serve, before it reaches the transport. */
  validate(settings: Settings, request: AssetRequest): void {
    this.chain(settings, request)
  }

  /** The asset's multiplier. A paused asset has no price, so it fails with a 503. */
  async getMultiplier(request: AssetRequest, provider: JsonRpcProvider): Promise<bigint> {
    const { multiplier, paused } = await this.read(request, provider)
    if (paused) {
      throw new AdapterError({
        statusCode: 503,
        message: `asset: '${request.asset}' paused for issuer '${this.name}'`,
      })
    }
    return multiplier
  }

  /** The registry of an issuer that keeps multipliers in one. */
  protected registry({ registry }: AssetRequest): string {
    if (!registry) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing required parameter registry for issuer '${this.name}'`,
      })
    }
    return registry
  }
}
