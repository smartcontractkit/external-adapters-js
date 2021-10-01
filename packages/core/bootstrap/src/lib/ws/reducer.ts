import { AdapterContext, AdapterRequest } from '@chainlink/types'
import { combineReducers, createReducer, isAnyOf } from '@reduxjs/toolkit'
import { getHashOpts, hash } from '../util'
import * as actions from './actions'

/**
 * Generate a key for the WS middleware
 *
 * NOTE:
 * Exclude mode is enforced because the data given to the WS framework
 * is not an Adapter Request, but a subscription message.
 *
 * (e.g. Cryptocompare)
 * { action: 'SubAdd', subs: [ '5~CCCAGG~BTC~USD' ] }
 *
 * The structure of which may change with every adapter, so we need to
 * use exclude mode to handle dynamically changing properties.
 */
export const getSubsId = (subscriptionMsg: AdapterRequest): string =>
  hash(subscriptionMsg, getHashOpts(), 'exclude')

export interface ConnectionsState {
  total: number
  all: {
    [key: string]: {
      shouldNotRetryConnecting?: boolean
      active: boolean
      connecting: number
      wasEverConnected?: boolean
      connectionParams?: {
        [T: string]: string
      }
      requestId: number
    }
  }
}

const initConnectionsState: ConnectionsState = { total: 0, all: {} }

export const connectionsReducer = createReducer<ConnectionsState>(
  initConnectionsState,
  (builder) => {
    builder.addCase(actions.saveOnConnectMessage, (state, action) => {
      const { connectionKey, message } = action.payload
      state.all[connectionKey] = {
        ...state.all[connectionKey],
        connectionParams: message,
      }
    })
    builder.addCase(actions.connectFulfilled, (state, action) => {
      // Add connection
      const { key } = action.payload.config.connectionInfo
      state.all[key] = {
        ...state.all[key],
        active: true,
        connecting: 0,
        wasEverConnected: true,
        requestId: Math.max(state.all[key].requestId, 0),
      }
    })
    builder.addCase(actions.subscribeRequested, (state, action) => {
      const key = action.payload.connectionInfo.key
      if (!state.all[key]) return
      state.all[key] = {
        ...state.all[key],
        requestId: state.all[key].requestId + 1,
      }
    })
    builder.addCase(actions.connectRequested, (state, action) => {
      const { key } = action.payload.config.connectionInfo
      const isActive = state.all[key]?.active
      if (isActive) return

      const isConnecting = !isNaN(Number(state.all[key]?.connecting))
      state.all[key] = {
        ...state.all[key],
        active: false,
        connecting: isConnecting ? state.all[key].connecting + 1 : 1,
        requestId: 0,
      }
    })

    builder.addCase(actions.connectFailed, (state, action) => {
      state.all[action.payload.connectionInfo.key].connecting = 0
      state.all[action.payload.connectionInfo.key].active = false
    })

    builder.addCase(actions.disconnectFulfilled, (state, action) => {
      // Remove connection
      const { key } = action.payload.config.connectionInfo
      state.all[key].active = false
      state.all[key].connecting = 0 // turn off connecting
      state.all[key].shouldNotRetryConnecting = action.payload.shouldNotRetryConnecting
    })

    builder.addMatcher(
      isAnyOf(
        actions.connectRequested,
        actions.connectFulfilled,
        actions.connectFailed,
        actions.disconnectFulfilled,
      ),
      (state) => {
        state.total = Object.values(state.all).filter((s) => s?.active).length
      },
    )
  },
)

export interface SubscriptionsState {
  /** Map of all subscriptions by key */
  total: number
  all: {
    [key: string]: {
      active: boolean
      wasEverActive?: boolean
      unsubscribed?: boolean
      subscribing: number
      input: AdapterRequest
      context: AdapterContext
      subscriptionParams?: any
      connectionKey: string
    }
  }
}

const initSubscriptionsState: SubscriptionsState = { total: 0, all: {} }

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  (builder) => {
    builder.addCase(actions.updateSubscriptionInput, (state, action) => {
      const key = action.payload.subscriptionKey
      state.all[key] = {
        ...state.all[key],
        input: action.payload.input,
      }
    })
    builder.addCase(actions.saveFirstMessageReceived, (state, action) => {
      const key = action.payload.subscriptionKey
      state.all[key] = {
        ...state.all[key],
        subscriptionParams: action.payload.message,
      }
    })
    builder.addCase(actions.subscribeFulfilled, (state, action) => {
      // Add subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      state.all[key] = {
        active: true,
        wasEverActive: true,
        unsubscribed: false,
        subscribing: 0,
        input: { ...action.payload.input },
        context: action.payload.context,
        connectionKey: action.payload.connectionInfo.key,
      }
    })

    builder.addCase(actions.subscribeRequested, (state, action) => {
      const key = getSubsId(action.payload.subscriptionMsg)
      const isActive = state.all[key]?.active
      if (isActive) return

      const isSubscribing = state.all[key]?.subscribing
      state.all[key] = {
        active: false,
        subscribing: isSubscribing ? state.all[key].subscribing + 1 : 1,
        input: { ...action.payload.input },
        context: action.payload.context,
        connectionKey: action.payload.connectionInfo.key,
      }
    })

    builder.addCase(actions.unsubscribeFulfilled, (state, action) => {
      // Remove subscription
      const key = getSubsId(action.payload.subscriptionMsg)

      state.all[key].active = false
      state.all[key].unsubscribed = true
    })

    builder.addCase(actions.disconnectFulfilled, (state) => {
      state.all = {}
      return state
    })

    builder.addMatcher(
      isAnyOf(actions.subscribeRequested, actions.subscribeFulfilled, actions.unsubscribeFulfilled),
      (state) => {
        state.total = Object.values(state.all).filter((s) => s?.active).length
      },
    )
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
