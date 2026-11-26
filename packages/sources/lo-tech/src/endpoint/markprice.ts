import { AdapterDependencies, AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import { InputParameters } from '@chainlink/external-adapter-framework/validation'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { config, getVenues } from '../config'
import { MarkPriceSocketTransport } from '../transport/markprice'

export const inputParameters = new InputParameters(
  {
    exchange: {
      description: 'The exchange to obtain the market price from',
      required: true,
      type: 'string',
    },
    base: {
      aliases: ['symbol'],
      description: 'The symbol of the base quote asset pair',
      required: true,
      type: 'string',
    },
  },
  [
    {
      exchange: 'binance',
      base: 'S|NVDA-USDT:PERP:LINEAR',
    },
  ],
)

export type BaseEndpointTypes = {
  Parameters: typeof inputParameters.definition
  Settings: typeof config.settings
  Response: {
    Result: null
    Data: {
      mid: number
      bid: number
      ask: number
    }
  }
}

class MarkPriceEndpoint extends AdapterEndpoint<BaseEndpointTypes> {
  async initialize(
    adapterName: string,
    dependencies: AdapterDependencies,
    adapterSettings: BaseEndpointTypes['Settings'],
  ): Promise<void> {
    getVenues(adapterSettings.PERPETUALS_VENUE).forEach((venue) => {
      this.transportRoutes.register(venue, new MarkPriceSocketTransport(venue))
    })
    await super.initialize(adapterName, dependencies, adapterSettings)
  }
}

// Currently only supports TOP_OF_BOOK
export const endpoint = new MarkPriceEndpoint({
  name: 'markprice',
  transportRoutes: new TransportRoutes<BaseEndpointTypes>(),
  customRouter: (req) => req.requestContext.data.exchange.toLowerCase(),
  inputParameters,
  customInputValidation: (_, settings): undefined => {
    if (!settings.FUTURES_API_KEY) {
      throw new AdapterError({
        statusCode: 500,
        message: 'FUTURES_API_KEY must be set in the environment to use the `markprice` endpoint',
      })
    }
    return
  },
  requestTransforms: [
    (req) => {
      req.requestContext.data.exchange = req.requestContext.data.exchange.toLowerCase()
      req.requestContext.data.base = req.requestContext.data.base.toUpperCase()
    },
  ],
})
