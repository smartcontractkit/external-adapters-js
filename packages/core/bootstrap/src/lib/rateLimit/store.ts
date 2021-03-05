import { createStore, PreloadedState, Reducer } from 'redux'

export interface Interval {
  [key: string]: number
}

export enum IntervalNames {
  SEC = 'SEC',
  MINUTE = 'MINUTE',
  HOUR = 'HOUR',
  DAY = 'DAY',
  ALL = 'ALL',
}

export const Intervals: Interval = {
  [IntervalNames.SEC]: 1000,
  [IntervalNames.MINUTE]: 1000 * 60,
  [IntervalNames.HOUR]: 1000 * 60 * 60,
  [IntervalNames.DAY]: 1000 * 60 * 60 * 24,
}

export function configureStore(rootReducer: Reducer, preloadedState: PreloadedState<any> = {}) {
  const store = createStore(rootReducer, preloadedState)
  return { store }
}
