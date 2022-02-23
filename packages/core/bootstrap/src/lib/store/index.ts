import { nanoid } from '@reduxjs/toolkit'
import {
  AnyAction,
  applyMiddleware,
  compose,
  createStore,
  Dispatch,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
} from 'redux'
import { composeWithDevTools } from 'remote-redux-devtools'

export const asAction =
  <T>() =>
  (
    p: T,
  ): {
    payload: ActionBase & T
  } => ({
    payload: toActionPayload<T>(p),
  })

export const toActionPayload = <T>(data: T): ActionBase & T => ({
  id: nanoid(),
  createdAt: new Date().toISOString(),
  ...data,
})

export interface ActionBase {
  id: string
  createdAt: string
}

export function configureStore<State>(
  rootReducer: Reducer<State>,
  preloadedState: PreloadedState<State> = {},
  middleware: Middleware<unknown, State, Dispatch<AnyAction>>[] = [],
): Store {
  const middlewareEnhancer = applyMiddleware(...middleware)

  const enhancers = middlewareEnhancer
  const composedEnhancers =
    process.env.NODE_ENV === 'development'
      ? composeWithDevTools({
          realtime: true,
          port: 8000,
          actionsBlacklist: ['WS/MESSAGE_RECEIVED'],
        })(enhancers)
      : compose(enhancers)

  // Create a store with the root reducer function being the one exposed by the manager.
  return createStore(rootReducer, preloadedState, composedEnhancers)
}
