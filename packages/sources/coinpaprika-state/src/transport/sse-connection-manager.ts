import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { Readable } from 'node:stream'
import { SSEParser } from './sse'

const logger = makeLogger('SSEConnectionManager')

export interface SSEConnectionCallbacks {
  onData: (eventType: string, data: string) => Promise<void>
  onError: (error: Error) => void
  onConnectionError: (status: number) => Promise<void>
  onReconnectNeeded: () => void
}

export interface SSEConnectionConfig {
  apiEndpoint: string
  apiKey: string
  requestTimeoutMs: number
}

export interface PairRequest {
  base: string
  quote: string
}

/**
 * SSE connection manager for Coinpaprika
 */
export class SSEConnectionManager {
  private isConnected = false
  private currentAbortController: AbortController | null = null
  private sseParser!: SSEParser
  private requester: Requester
  private defaultEventType: string

  constructor(requester: Requester, defaultEventType: string) {
    this.requester = requester
    this.defaultEventType = defaultEventType
  }

  get connected(): boolean {
    return this.isConnected
  }

  async connect(
    pairs: PairRequest[],
    config: SSEConnectionConfig,
    callbacks: SSEConnectionCallbacks,
  ): Promise<void> {
    if (this.isConnected) {
      logger.debug('Already connected, disconnecting first')
      await this.disconnect()
    }

    if (pairs.length === 0) {
      logger.debug('No pairs to stream')
      return
    }

    logger.debug(
      `Opening SSE connection for ${pairs.length} pairs: ${pairs
        .map((p) => `${p.base}/${p.quote}`)
        .join(', ')}`,
    )

    this.currentAbortController = new AbortController()

    try {
      const request = this.buildRequest(pairs, config, this.currentAbortController.signal)
      const key = `coinpaprika-state/stream:${pairs.map((p) => `${p.base}/${p.quote}`).join(',')}`
      const { response } = await this.requester.request<Readable>(key, request)

      if (response.status !== 200) {
        await callbacks.onConnectionError(response.status)
        this.disconnect()
        return
      }

      if (!response.data) {
        logger.error('No data in HTTP 200 response')
        await callbacks.onConnectionError(response.status)
        return
      }

      await this.setupStream(response.data as Readable, callbacks)
      this.isConnected = true
      logger.debug('SSE connection established')
    } catch (error) {
      this.cleanup()
      logger.error(`Failed to create SSE connection: ${error}`)
      callbacks.onError(error as Error)
    }
  }

  async disconnect(): Promise<void> {
    if (this.currentAbortController) {
      logger.debug('Closing SSE connection')
    }
    this.cleanup()
  }

  private cleanup(): void {
    this.currentAbortController?.abort()
    this.currentAbortController = null
    this.isConnected = false
    this.sseParser?.reset()
  }

  private buildRequest(
    pairs: PairRequest[],
    config: SSEConnectionConfig,
    signal: AbortSignal,
  ): {
    url: string
    method: string
    headers: Record<string, string>
    data: PairRequest[]
    responseType: 'stream'
    signal: AbortSignal
    timeout: number
    validateStatus: () => boolean
  } {
    return {
      url: `${config.apiEndpoint}/stream`,
      method: 'POST',
      headers: {
        Authorization: config.apiKey,
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
      },
      data: pairs,
      responseType: 'stream',
      signal,
      timeout: config.requestTimeoutMs,
      validateStatus: () => true,
    }
  }

  private async setupStream(stream: Readable, callbacks: SSEConnectionCallbacks): Promise<void> {
    let aborted = false
    this.sseParser = new SSEParser(this.defaultEventType, (eventType, data) => {
      callbacks.onData(eventType, data).catch((err) => {
        logger.error(`Error in SSE data callback: ${err}`)
        callbacks.onError(err)
      })
    })

    const onData = (chunk: Buffer) => {
      const raw = chunk.toString('utf8')
      logger.debug(`Raw SSE message received:\n${raw}`)
      this.sseParser.push(raw)
    }

    const onError = (err: Error) => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        aborted = true
      } else {
        logger.error(`Stream error: ${err}`)
        callbacks.onError(err)
      }
    }

    const onEnd = () => {
      stream.off('data', onData)
      stream.off('error', onError)
      this.cleanup()

      if (!aborted) {
        logger.info('SSE ended unexpectedly')
        callbacks.onReconnectNeeded()
      }
    }

    stream.on('data', onData)
    stream.once('error', onError)
    stream.once('end', onEnd)
  }
}
