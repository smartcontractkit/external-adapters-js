import {
  buildDxFeedHttpTransport,
  buildDxFeedWsTransport,
  customInputValidation,
  BaseEndpointTypes,
  inputParameters,
} from '@chainlink/dxfeed-adapter'
import { AdapterEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { TransportRoutes } from '@chainlink/external-adapter-framework/transports'
import overrides from '../config/overrides.json'

export const endpoint = new AdapterEndpoint({
  name: 'price',
  aliases: ['crypto', 'stock', 'forex', 'commodities'],
  transportRoutes: new TransportRoutes<BaseEndpointTypes>()
    .register('ws', buildDxFeedWsTransport())
    .register('rest', buildDxFeedHttpTransport()),
  defaultTransport: 'rest',
  inputParameters,
  customInputValidation,
  overrides: overrides['dxfeed-secondary'],
  requestTransforms: [
    (req) => {
      const { base } = req.requestContext.data
      const rawRequestData = req.body.data
      // If `base` is not overriden, append ':BFX' suffix to `base`
      const baseAliases = ['base', ...inputParameters.definition.base.aliases]
      if (baseAliases.some((alias) => base === rawRequestData[alias])) {
        req.requestContext.data.base = `${req.requestContext.data.base}:BFX`
      }
    },
  ],
})
