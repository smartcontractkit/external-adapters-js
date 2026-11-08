import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { stockEndpointInputParametersDefinition } from '@chainlink/external-adapter-framework/adapter/stock'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'
import overrides from '../config/overrides.json'
import { fxWsTransport } from '../transport/stock_quotes-fx-ws'
import { wsTransport } from '../transport/stock_quotes-ws'
import { tiingoCommonSubscriptionRequestTransform } from './utils'

const inputParameters = new InputParameters(
  {
    ...stockEndpointInputParametersDefinition,
    assetType: {
      type: 'string',
      description:
        'Asset type of the base. "indices" is served from the Tiingo FX feed (e.g. us30usd); any other value uses the equities feed.',
    },
  },
  [
    {
      base: 'aapl',
    },
    {
      base: 'us30usd',
      assetType: 'indices',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid_price: number
      bid_price: number
      bid_volume: number
      ask_price: number
      ask_volume: number
    }
  }
}

const EQUITIES_TRANSPORT = 'ws'
const FX_TRANSPORT = 'fx'
const INDICES_ASSET_TYPE = 'indices'

export const endpoint = new AdapterEndpoint({
  name: 'stock_quotes',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register(EQUITIES_TRANSPORT, wsTransport)
    .register(FX_TRANSPORT, fxWsTransport),
  defaultTransport: EQUITIES_TRANSPORT,
  customRouter: (req) =>
    req.requestContext.data.assetType?.toLowerCase() === INDICES_ASSET_TYPE
      ? FX_TRANSPORT
      : EQUITIES_TRANSPORT,
  inputParameters: inputParameters,
  overrides: overrides.tiingo,
  requestTransforms: [
    tiingoCommonSubscriptionRequestTransform(),
    // assetType only picks the transport. Drop it afterwards so it doesn't leak into the cache key:
    // the transports write responses keyed by base alone, and callers already send other values
    // (e.g. assetType: etfs) that must keep resolving on the equities feed.
    (req) => {
      delete req.requestContext.data.assetType
    },
  ],
  customInputValidation: (req, settings): undefined => {
    // Indices are served from the FX feed with API_KEY, so only the equities feed needs EQUITIES_API_KEY
    if (req.requestContext.transportName !== FX_TRANSPORT && !settings.EQUITIES_API_KEY) {
      throw new AdapterError({
        statusCode: 500,
        message:
          'EQUITIES_API_KEY is required for stock_quotes endpoint. Please set it in the environment variables.',
      })
    }
    return
  },
})
