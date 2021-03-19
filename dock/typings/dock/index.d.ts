declare module 'dock/types' {
  import { AdapterRequest, AdapterResponse } from '@chainlink/types'

  export type ExecuteWithJobId = (
    input: AdapterRequest,
    jobRunID: string,
  ) => Promise<AdapterResponse>

  export type DockConfig = {
    // TCP endpoint of the Substrate node
    NODE_ENDPOINT: string
    // Oracle secret key. Used when writing to chain.
    ORACLE_SK: string
    // Oracle address. Used for reading oracle's last submission before when writing to chain.
    ORACLE_ADDRESS: string
    // Address of the proxy contract
    PROXY_ADDRESS: string,
    // ABI of the proxy contract
    PROXY_ABI: Array<Record<string, any>>,
    // ABI of the aggregator contract
    AGGREGATOR_ABI: Array<Record<string, any>>,
  }

  export type PriceUpdateParams = {
    // Update with the current price no matter what
    forceWrite: boolean
    // Current price
    currentPrice: number
    // Threshold percentage by which price should change to trigger an update on.
    thresholdPct: number
    // Even if current price has not deviated by threshold, trigger an update if the last timestamp where update happened is older by this number of seconds
    idleTime: number
  }
}
