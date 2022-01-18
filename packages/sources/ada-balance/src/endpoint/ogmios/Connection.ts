/** File mostly copied from Ogmios Typescript Client library with some updates to allow for specifying custom RPC URLs */

import { getServerHealth } from './ServerHealth'
import { ServerNotReady } from './errors'
import WebSocket from 'ws'
import { URL } from 'url'

export interface ConnectionConfig {
  host?: string
  port?: number
  tls?: boolean
  maxPayload?: number
}

export interface Connection extends Required<ConnectionConfig> {
  maxPayload: number
  address: {
    http: string
    webSocket: string
  }
}

/**
 * An interaction context used by Ouroboros clients to interact with the server.
 *
 * @category Connection
 */
export interface InteractionContext {
  connection: Connection
  socket: WebSocket
  afterEach: (cb: () => void) => void
}

export type InteractionType = 'LongRunning' | 'OneTime'

/** @category Connection */
export type WebSocketErrorHandler = (error: Error) => void

interface CloseEvent {
  wasClean: boolean
  code: number
  reason: string
  type: string
  target: WebSocket
}

/** @category Connection */
export type WebSocketCloseHandler = (code: CloseEvent['code'], reason: CloseEvent['reason']) => void

/** @category Constructor */
export const createConnectionObject = (wsOgmiosURL: string, httpOgmiosURL: string): Connection => {
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

/** @category Constructor */
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

    const closeOnCompletion = 'OneTime'
    const afterEach = (cb: () => void) => {
      if (closeOnCompletion) {
        socket.once('close', cb)
        socket.close()
      } else {
        cb()
      }
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
