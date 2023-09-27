import { makeLogger } from '@chainlink/external-adapter-framework/util'

const logger = makeLogger('BlocksizeCapitalTransportUtils')

export interface BaseMessage {
  jsonrpc: string
  id?: string | number | null
  method: string
}

// use as open handler for standard WS connections
export const blocksizeDefaultWebsocketOpenHandler = (
  connection: WebSocket,
  apiKey: string,
): Promise<void> | void => {
  return new Promise((resolve, reject) => {
    connection.addEventListener('message', (event: MessageEvent<BaseMessage>) => {
      const parsed = JSON.parse(event.data.toString())
      if (parsed.result?.user_id) {
        logger.debug('Got logged in response, connection is ready')
        resolve()
      } else {
        reject(new Error('Failed to make WS connection'))
      }
    })
    const options = {
      jsonrpc: '2.0',
      method: 'authentication_logon',
      params: { api_key: apiKey },
    }
    connection.send(JSON.stringify(options))
  })
}
