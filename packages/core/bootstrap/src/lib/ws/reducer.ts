import hash from 'object-hash'
import { AdapterRequest } from '@chainlink/types'
import { combineReducers, createReducer, isAnyOf } from '@reduxjs/toolkit'
import * as actions from './actions'
import { getHashOpts } from '../util'

export const getSubsId = (subscriptionMsg = {}): string => hash(subscriptionMsg, getHashOpts())
export interface ConnectionsState {
  total: number
  all: {
    [key: string]: {
      active: boolean
      connecting: number
      wasEverConnected?: boolean
    }
  }
}

const initConnectionsState: ConnectionsState = { total: 0, all: {} }

export const connectionsReducer = createReducer<ConnectionsState>(initConnectionsState, builder => {
  builder.addCase(actions.connected, (state, action) => {
    // Add connection
    const { key } = action.payload.config.connectionInfo
    state.all[key] = {
      active: true,
      connecting: 0,
      wasEverConnected: true,
    }
  })

  builder.addCase(actions.connect, (state, action) => {
    const { key } = action.payload.config.connectionInfo
    const isActive = state.all[key]?.active
    if (isActive) return

    const isConnecting = !isNaN(Number(state.all[key]?.connecting))
    state.all[key] = {
      active: false,
      connecting: isConnecting ? state.all[key].connecting + 1 : 1,
    }
  })

  builder.addCase(actions.connectionError, (state, action) => {
    state.all[action.payload.connectionInfo.key].connecting = 0
    state.all[action.payload.connectionInfo.key].active = false
  })

  builder.addCase(actions.disconnected, (state, action) => {
    // Remove connection
    const { key } = action.payload.config.connectionInfo
    state.all[key].active = false
    state.all[key].connecting = 0 // turn off connecting
  })

  builder.addMatcher(
    isAnyOf(actions.connect, actions.connected, actions.connectionError, actions.disconnected),
    state => {
      state.total = Object.values(state.all).filter(s => s?.active).length
    },
  )
})

export interface SubscriptionsState {
  /** Map of all subscriptions by key */
  [key: string]: {
    active: boolean
    wasEverActive?: boolean
    unsubscribed?: boolean
    subscribing: number
    input: AdapterRequest
  }
}

const initSubscriptionsState: SubscriptionsState = {}

export const subscriptionsReducer = createReducer<SubscriptionsState>(
  initSubscriptionsState,
  builder => {
    builder.addCase(actions.subscribed, (state, action) => {
      // Add subscription
      const key = getSubsId(action.payload.subscriptionMsg)
      state[key] = {
        active: true,
        wasEverActive: true,
        unsubscribed: false,
        subscribing: 0,
        input: { ...action.payload.input },
      }
    })

    builder.addCase(actions.subscribe, (state, action) => {
      const key = getSubsId(action.payload.subscriptionMsg)
      const isActive = state[key]?.active
      if (isActive) return

      const isSubscribing = state[key]?.subscribing
      state[key] = {
        active: false,
        subscribing: isSubscribing ? state[key].subscribing + 1 : 1,
        input: { ...action.payload.input },
      }
    })

    builder.addCase(actions.unsubscribed, (state, action) => {
      // Remove subscription
      const key = getSubsId(action.payload.subscriptionMsg)

      state[key].active = false
      state[key].unsubscribed = true
    })

    builder.addCase(actions.disconnected, state => {
      state = {}
      return state
    })
  },
)

export const rootReducer = combineReducers({
  connections: connectionsReducer,
  subscriptions: subscriptionsReducer,
})

export type RootState = ReturnType<typeof rootReducer>
