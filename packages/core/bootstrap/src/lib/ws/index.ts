import { AdapterRequest, MakeWSHandler, Middleware, APIEndpoint } from '@chainlink/types'
import { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import { RootState } from './reducer'
import { normalizeInput } from '../external-adapter'

export * as actions from './actions'
export * as config from './config'
export * as epics from './epics'
export * as reducer from './reducer'
export * as types from './types'

export const withWebSockets = (
  store: Store<RootState>,
  makeWsHandler?: MakeWSHandler,
): Middleware => async (
  execute,
  endpointSelector?: (request: AdapterRequest) => APIEndpoint,
) => async (input: AdapterRequest) => {
  const wsConfig = getWSConfig()
  if (!makeWsHandler || !wsConfig.enabled) return await execute(input) // ignore middleware if conditions are met

  const wsHandler = await makeWsHandler()
  if (wsHandler.programmaticConnectionInfo) {
    const programmaticConnectionInfo = wsHandler.programmaticConnectionInfo(input)
    if (programmaticConnectionInfo) {
      wsConfig.connectionInfo.key = programmaticConnectionInfo.key
      wsHandler.connection.url = programmaticConnectionInfo.url
    }
  }

  store.dispatch(connectRequested({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  if (!subscriptionMsg) return await execute(input)

  const normalizedInput = endpointSelector ? normalizeInput(input, endpointSelector(input)) : input

  const subscriptionPayload: WSSubscriptionPayload = {
    connectionInfo: {
      key: wsConfig.connectionInfo.key,
      url: wsHandler.connection.url,
    },
    subscriptionMsg,
    input: normalizedInput,
  }

  store.dispatch(subscribeRequested(subscriptionPayload))
  return await execute(input)
}
