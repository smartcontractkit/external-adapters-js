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
  },
  [
    {
      market: 'nyse',
      open: '0x0003c16c6aed42294f5cb4741f6e59ba2d728f0eae2eb9e6d3f555808c59fc45',
      closed: '0x0003ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655443322',
      overnight: '0x00031122334455667788990011223344556677889900112233445566778899aa',
      extended: '0x0003a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Response: {
    Result: string
    Data: {
      rawStitchedPrice: string
      rawPrice: string
      indicatorPrice: string
      decimals: number
      indicatorType: string
      stitchingType: string
      market: string
      session: string
      evaluatedAtTs: number
      observationsTimestamp: number
      windowStartTs: number
      windowEndTs: number
      feedsUsed: string[]
      stitchingApplied: boolean
      anchor: { price: string; ts: number; ageSeconds: number } | null
      stitchingMode: string
      stitchingParams: Record<string, unknown>
      stitchingPhase: string
      indicatorWindowSeconds: number
      indicatorEndTs: number
    }
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
    if ((overnight || extended) && !(overnight && extended)) {
      return new AdapterError({
        statusCode: 400,
        message:
          'overnight and extended must be provided together: a market has either open and closed feeds only, or all four session feeds',
      })
    }
    return
  },
})
