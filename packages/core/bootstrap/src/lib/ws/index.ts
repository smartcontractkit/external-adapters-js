import { AdapterRequest, Middleware, MakeWSHandler } from '@chainlink/types'
import { Store } from 'redux'
import { RootState } from './reducer'
import { getWSConfig } from './config'
import { connect, subscribe, heartbeat } from './actions'

export * as types from './types'
export * as config from './config'
export * as actions from './actions'
export * as reducer from './reducer'
export * as epics from './epics'

export const withWebSockets = (store: Store<RootState>, makeWsHandler?: MakeWSHandler): Middleware => async (execute) => async (
  input: AdapterRequest,
) => {
  if (!makeWsHandler) return await execute(input)
  // TODO: Warmer
  const wsHandler = makeWsHandler()
  const wsConfig = getWSConfig()
  if (wsHandler.init !== undefined) {
    await wsHandler.init(wsHandler)
  }
  store.dispatch(connect({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  if (!subscriptionMsg) return await execute(input)
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
