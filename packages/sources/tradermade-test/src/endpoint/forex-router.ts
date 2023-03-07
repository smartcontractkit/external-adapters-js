import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchEndpointTypes } from '../price-utils'
import { httpTransport, inputParameters } from './forex'
import { wsTransport } from './forex-ws'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '../config'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { AdapterRequest } from '@chainlink/external-adapter-framework/util'
import overrides from '../config/overrides.json'

function customInputValidation(
  req: AdapterRequest<BatchEndpointTypes['Request']>,
  config: AdapterConfig<typeof customSettings>,
): AdapterError | undefined {
  if (req.requestContext.transportName === 'ws' && !config.WS_API_KEY) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_KEY is not set',
    })
  }
  return
}

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'forex',
  aliases: ['batch'],
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: inputParameters,
  customInputValidation,
  overrides: overrides.tradermade,
})
