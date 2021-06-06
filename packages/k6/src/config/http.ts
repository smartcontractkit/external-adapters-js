import { AdapterNames } from './'
import { Payload } from './types'

export const httpPayloadsByAdapter: Record<AdapterNames, Payload[]> = {
  nomics: [],
  cryptocompare: [],
  tiingo: [
    {
      name: 'BTC/USD-top',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "from": "BTC",\n  "to": "USD",\n "endpoint": "top"\n }\n}',
    },
    {
      name: 'AAPL',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "ticker": "aapl",\n "endpoint": "stock"\n }\n}',
    },
    {
      name: 'AAPL-eod',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "ticker": "aapl",\n "endpoint": "eod"\n }\n}',
    },
  ],
}
