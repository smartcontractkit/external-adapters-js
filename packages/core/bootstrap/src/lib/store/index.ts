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
import { createLogger } from 'redux-logger'
import { nanoid } from '@reduxjs/toolkit'
import { composeWithDevTools } from 'remote-redux-devtools'
import { isDebug, isDebugLogLevel, redact } from '../util'

export const asAction = <T>() => (p: T) => ({
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

export function configureStore(
  rootReducer: Reducer,
  preloadedState: PreloadedState<any> = {},
  middleware: Middleware<unknown, any, Dispatch<AnyAction>>[] = [],
): Store {
  // https://github.com/LogRocket/redux-logger
  // create logger where each state/action/error is passed through redact
  const logger = createLogger({
    stateTransformer: redact,
    actionTransformer: redact,
    errorTransformer: redact,
  })

  if (isDebug() || isDebugLogLevel()) middleware.push(logger)
  const middlewareEnhancer = applyMiddleware(...middleware)

  const enhancers = [middlewareEnhancer]
  const composedEnhancers: any =
    process.env.NODE_ENV === 'development'
      ? composeWithDevTools({ realtime: true, port: 8000 })(...enhancers)
      : compose(...enhancers)

  // Create a store with the root reducer function being the one exposed by the manager.
  return createStore(rootReducer, preloadedState, composedEnhancers)
}
