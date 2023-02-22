import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { PriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import { BatchEndpointTypes, BatchRequestParams } from '../price-utils'
import { httpTransport, inputParameters } from './forex'
import { wsTransport } from './forex-ws'
import { AdapterConfig } from '@chainlink/external-adapter-framework/config'
import { customSettings } from '../config'
import {
  AdapterError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'

const transports = {
  ws: wsTransport,
  rest: httpTransport,
}

function customInputValidation(
  params: BatchRequestParams,
  config: AdapterConfig<typeof customSettings>,
): AdapterError | undefined {
  if (params.transport === 'ws' && !config.WS_API_KEY) {
    return new AdapterInputError({
      statusCode: 400,
      message: 'WS_API_KEY is not set',
    })
  }
  return
}

export const routingTransport = new RoutingTransport<BatchEndpointTypes>(transports, {
  defaultTransport: 'rest',
})

export const endpoint = new PriceEndpoint<BatchEndpointTypes>({
  name: 'forex',
  aliases: ['batch'],
  transport: routingTransport,
  inputParameters: inputParameters,
  customInputValidation,
})
