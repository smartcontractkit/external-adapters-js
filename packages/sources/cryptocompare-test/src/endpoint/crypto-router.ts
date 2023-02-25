import { wsTransport } from './crypto-ws'
import { defaultEndpoint } from '../config'
import { BatchEndpointTypes, cryptoInputParams } from '../crypto-utils'
import { httpTransport } from './crypto'
import { RoutingTransport } from '@chainlink/external-adapter-framework/transports/meta'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'

const transports = {
  ws: wsTransport,
  rest: httpTransport,
}

export const routingTransport = new RoutingTransport<BatchEndpointTypes>(transports)

export const endpoint = new CryptoPriceEndpoint<BatchEndpointTypes>({
  name: defaultEndpoint,
  transport: routingTransport,
  inputParameters: cryptoInputParams,
})
