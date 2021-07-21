import { AdapterRequest, MakeWSHandler, Middleware } from '@chainlink/types'
import { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import { RootState } from './reducer'

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
  store.dispatch(connectRequested({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  if (!subscriptionMsg) return await execute(input, context)

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
  return await execute(input, context)
}
