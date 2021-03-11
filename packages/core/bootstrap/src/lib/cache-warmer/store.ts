import {
  AnyAction,
  applyMiddleware,
  compose,
  createStore,
  Dispatch,
  Middleware,
  PreloadedState,
  Reducer,
} from 'redux'
import logger from 'redux-logger'
import { createEpicMiddleware } from 'redux-observable'
import { composeWithDevTools } from 'remote-redux-devtools'
import { Config, get } from './config'
import { RootState } from './reducer'
export interface EpicDependencies {
  config: Config
}

export function configureStore(rootReducer: Reducer, preloadedState: PreloadedState<any> = {}) {
  const epicMiddleware = createEpicMiddleware<any, any, RootState, EpicDependencies>({
    dependencies: { config: get() },
  })

  const middlewares: Middleware<unknown, any, Dispatch<AnyAction>>[] = [epicMiddleware]
  if (
    process.env.DEBUG ||
    process.env.NODE_ENV === 'development' ||
    process.env.LOG_LEVEL === 'debug'
  ) {
    middlewares.push(logger)
  }
  const middlewareEnhancer = applyMiddleware(...middlewares)

  const enhancers = [middlewareEnhancer]
  const composedEnhancers: any =
    process.env.NODE_ENV === 'development'
      ? composeWithDevTools({ realtime: true, port: 8000 })(...enhancers)
      : compose(...enhancers)

  // Create a store with the root reducer function being the one exposed by the manager.
  const store = createStore(rootReducer, preloadedState, composedEnhancers)
  return { store, epicMiddleware }
}
