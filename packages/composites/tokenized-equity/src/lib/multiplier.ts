import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Contract, JsonRpcProvider } from 'ethers'
import { config } from '../config'
import XstocksABI from '../config/XstocksWrappedBackedTokenABI.json'
import { getRegistryData as getCoinbaseRegistryData } from './coinbase'
import { getRegistryData as getOndoRegistryData } from './registry'
import { getTokenData as getRobinhoodTokenData } from './robinhood'

// The Coinbase and Ondo registries return an 18 decimal fixed point
// multiplier but expose no getter for its decimals (verified on-chain), so
// this is the only multiplier scale that is not read from chain.
const REGISTRY_MULTIPLIER_DECIMALS = 18

const ERC20_DECIMALS_ABI = ['function decimals() view returns (uint8)']

type Settings = typeof config.settings

export type MultiplierParams = {
  issuer: string
  asset: string
  registry?: string
  // Network to read the multiplier from, resolved to ${NETWORK}_RPC_URL
  network: string
}

export type MultiplierMetadata = {
  // Decimals of the multiplier returned by read()
  multiplierDecimals: number
  // Decimals of the wrapped share, for issuers whose multiplier is a share conversion
  shareDecimals?: number
}

export type MultiplierData = {
  multiplier: bigint
  paused: boolean
}

export type RpcConfig = {
  // Undefined when ${NETWORK}_RPC_URL is unset
  url?: string
  // Undefined when ${NETWORK}_CHAIN_ID is unset, in which case it is detected from the RPC
  chainId?: number
}

type IssuerConfig = {
  // Whether the issuer reads the multiplier from a registry contract rather than the asset itself
  requiresRegistry: boolean
  // Static on-chain properties of the asset, read once and cached
  metadata: (params: MultiplierParams, provider: JsonRpcProvider) => Promise<MultiplierMetadata>
  read: (
    params: MultiplierParams,
    provider: JsonRpcProvider,
    metadata: MultiplierMetadata,
  ) => Promise<MultiplierData>
}

/**
 * Resolves the RPC of a network from ${NETWORK}_RPC_URL and the optional
 * ${NETWORK}_CHAIN_ID, e.g. "robinhood-mainnet" -> ROBINHOOD_MAINNET_RPC_URL.
 */
export const getNetworkRpc = (settings: Settings, network: string): RpcConfig => ({
  url: settings.NETWORK_RPC_URL.get(network),
  chainId: settings.NETWORK_CHAIN_ID.get(network),
})

const registryMetadata: IssuerConfig['metadata'] = async () => ({
  multiplierDecimals: REGISTRY_MULTIPLIER_DECIMALS,
})

const getErc20Decimals = async (address: string, provider: JsonRpcProvider) =>
  Number(await new Contract(address, ERC20_DECIMALS_ABI, provider).decimals())

// To support a new issuer, add an entry here.
export const issuers = {
  robinhood: {
    requiresRegistry: false,
    // ERC-8056 scaled UI amount: uiMultiplier is scaled by the token decimals
    metadata: async (params, provider) => ({
      multiplierDecimals: await getErc20Decimals(params.asset, provider),
    }),
    read: (params, provider) => getRobinhoodTokenData(params.asset, provider),
  },
  coinbase: {
    requiresRegistry: true,
    metadata: registryMetadata,
    read: (params, provider) =>
      getCoinbaseRegistryData(params.asset, params.registry as string, provider),
  },
  xstocks: {
    requiresRegistry: false,
    // ERC-4626 style vault: the multiplier is the amount of underlying asset
    // for one whole wrapped share, denominated in the underlying decimals
    metadata: async (params, provider) => {
      const wrapper = new Contract(params.asset, XstocksABI, provider)
      const [shareDecimals, underlying] = await Promise.all([wrapper.decimals(), wrapper.asset()])
      return {
        multiplierDecimals: await getErc20Decimals(underlying, provider),
        shareDecimals: Number(shareDecimals),
      }
    },
    read: async (params, provider, metadata) => {
      const wrapper = new Contract(params.asset, XstocksABI, provider)
      const multiplier = await wrapper.convertToAssets(
        10n ** BigInt(metadata.shareDecimals as number),
      )
      return { multiplier: BigInt(multiplier), paused: false }
    },
  },
  ondo: {
    requiresRegistry: true,
    metadata: registryMetadata,
    read: (params, provider) =>
      getOndoRegistryData(params.asset, params.registry as string, provider),
  },
} satisfies Record<string, IssuerConfig>

export type Issuer = keyof typeof issuers

export const issuerNames = Object.keys(issuers) as Issuer[]

const metadataCache = new Map<string, Promise<MultiplierMetadata>>()

/**
 * Returns the cached metadata of the asset, reading it from chain on first use.
 * networkKey must uniquely identify the chain the provider is connected to.
 */
export const getMultiplierMetadata = (
  params: MultiplierParams,
  provider: JsonRpcProvider,
  networkKey: string,
): Promise<MultiplierMetadata> => {
  const key = [
    params.issuer,
    networkKey,
    params.asset.toLowerCase(),
    (params.registry ?? '').toLowerCase(),
  ].join('@@')

  let metadata = metadataCache.get(key)
  if (!metadata) {
    metadata = getIssuer(params.issuer)
      .metadata(params, provider)
      .catch((e) => {
        // Drop failed lookups so they are retried on the next request
        metadataCache.delete(key)
        throw e
      })
    metadataCache.set(key, metadata)
  }
  return metadata
}

export const clearMultiplierMetadataCache = () => metadataCache.clear()

export const getIssuer = (issuer: string): IssuerConfig => {
  if (!(issuer in issuers)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Unsupported multiplier.issuer '${issuer}'. Supported issuers: ${issuerNames.join(
        ', ',
      )}`,
    })
  }
  return issuers[issuer as Issuer]
}

export const validateMultiplierParams = (settings: Settings, params: MultiplierParams) => {
  const issuer = getIssuer(params.issuer)

  if (issuer.requiresRegistry && !params.registry) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing required parameter multiplier.registry for issuer '${params.issuer}'`,
    })
  }

  if (!getNetworkRpc(settings, params.network).url) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Missing RPC URL for multiplier.network '${
        params.network
      }'. Set ${settings.NETWORK_RPC_URL.getEnvVarName(params.network)}`,
    })
  }
}
