import { AdapterRequest, Middleware, WSSubscriptionHandler } from '@chainlink/types'
import { Store } from 'redux'
import { RootState } from './reducer'
import { getWSConfig } from './config'
import { connect, subscribe, heartbeat } from './actions'

export * as types from './types'
export * as config from './config'
export * as actions from './actions'
export * as reducer from './reducer'
export * as epics from './epics'

export const withWebSockets = (store: Store<RootState>) => (wsHandler?: WSSubscriptionHandler): Middleware => async (execute) => async (
  input: AdapterRequest,
) => {
  if (!wsHandler) return await execute(input)
  // TODO: Warmer
  const wsConfig = getWSConfig()
  store.dispatch(connect({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  const { connectionInfo } = wsConfig

  // Helper function to build actions
  const _wsSubscriptionPayload = (message: any) => ({
    connectionInfo: {
      key: connectionInfo.key,
      url: wsHandler.connection.url
    },
    subscriptionMsg,
    message,
    input,
  })

  store.dispatch(subscribe(_wsSubscriptionPayload(subscriptionMsg)))
  store.dispatch(heartbeat(_wsSubscriptionPayload(subscriptionMsg)))

  return await execute(input)
}
