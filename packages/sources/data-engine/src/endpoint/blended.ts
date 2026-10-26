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
    indicator: {
      required: false,
      description:
        'The indicator applied on top of the stitched price. Omit to use the Data Engine default (`twap`)',
      type: {
        type: {
          required: true,
          type: 'string',
          options: ['twap', 'none'],
          description: 'The indicator type',
        },
        windowSeconds: {
          required: false,
          type: 'number',
          description: 'The indicator window in seconds',
        },
        endTs: {
          required: false,
          type: 'number',
          description: 'The indicator window end as a unix timestamp in seconds',
        },
      },
    },
    stitching: {
      required: false,
      description:
        'The stitching applied across session feeds. Omit to use the Data Engine default (`kalman`)',
      type: {
        mode: {
          required: true,
          type: 'string',
          options: ['kalman', 'adaptive'],
          description: 'The stitching mode',
        },
        params: {
          required: false,
          description: 'Stitching parameters. Omitted params use the Data Engine defaults',
          type: {
            closeWindowSeconds: {
              required: false,
              type: 'number',
              description: 'Seconds before a session close in which the anchor is captured',
            },
            openWindowSeconds: {
              required: false,
              type: 'number',
              description: 'Seconds after a session open in which the anchor is applied',
            },
            blendSeconds: {
              required: false,
              type: 'number',
              description:
                'Duration in seconds of the blend from the anchor to the new session price',
            },
            sigmoidSteepness: {
              required: false,
              type: 'number',
              description: 'Steepness of the sigmoid blend curve',
            },
            maxAnchorAgeSeconds: {
              required: false,
              type: 'number',
              description: 'Maximum age in seconds of an anchor before it is discarded',
            },
            emaHalfLifeSeconds: {
              required: false,
              type: 'number',
              description:
                'Half-life in seconds of the overnight session EMA smoother. Only for the `adaptive` mode',
            },
          },
        },
      },
    },
    resultPath: {
      required: false,
      default: 'indicatorPrice',
      type: 'string',
      description: 'The data field to populate the top-level result',
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
    {
      market: 'nyse',
      open: '0x000b355642ce85f1a35c19651d86e0f62b9d80469b4b076032250b838aa1a291',
      closed: '0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116',
      overnight: '0x000bccf7f0cabd7a4c9d1936188c9d3cb879d5e5ef35324125e32d11a2cbd116',
      extended: '0x000bbb370f42279bdf6ef55c21b05e319d7e9ca316369c44387a8b5cf17bab3c',
      indicator: { type: 'none' },
      stitching: {
        mode: 'adaptive',
        params: {
          closeWindowSeconds: 10,
          openWindowSeconds: 10,
          blendSeconds: 30,
          sigmoidSteepness: 10,
          maxAnchorAgeSeconds: 600,
          emaHalfLifeSeconds: 57.53,
        },
      },
      resultPath: 'stitchedMid',
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
  // A string session name on older Data Engine builds, a 0-5 session enum since adaptive stitching
  session: string | number
  // Stitched and raw quote fields, absent on Data Engine builds before adaptive stitching
  stitchedBid?: string
  stitchedAsk?: string
  stitchedMid?: string
  rawBid?: string
  rawAsk?: string
  rawMid?: string
}

/**
 * The `underlying` group of the blended provider response: the underlying feed's pass-through
 * fields, flattened into the adapter response data. Volumes are integer strings scaled by
 * `decimals`. `lastSeenTimestampNs` is exposed as a string since nanosecond timestamps exceed
 * Number.MAX_SAFE_INTEGER.
 */
export type BlendedUnderlying = {
  bidVolume: string
  askVolume: string
  lastSeenTimestampNs: string
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
    Data: BlendedData & BlendedTimestamps & Partial<BlendedUnderlying> & BlendedMetadata
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
