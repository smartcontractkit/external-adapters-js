import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { PriceAdapter } from '@chainlink/external-adapter-framework/adapter' // Use PriceAdapter instead
import { config } from './config'
import { linkEth, linkUsdc } from './endpoint' // Ensure this exports the endpoints correctly (e.g., via index.ts or direct imports)

export const adapter = new PriceAdapter({
  // Switch to PriceAdapter
  defaultEndpoint: linkUsdc.name,
  name: 'BASIC_LINK-PRICE-SOURCE',
  config,
  endpoints: [linkUsdc, linkEth],
  // includes: [...] // Optional: Add if you have an includes.json for inverse pairs (e.g., ETH/LINK as 1 / LINK/ETH)
})

export const server = (): Promise<ServerInstance | undefined> => expose(adapter)
