import { AdapterRequest, MakeWSHandler, Middleware, AdapterContext, WSHandler } from '@chainlink/types'
import { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import { WSConfig } from './types'
import { RootState } from './reducer'
import { separateBatches } from './utils'

export * as actions from './actions'
export * as config from './config'
export * as epics from './epics'
export * as reducer from './reducer'
export * as types from './types'

export const withWebSockets = (
  store: Store<RootState>,
  makeWsHandler?: MakeWSHandler,
): Middleware => async (execute, context) => async (input: AdapterRequest) => {
  const wsConfig = getWSConfig()
  if (!makeWsHandler || !wsConfig.enabled) return await execute(input, context) // ignore middleware if conditions are met

  const wsHandler = await makeWsHandler()
  if (wsHandler.programmaticConnectionInfo) {
    const programmaticConnectionInfo = wsHandler.programmaticConnectionInfo(input)
    if (programmaticConnectionInfo) {
      wsConfig.connectionInfo.key = programmaticConnectionInfo.key
      wsHandler.connection.url = programmaticConnectionInfo.url
    }
  }
  
  store.dispatch(connectRequested({ config: wsConfig, wsHandler }))

  if (isBatchedRequest(input)) {
    await separateBatches(input, input, Object.keys(input.data), async (singleInput: AdapterRequest) => {
      await subscribeToWs(singleInput, store, context, wsHandler, wsConfig)
    })
  } else {
    await subscribeToWs(input, store, context, wsHandler, wsConfig)
  }
  return await execute(input, context)
}

const subscribeToWs = async (input: AdapterRequest, store: Store<RootState>, context: AdapterContext, wsHandler: WSHandler, wsConfig: WSConfig): Promise<void> => {
  const subscriptionMsg = wsHandler.subscribe(input)
  if (!subscriptionMsg) return
  const subscriptionPayload: WSSubscriptionPayload = {
    connectionInfo: {
      key: wsConfig.connectionInfo.key,
      url: wsHandler.connection.url,
    },
    subscriptionMsg,
    input,
    context,
  }

  store.dispatch(subscribeRequested(subscriptionPayload))
}

const isBatchedRequest = (input: AdapterRequest): boolean => {
  const data = input.data 
  for (const values of Object.values(data)) {
    if (Array.isArray(values)) {
      return true 
    }
  }
  return false 
}
