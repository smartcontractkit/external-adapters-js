import { DecodedV8Report } from '@chainlink/data-streams-sdk'
import { BaseEndpointTypes } from '../endpoint/rwaV8'
import { createDataEngineTransport, DECIMALS } from './wsTransportBase'

export const rwaV8Transport = createDataEngineTransport<BaseEndpointTypes, DecodedV8Report>({
  schemaVersion: 'V8',
  loggerName: 'rwaV8Transport',
  extractData: (decoded) => {
    return {
      midPrice: decoded.midPrice.toString(),
      marketStatus: decoded.marketStatus,
      decimals: DECIMALS,
    }
  },
})
