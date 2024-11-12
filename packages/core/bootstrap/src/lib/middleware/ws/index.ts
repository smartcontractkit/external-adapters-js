import type {
  AdapterContext,
  AdapterRequest,
  AdapterResponse,
  MakeWSHandler,
  Middleware,
} from '../../../types'
import type { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import type { RootState } from './reducer'
import { AdapterCache, buildDefaultLocalAdapterCache } from '../cache'
import { separateBatches } from './utils'
import { getEnv, logError } from '../../util'
import { AdapterTimeoutError } from '../../modules/error'

export * as actions from './actions'
export * as config from './config'
export * as epics from './epics'
export * as recorder from './recorder'
export * as reducer from './reducer'
export * as types from './types'

import { WARMUP_REQUEST_ID, WARMUP_BATCH_REQUEST_ID } from '../cache-warmer/config'
import { sleep } from '../../util'
import { getFeedId } from '../../metrics/util'

export const withWebSockets =
  <R extends AdapterRequest, C extends AdapterContext>(
    store: Store<RootState>,
    makeWsHandler?: MakeWSHandler,
  ): Middleware<R, C> =>
  async (execute, context) =>
  async (input) => {
    const wsConfig = getWSConfig(input.data.endpoint, context)
    if (!makeWsHandler || !wsConfig.enabled) return await execute(input, context) // ignore middleware if conditions are met
    if (input.id === WARMUP_REQUEST_ID || input.id === WARMUP_BATCH_REQUEST_ID)
      return await execute(input, context) // ignore middleware if warmer request

    const wsHandler = await makeWsHandler()
    if (wsHandler.shouldNotServeInputUsingWS && wsHandler.shouldNotServeInputUsingWS(input)) {
      return await execute(input, context)
    }
    if (wsHandler.programmaticConnectionInfo) {
      const programmaticConnectionInfo = wsHandler.programmaticConnectionInfo(input)
      if (programmaticConnectionInfo) {
        wsConfig.connectionInfo.key = programmaticConnectionInfo.key
        wsHandler.connection.url = programmaticConnectionInfo.url
      }
    }

    store.dispatch(connectRequested({ config: wsConfig, wsHandler, context, request: input }))

    if (isConnected(store, wsConfig.connectionInfo.key)) {
      await separateBatches(input, async (singleInput: AdapterRequest) => {
        const subscriptionMsg = wsHandler.subscribe(singleInput)
        if (!subscriptionMsg) return
        const subscriptionPayload: WSSubscriptionPayload = {
          connectionInfo: {
            key: wsConfig.connectionInfo.key,
            url: wsHandler.connection.url,
          },
          subscriptionMsg,
          input: singleInput,
          context,
        }

        store.dispatch(subscribeRequested(subscriptionPayload))
      })
    }

    // Check if adapter only supports WS
    if (wsHandler.noHttp) {
      // If so, we try to get a result from cache within API_TIMEOUT
      const requestTimeout = Number(getEnv('API_TIMEOUT', undefined, context))
      const deadline = Date.now() + requestTimeout
      return await awaitResult(context, input, deadline)
    }
    return await execute(input, context)
  }

const isConnected = (store: Store<RootState>, connectionKey: string): boolean => {
  const state = store.getState()
  const connectionState = state.connections.all[connectionKey]
  if (!connectionState) {
    return false
  }
  const isActiveConnection = connectionState.active
  const isConnecting = connectionState.connecting > 1
  const hasOnConnectChainCompleted = connectionState.isOnConnectChainComplete
  return isActiveConnection && !isConnecting && hasOnConnectChainCompleted
}

const awaitResult = async (
  context: AdapterContext,
  input: AdapterRequest,
  deadline: number,
): Promise<AdapterResponse> => {
  const adapterCache = new AdapterCache(context)
  const pollInterval = 1_000

  while (Date.now() < deadline - pollInterval) {
    try {
      const cachedAdapterResponse = await adapterCache.getResultForRequest(input)
      if (cachedAdapterResponse) return cachedAdapterResponse
    } catch (error) {
      const localAdapterCache = await buildDefaultLocalAdapterCache(context)
      const cachedAdapterResponse = await localAdapterCache.getResultForRequest(input)
      if (cachedAdapterResponse) return cachedAdapterResponse
    }
    await sleep(pollInterval)
  }

  throw logError(
    new AdapterTimeoutError({
      jobRunID: input.id,
      feedID: getFeedId(input),
      statusCode: 500,
      message: 'WS Data Provider has not provided value yet. Retry the request after some time',
    }),
  )
}
