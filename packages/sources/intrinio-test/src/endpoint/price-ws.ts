import { WebSocketTransport } from '@chainlink/external-adapter-framework/transports'
import { makeLogger, SingleNumberResultResponse } from '@chainlink/external-adapter-framework/util'
import { customSettings } from '../config'
import { IntrinioRealtime } from './util'

const logger = makeLogger('Intrinio Price Websocket')

export type IntrinioFeedMessage = {
  [x: string]: string
  // channel: string
  // clientId?: string
  // id: string
  // data: [string, [string, number, number, number, number, string, number, string, number, number]]
  // successful?: boolean
  // advice?: {
  //   interval: number
  //   timeout: number
  //   reconnect: string
  // }
}[]

export type EndpointTypes = {
  Request: {
    Params: { base: string }
  }
  Response: SingleNumberResultResponse
  CustomSettings: typeof customSettings
  Provider: {
    WsMessage: IntrinioFeedMessage
  }
}

let ws: IntrinioRealtime
export const wsTransport = new WebSocketTransport<EndpointTypes>({
  url: (context) => {
    const { API_KEY } = context.adapterConfig
    ws = new IntrinioRealtime({
      api_key: API_KEY,
      provider: 'iex',
    })
    return ws._makeSocketUrl as unknown as string | Promise<string>
  },
  handlers: {
    message: (message) => {
      console.log('message', message)
      return []
    },
  },
  builders: {
    subscribeMessage: (params) => {
      logger.trace(`suscribed`)
      console.log('subscribe', params)
      return params
    },
    unsubscribeMessage: (params) => {
      console.log('unsubscribe', params)
      return params
    },
  },
})
