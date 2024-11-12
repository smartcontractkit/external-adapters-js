/** File mostly copied from Ogmios Typescript Client library with some updates to allow for specifying custom RPC URLs */

import WebSocket from 'ws'
import { URL } from 'url'
import {
  getServerHealth,
  ServerNotReady,
  Connection,
  ConnectionConfig,
  WebSocketErrorHandler,
  WebSocketCloseHandler,
  InteractionContext,
} from '@cardano-ogmios/client'

const createConnectionObject = (wsOgmiosURL: string, httpOgmiosURL: string): Connection => {
  const _128MB = 128 * 1024 * 1024
  const url = new URL(httpOgmiosURL)
  const base: Required<ConnectionConfig> = {
    host: url.host,
    port: parseInt(url.port),
    tls: url.protocol === 'https:',
    maxPayload: _128MB,
  }
  return {
    ...base,
    address: {
      http: httpOgmiosURL,
      webSocket: wsOgmiosURL,
    },
  }
}

export const createInteractionContext = async (
  errorHandler: WebSocketErrorHandler,
  closeHandler: WebSocketCloseHandler,
  wsOgmiosURL: string,
  httpOgmiosURL: string,
): Promise<InteractionContext> => {
  const connection = createConnectionObject(wsOgmiosURL, httpOgmiosURL)
  const health = await getServerHealth({ connection })
  return new Promise((resolve, reject) => {
    if (health.lastTipUpdate === null) {
      return reject(new ServerNotReady(health))
    }
    const socket = new WebSocket(connection.address.webSocket, {
      maxPayload: connection.maxPayload,
    })

    const afterEach = (cb: () => void) => {
      socket.once('close', cb)
      socket.close()
    }

    const onInitialError = (error: Error) => {
      socket.removeAllListeners()
      return reject(error)
    }
    socket.on('error', onInitialError)
    socket.once('close', (_code: number, reason: string) => {
      socket.removeAllListeners()
      reject(new Error(reason))
    })
    socket.on('open', async () => {
      socket.removeListener('error', onInitialError)
      socket.on('error', errorHandler)
      socket.on('close', closeHandler)
      resolve({
        connection,
        socket,
        afterEach,
      })
    })
  })
}
