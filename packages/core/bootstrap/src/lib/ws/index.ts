import { AdapterContext, AdapterRequest, MakeWSHandler, Middleware } from '@chainlink/types'
import { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import { RootState } from './reducer'
import { AdapterCache } from '../cache'

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

  // Check if adapter only supports WS
  if (wsHandler.noHttp) {
    // If so, we try to get a result from cache within API_TIMEOUT
    const requestTimeout = Number(process.env.API_TIMEOUT) || 30000
    const deadline = Date.now() + requestTimeout
    return await awaitResult(context, input, deadline)
  }

  return await execute(input, context)
}

const awaitResult = async (context: AdapterContext, input: AdapterRequest, deadline: number) => {
  const adapterCache = new AdapterCache(context)
  const pollInterval = 1_000

  while (Date.now() < deadline - pollInterval) {
    const cachedAdapterResponse = await adapterCache.getResultForRequest(input)
    if (cachedAdapterResponse) return cachedAdapterResponse
    await sleep(pollInterval)
  }

  throw Error('timed out waiting for result to be cached')
}

const sleep = async (time: number): Promise<void> => {
  return new Promise((resolve => setTimeout(resolve, time)))
}
