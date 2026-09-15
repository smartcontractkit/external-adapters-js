import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import { blendedTransport } from '../transport/blended'

export const inputParameters = new InputParameters(
  {
    market: {
      required: true,
      type: 'string',
      description:
        'The market whose calendar routes between the feeds, e.g. `nyse`, `forex` (case-insensitive)',
    },
    open: {
      required: true,
      type: 'string',
      description: 'The feed ID for the open (regular hours) session',
    },
    closed: {
      required: true,
      type: 'string',
      description: 'The feed ID for the closed session',
    },
    overnight: {
      required: false,
      type: 'string',
      description:
        'The feed ID for the overnight session. Must be provided together with `extended` (e.g. for `nyse`)',
    },
    extended: {
      required: false,
      type: 'string',
      description:
        'The feed ID for the extended (pre/post-market) session. Must be provided together with `overnight` (e.g. for `nyse`)',
    },
    resultPath: {
      required: false,
      type: 'string',
      description: 'The data field to populate the top-level result. Defaults to `indicatorPrice`',
    },
    decimals: {
      required: false,
      type: 'number',
      description:
        'Number of decimals to scale the resultPath value to (from the native decimals reported in the response)',
    },
  },
  [
    {
      market: 'nyse',
      open: '0x000b355642ce85f1a35c19651d86e0f62b9d80469b4b076032250b838aa1a291',
      closed: '0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116',
      overnight: '0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116',
      extended: '0x000bbb370f42279bdf6ef55c21b05e319d7e9ca316369c44387a8b5cf17bab3c',
      resultPath: 'indicatorPrice',
    },
  ],
)

/**
 * Wire shape of the `data` group of the blended provider response.
 */
export type BlendedData = {
  rawStitchedPrice: string
  rawPrice: string
  indicatorPrice: string
  decimals: number
  indicatorType: string
  stitchingType: string
  market: string
  session: string
}

/**
 * Wire shape of the `timestamps` group of the blended provider response.
 */
export type BlendedTimestamps = {
  evaluatedAtTs: number
  observationsTimestamp: number
  windowStartTs: number
  windowEndTs: number
}

/**
 * Wire shape of the `metadata` group of the blended provider response.
 */
export type BlendedMetadata = {
  feedsUsed: string[]
  stitchingApplied: boolean
  anchor: { price: string; ts: number; ageSeconds: number } | null
  stitching: { mode: string; params: Record<string, unknown>; phase: string }
  indicator: { type: string; windowSeconds: number; endTs: number }
}

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: BlendedData & BlendedTimestamps & BlendedMetadata
  }
  Settings: typeof config.settings
}

export const endpoint = new AdapterEndpoint({
  name: 'blended',
  aliases: [],
  transport: blendedTransport,
  inputParameters,
  customInputValidation: (request): AdapterError | undefined => {
    const { overnight, extended } = request.requestContext.data
    if (Boolean(overnight) !== Boolean(extended)) {
      return new AdapterError({
        statusCode: 400,
        message:
          'overnight and extended must be provided together: a market has either open and closed feeds only, or all four session feeds',
      })
    }
    return
  },
})
