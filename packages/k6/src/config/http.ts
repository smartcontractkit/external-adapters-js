import { Payload } from './types'

export const httpPayloadsByAdapter: Record<string, Payload[]> = {
  amberdata: [
    {
      name: 'BTC-marketcap',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "base": "BTC",\n  "endpoint": "marketcap"\n }\n}',
    },
    {
      name: 'DOGE-marketcap',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "base": "DOGE",\n  "endpoint": "marketcap"\n }\n}',
    },
    {
      name: 'balances1',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "result": [{"address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"},{"address": "bc1qh4cpaydaqlzez8ekkasm3ygj4us7gwxsghh047"}],\n  "endpoint": "balance"\n }\n}',
    },
    {
      name: 'balances2',
      id: '86f45dcc-90db-4c39-b385-53945c5a9a30',
      method: 'POST',
      data: '{\n "data": {\n  "result": [{"address": "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo"},{"address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF"}],\n  "endpoint": "balance"\n }\n}',
    },
  ],
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
