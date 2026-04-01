import { DecodedV7Report } from '@chainlink/data-streams-sdk'
import { BaseEndpointTypes } from '../endpoint/exchangeRateV7'
import { DECIMALS } from './utils'
import { createDataEngineTransport } from './wsTransportBase'

export const exchangeRateV7Transport = createDataEngineTransport<
  BaseEndpointTypes,
  DecodedV7Report
>({
  schemaVersion: 'V7',
  loggerName: 'exchangeRateV7Transport',
  extractData: (decoded) => {
    return {
      exchangeRate: decoded.exchangeRate.toString(),
      decimals: DECIMALS,
    }
  },
})
