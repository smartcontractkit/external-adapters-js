import { wsTransport } from './crypto-ws'
import { defaultEndpoint } from '../config'
import { BatchEndpointTypes, cryptoInputParams } from '../crypto-utils'
import { httpTransport } from './crypto'
import { CryptoPriceEndpoint } from '@chainlink/external-adapter-framework/adapter'
import overrides from '../config/overrides.json'

export const endpoint = new CryptoPriceEndpoint<BatchEndpointTypes>({
  name: defaultEndpoint,
  transports: {
    ws: wsTransport,
    rest: httpTransport,
  },
  defaultTransport: 'rest',
  inputParameters: cryptoInputParams,
  overrides: overrides.cryptocompare,
})
