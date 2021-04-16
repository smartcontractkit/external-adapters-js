import { AdapterRequest, Middleware, WSSubscriptionHandler } from '@chainlink/types'
import { Store } from 'redux'
import { RootState } from './reducer'
import { envLoad_WSConfig } from './config'
import * as actions from './actions'

export * as types from './types'
export * as config from './config'
export * as actions from './actions'
export * as reducer from './reducer'
export * as epics from './epics'

// TODO: WebSockets
export const withWebSockets = (store: Store<RootState>) => (wsHandler?: WSSubscriptionHandler): Middleware => async (execute) => async (
  input: AdapterRequest,
) => {
  if (!wsHandler) return await execute(input)
  // TODO: Warmer
  const { connect, subscribe } = actions

  const wsConfig = envLoad_WSConfig()
  store.dispatch(connect({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  const { connectionInfo } = wsConfig

  // Helper function to build actions
  const _wsSubscriptionPayload = (message: any) => ({
    connectionInfo,
    subscriptionMsg,
    message,
    input,
  })

  store.dispatch(subscribe(_wsSubscriptionPayload(subscriptionMsg)))

  return await execute(input)
}
