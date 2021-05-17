import { AdapterRequest, Middleware, MakeWSHandler } from '@chainlink/types'
import { Store } from 'redux'
import { RootState } from './reducer'
import { getWSConfig } from './config'
import { connect, subscribe } from './actions'

export * as types from './types'
export * as config from './config'
export * as actions from './actions'
export * as reducer from './reducer'
export * as epics from './epics'

export const withWebSockets = (
  store: Store<RootState>,
  makeWsHandler?: MakeWSHandler,
): Middleware => async (execute) => async (input: AdapterRequest) => {
  const wsConfig = getWSConfig()
  if (!makeWsHandler || !wsConfig.enabled) return await execute(input) // ignore middleware if conditions are met

  const wsHandler = await makeWsHandler()
  store.dispatch(connect({ config: wsConfig, wsHandler }))

  const subscriptionMsg = wsHandler.subscribe(input)
  if (!subscriptionMsg) return await execute(input)
  const { connectionInfo } = wsConfig

  const subscriptionPayload = {
    connectionInfo: {
      key: connectionInfo.key,
      url: wsHandler.connection.url,
    },
    subscriptionMsg,
    input,
  }

  store.dispatch(subscribe(subscriptionPayload))
  return await execute(input)
}
