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
import logger from 'redux-logger'
import { nanoid } from '@reduxjs/toolkit'
import { composeWithDevTools } from 'remote-redux-devtools'

export const toActionPayload = <A extends ActionBase>(data: any): A => ({
  id: nanoid(),
  createdAt: new Date().toISOString(),
  ...data,
})

export interface ActionBase {
  id: string
  createdAt: string
}

export function configureStore(
  rootReducer: Reducer,
  preloadedState: PreloadedState<any> = {},
  middleware: Middleware<unknown, any, Dispatch<AnyAction>>[] = [],
): Store {
  const isDebug =
    process.env.DEBUG || process.env.NODE_ENV === 'development' || process.env.LOG_LEVEL === 'debug'
  if (isDebug) middleware.push(logger)

  const middlewareEnhancer = applyMiddleware(...middleware)

  const enhancers = [middlewareEnhancer]
  const composedEnhancers: any =
    process.env.NODE_ENV === 'development'
      ? composeWithDevTools({ realtime: true, port: 8000 })(...enhancers)
      : compose(...enhancers)

  // Create a store with the root reducer function being the one exposed by the manager.
  return createStore(rootReducer, preloadedState, composedEnhancers)
}
