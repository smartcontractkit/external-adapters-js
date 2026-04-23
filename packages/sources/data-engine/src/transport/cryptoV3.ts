import { DecodedV3Report } from '@chainlink/data-streams-sdk'
import { BaseEndpointTypes } from '../endpoint/cryptoV3'
import { DECIMALS } from './utils'
import { createDataEngineTransport } from './wsTransportBase'

export const cryptoV3Transport = createDataEngineTransport<BaseEndpointTypes, DecodedV3Report>({
  schemaVersion: 'V3',
  loggerName: 'cryptoV3Transport',
  extractData: (decoded) => {
    return {
      bid: decoded.bid.toString(),
      ask: decoded.ask.toString(),
      price: decoded.price.toString(),
      decimals: DECIMALS,
    }
  },
})
