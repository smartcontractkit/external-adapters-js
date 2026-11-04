import { config } from '../../../src/config'

// Mimics a required framework templated setting: get() throws when the
// variable is not configured
const templated = (setting: string, values: Record<string, string | number>) => ({
  get: (network: string) => {
    if (!(network in values)) {
      const envVar = setting.replace('NETWORK', network.toUpperCase())
      throw new Error(`Missing required environment variable: ${envVar}`)
    }
    return values[network]
  },
})

// Only Robinhood mainnet is configured, like stage and prod
export const makeSettings = (overrides: Record<string, unknown> = {}) =>
  ({
    DATA_ENGINE_ADAPTER_URL: 'http://data-engine',
    ETHEREUM_RPC_URL: 'eth-url',
    ETHEREUM_RPC_CHAIN_ID: 1,
    BASE_RPC_URL: 'base-url',
    BASE_RPC_CHAIN_ID: 8453,
    ROBINHOOD_NETWORK_RPC_URL: templated('ROBINHOOD_NETWORK_RPC_URL', { mainnet: 'robinhood-url' }),
    ROBINHOOD_NETWORK_CHAIN_ID: templated('ROBINHOOD_NETWORK_CHAIN_ID', { mainnet: 4663 }),
    ...overrides,
  } as unknown as typeof config.settings)
