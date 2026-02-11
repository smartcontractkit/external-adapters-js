import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  XAU_FEED_ID: {
    description: 'Feed ID for XAU/USD price data stream',
    type: 'string',
    default: '0x0008991d4caf73e8e05f6671ef43cee5e8c5c3652a35fde0b0942e44a77b0e89',
  },
  TOKENIZED_GOLD_PRICE_STREAMS: {
    description:
      'JSON object of streams to use to derive a gold price when the main market is closed',
    type: 'string',
    default: `{
      "XAUT": "0x0003b8b3f33c4c06a7947e86c5b4db4ef0991637d9821b9cdf897c0b5d488468",
      "PAXG": "0x0003b4b1d926719d4f67a08c9ffe9baf688620058c9f029923ea504eb71c877f"
    }`,
  },
  PRICE_STALE_TIMEOUT_MS: {
    description:
      'The amount of time in milliseconds before a price is considered stale if there has been no change',
    type: 'number',
    default: 5 * 60 * 1000, // 5 minutes
  },
  PREMIUM_EMA_TAU_MS: {
    description:
      'Time constant (tau) in milliseconds for the EMA filters used to calculate the average premium of tokenized streams over the XAU price',
    type: 'number',
    default: 1_000_000,
  },
  DEVIATION_EMA_TAU_MS: {
    description:
      'Time constant (tau) in milliseconds for the EMA filters used to calculate the smoothed deviation from the XAU closing price',
    type: 'number',
    default: 1_000_000,
  },
  DEVIATION_CAP: {
    description:
      'Maximum deviation allowed from the closing price. Used deviation is clamped between this and minus this value.',
    type: 'number',
    default: 0.02,
  },
  DATA_ENGINE_ADAPTER_URL: {
    description: 'URL of data engine ea',
    type: 'string',
    required: true,
  },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 1_000,
  },
})
