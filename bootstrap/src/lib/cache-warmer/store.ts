import { applyMiddleware, createStore, PreloadedState, Reducer } from 'redux'
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

  const middlewares = [epicMiddleware]
  const middlewareEnhancer = applyMiddleware(...middlewares)

  const enhancers = [middlewareEnhancer]
  const composedEnhancers = composeWithDevTools({ realtime: true, port: 8000 })(...enhancers)

  // Create a store with the root reducer function being the one exposed by the manager.
  const store = createStore(rootReducer, preloadedState, composedEnhancers)
  return { store, epicMiddleware }
}
