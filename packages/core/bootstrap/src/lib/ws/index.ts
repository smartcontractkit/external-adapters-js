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
  // const { connect, subscribe, unsubscribe, disconnect } = actions
  const { connect, subscribe } = actions

  const product_id = `${input.data.from}-${input.data.to}`
  // const product_ids = [product_id]
  const wsConfig = envLoad_WSConfig()
  store.dispatch(connect({ config: wsConfig, wsHandler }))

  const subscribeMsg = wsHandler.subscribe(input)
  const subscriptionInfo = { key: product_id }
  const { connectionInfo } = wsConfig

  // Helper function to build actions
  const _wsSubscriptionPayload = (message: any) => ({
    connectionInfo,
    subscriptionInfo,
    message,
    input,
  })

  store.dispatch(subscribe(_wsSubscriptionPayload(subscribeMsg)))

  // TODO: Uncomment
  // const unsubscribeMsg = { type: 'unsubscribe', channels: [{ name: 'ticker', product_ids }] }
  // setTimeout(() => store.dispatch(unsubscribe(_wsSubscriptionPayload(unsubscribeMsg))), 5000)
  // setTimeout(() => store.dispatch(disconnect({ connectionInfo })), 7000)

  return await execute(input)
}
