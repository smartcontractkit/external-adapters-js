import { createLogThrottle } from '../../../src/lib/session/logThrottle'

// Unit tests for the sticky-log-line throttle (logThrottle.ts): one emission per
// key per window, independent per key, and re-emitted once the window elapses so
// the condition stays visible.

describe('createLogThrottle', () => {
  it('emits once per window per key, then again past the window', () => {
    const throttle = createLogThrottle(60_000)
    const log = jest.fn()

    throttle('k', log, 1_000)
    throttle('k', log, 2_000)
    expect(log).toHaveBeenCalledTimes(1)

    throttle('k', log, 60_999)
    expect(log).toHaveBeenCalledTimes(1)

    throttle('k', log, 61_000)
    expect(log).toHaveBeenCalledTimes(2)
  })

  it('throttles each key independently', () => {
    const throttle = createLogThrottle(60_000)
    const log = jest.fn()

    throttle('a', log, 1_000)
    throttle('b', log, 1_000)
    expect(log).toHaveBeenCalledTimes(2)

    throttle('a', log, 1_001)
    expect(log).toHaveBeenCalledTimes(2)
  })

  it('only invokes the log callback when it emits (deferred message construction)', () => {
    const throttle = createLogThrottle(60_000)
    const log = jest.fn()

    throttle('k', log, 1_000)
    throttle('k', log, 1_001)
    throttle('k', log, 1_002)

    expect(log).toHaveBeenCalledTimes(1)
  })
})
