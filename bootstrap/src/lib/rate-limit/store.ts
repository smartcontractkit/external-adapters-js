import { createStore, PreloadedState, Reducer } from 'redux'

export function configureStore(rootReducer: Reducer, preloadedState: PreloadedState<any> = {}) {
  const store = createStore(rootReducer, preloadedState)
  return { store }
}
