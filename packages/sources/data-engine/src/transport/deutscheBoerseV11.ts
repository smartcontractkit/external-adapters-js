import { DecodedV11Report } from '@chainlink/data-streams-sdk'
import { BaseEndpointTypes } from '../endpoint/deutscheBoerseV11'
import { createDataEngineTransport, DECIMALS } from './wsTransportBase'

export const deutscheBoerseV11Transport = createDataEngineTransport<
  BaseEndpointTypes,
  DecodedV11Report
>({
  schemaVersion: 'V11',
  loggerName: 'deutscheBoerseV11Transport',
  extractData: (decoded) => {
    return {
      mid: decoded.mid.toString(),
      lastSeenTimestampNs: decoded.lastSeenTimestampNs.toString(),
      bid: decoded.bid.toString(),
      bidVolume: decoded.bidVolume,
      ask: decoded.ask.toString(),
      askVolume: decoded.askVolume,
      lastTradedPrice: decoded.lastTradedPrice.toString(),
      marketStatus: decoded.marketStatus,
      decimals: DECIMALS,
    }
  },
})
