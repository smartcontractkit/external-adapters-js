import { AdapterRequest, MakeWSHandler, Middleware, AdapterContext, WSHandler } from '@chainlink/types'
import { Store } from 'redux'
import { connectRequested, subscribeRequested, WSSubscriptionPayload } from './actions'
import { getWSConfig } from './config'
import { WSConfig } from './types'
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
  if (wsHandler.programmaticConnectionInfo) {
    const programmaticConnectionInfo = wsHandler.programmaticConnectionInfo(input)
    if (programmaticConnectionInfo) {
      wsConfig.connectionInfo.key = programmaticConnectionInfo.key
      wsHandler.connection.url = programmaticConnectionInfo.url
    }
  }
  
  store.dispatch(connectRequested({ config: wsConfig, wsHandler }))

  if (isBatchedRequest(input)) {
    await batchSubscribeToWs(input, input, store, context, wsHandler, wsConfig, Object.keys(input.data))
  } else {
    const subscriptionMsg = wsHandler.subscribe(input)
    if (!subscriptionMsg) return await execute(input, context)
    await subscribeToWs(input, store, context, wsHandler, wsConfig)
  }
  return await execute(input, context)
}

const batchSubscribeToWs = async (
  curr: AdapterRequest,
  input: AdapterRequest, 
  store: Store<RootState>, 
  context: AdapterContext, 
  wsHandler: WSHandler, 
  wsConfig: WSConfig, 
  dataFields: string[]
) => {
  if (dataFields.length === 0) {
    await subscribeToWs(curr, store, context, wsHandler, wsConfig)
  } else {
    let dataValues = input.data[dataFields[0]]
    if (dataValues) {
      dataValues = Array.isArray(dataValues) ? dataValues : [dataValues]
      for (const val of dataValues) {
        let updatedCurr = JSON.parse(JSON.stringify(curr))
        updatedCurr = {
          ...curr,
          data: {
            ...curr.data,
            [dataFields[0]]: val
          }
        }
        await batchSubscribeToWs(updatedCurr, input, store, context, wsHandler, wsConfig, dataFields.slice(1))
      }
    }
  }
}

const subscribeToWs = async (input: AdapterRequest, store: Store<RootState>, context: AdapterContext, wsHandler: WSHandler, wsConfig: WSConfig) => {
  const subscriptionMsg = wsHandler.subscribe(input)

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
