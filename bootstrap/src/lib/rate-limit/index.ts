import { AdapterRequest } from '@chainlink/types'
import { Middleware } from '../..'
import { requestObserved } from './actions'
import rootReducer, { Heartbeat, IntervalNames, Intervals } from './reducer'
import { configureStore } from './store'
import { getParticipantId, getMaxReqAllowed, getParticipantCost } from './util'

export * as actions from './actions'

const { store } = configureStore(rootReducer)

export const getThroughput = (interval: IntervalNames, input?: AdapterRequest): Heartbeat[] => {
  const { heartbeats } = store.getState()

  if (input) {
    const participantId = getParticipantId(input)
    return heartbeats.participants[participantId]?.[interval] || []
  }
  return heartbeats.total[interval] || []
}

/**
 * Calculate maxAge to keep the item cached so we allow the specified throughput.
 *
 * @param throughput number of allowed requests in interval
 * @param interval time window in ms
 */
const maxAgeFor = (throughput: number, interval: number) =>
  throughput <= 0 ? interval : Math.floor(interval / throughput)

export const withRateLimit: Middleware = async (execute) => async (input) => {
  const totalReqPerMin = getThroughput(IntervalNames.MINUTE)
  const participantReqPerMin = getThroughput(IntervalNames.MINUTE, input)
  const cost = getParticipantCost(participantReqPerMin)
  const maxReqPerMin = getMaxReqAllowed(
    totalReqPerMin.length + 1,
    participantReqPerMin.length + 1,
    cost,
  )
  const maxAge = maxAgeFor(maxReqPerMin, Intervals[IntervalNames.MINUTE])
  const result = await execute({ ...input, data: { ...input.data, maxAge } })
  store.dispatch(requestObserved(input, result.data.cost))
  return result
}

export { store }
