import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { config } from '../config'
import { issuerNames, issuers, MULTIPLIER_DECIMALS } from '../issuers'
import { DataEngineV11Data, priceFields, targetEndpointNames } from '../lib/dataEngine'
import { issuerPrice247Transport } from '../transport/issuerPrice247Transport'

export const inputParameters = new InputParameters(
  {
    targetEndpoint: {
      type: 'string',
      description: 'The data-engine EA endpoint to request the 24/7 feed from',
      options: targetEndpointNames,
      default: 'v11',
    },
    feedId: {
      required: true,
      type: 'string',
      description: 'Data Streams feed ID of the 24/7 feed for the underlying asset',
    },
    resultPath: {
      required: true,
      type: 'string',
      description: 'The data-engine EA price field to use as the price',
      options: priceFields,
    },
    decimals: {
      type: 'number',
      description: `Decimals of output result, applied after the multiplier. With a multiplier the data-engine price is requested in the multiplier's ${MULTIPLIER_DECIMALS} decimals, without one it is requested in these decimals`,
      default: 8,
    },
    multiplier: {
      required: false,
      description:
        'On-chain multiplier applied to the price. When omitted, the raw stream price is returned',
      type: {
        issuer: {
          required: true,
          type: 'string',
          description: 'The issuer of the tokenized asset',
          options: issuerNames,
        },
        asset: {
          required: true,
          type: 'string',
          description: 'Token address of the tokenized asset',
        },
        registry: {
          required: false,
          type: 'string',
          description: 'Address of the issuer registry contract. Required for coinbase and ondo',
        },
        network: {
          required: false,
          type: 'string',
          description:
            'Robinhood chain network, e.g. `mainnet` (`ROBINHOOD_<NETWORK>_RPC_URL`). Required for robinhood. The other issuers read from a fixed chain: coinbase from Base (`BASE_RPC_URL`), xstocks and ondo from Ethereum (`ETHEREUM_RPC_URL`)',
        },
      },
    },
    marketSessionOverride: {
      required: false,
      type: 'string',
      description:
        'Staging/test hook for the 24/7 session-start gating check: instead of resolving the current session start from the wall clock, the check gates against the NEXT start of the named session, deterministically forcing the pre-session rejection. Affects only the session-start gating check. Only the four real session statuses are accepted (UNKNOWN and WEEKEND can never match a tradinghours transition). Requests carrying this parameter are rejected with 400 unless ALLOW_MARKET_SESSION_OVERRIDE=true and ISSUER_247_SESSION_START_GATING_ENABLED=true.',
      options: ['PRE_MARKET', 'REGULAR', 'POST_MARKET', 'OVERNIGHT'],
    },
  },
  [
    {
      targetEndpoint: 'v11',
      feedId: '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1',
      resultPath: 'lastTradedPrice',
      decimals: 8,
      multiplier: {
        issuer: 'robinhood',
        asset: '0x2e0847E8910a9732eB3fb1bb4b70a580ADAD4FE3',
        network: 'mainnet',
      },
    },
    {
      targetEndpoint: 'v11',
      feedId: '0x000b0b1c31f90396e910c57ec94ed963271e4e39f15da3d92f81e273083ce4a1',
      resultPath: 'lastTradedPrice',
      decimals: 8,
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      result: string
      decimals: number
      rawPrice: string
      rawPriceDecimals: number
      // Only present when a multiplier is requested
      rawMultipliedPrice?: string
      rawMultipliedPriceDecimals?: number
      dataEngine: DataEngineV11Data
      // Present when 24/7 session-start gating ran: which schedule tier supplied the
      // session start (absent when gating is off or served fail-open)
      gatingSessionSource?: 'TRADINGHOURS' | 'FALLBACK'
      multiplier?: {
        issuer: string
        network?: string
        value: string
        decimals: number
      }
    }
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'issuer-price-247',
  transport: issuerPrice247Transport,
  inputParameters,
  customInputValidation: ({ requestContext: { data } }, settings) => {
    if (data.multiplier) {
      issuers[data.multiplier.issuer].validate(settings, data.multiplier)
    }
    settings.SOURCE_ADAPTER_URL.get('DATA_ENGINE')
    if (settings.ISSUER_247_SESSION_START_GATING_ENABLED) {
      // Gating needs the tradinghours EA for its tier-1 schedule
      settings.SOURCE_ADAPTER_URL.get('TRADING_HOURS')
    }
    return undefined
  },
})
