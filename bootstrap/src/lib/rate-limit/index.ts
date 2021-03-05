import { AdapterRequest } from '@chainlink/types'
import rootReducer, { Heartbeat } from './reducer'
import { configureStore, IntervalNames } from './store'
import { getParticipantId, getMaxReqAllowed, getParticipantCost } from './util'
export * as actions from './actions'
export { store, IntervalNames as Interval, getMaxReqAllowed, getParticipantCost }

const { store } = configureStore(rootReducer)

export const getTroughput = (interval: IntervalNames, input?: AdapterRequest): Heartbeat[] => {
  const { heartbeats } = store.getState()

  if (input) {
    const participantId = getParticipantId(input)
    return heartbeats.participants[participantId]?.[interval] || []
  }
  return heartbeats.total[interval] || []
}
