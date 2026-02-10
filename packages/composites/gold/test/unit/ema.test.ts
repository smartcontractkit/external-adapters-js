import { updateEma } from '../../src/transport/ema'

const TAU_MS = 30_000

describe('updateEma', () => {
  const now = 1770386630

  beforeEach(() => {
    jest.useFakeTimers()
  })

  it('should return the same value as long as no time passes', () => {
    const initialValue = 100_000_000_000n
    const state = {
      average: initialValue,
      timestampMs: now,
    }
    const newDataPoint = 0n
    expect(updateEma(state, newDataPoint, now, TAU_MS)).toEqual(state)
  })

  it('should decay to half in log(2) * tau time', () => {
    // We don't get enough precision in the timing for a larger value to half exectly.
    const initialValue = 10_000n
    const interval = TAU_MS * Math.log(2)
    const state = {
      average: initialValue,
      timestampMs: now - interval,
    }
    const newDataPoint = 0n
    expect(updateEma(state, newDataPoint, now, TAU_MS)).toEqual({
      average: initialValue / 2n,
      timestampMs: now,
    })
  })

  it('should decay to 1/e in tau time', () => {
    const initialValue = 100_000_000_000n
    const state = {
      average: initialValue,
      timestampMs: now - TAU_MS,
    }
    const newDataPoint = 0n
    expect(updateEma(state, newDataPoint, now, TAU_MS)).toEqual({
      average: BigInt(Math.round(Number(initialValue) * (1 / Math.E))),
      timestampMs: now,
    })
  })

  it('should decay exponentially', () => {
    const initialValue = 100_000_000_000n
    let state = {
      average: initialValue,
      timestampMs: now,
    }
    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(90_483_741_803n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(81_873_075_307n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(74_081_822_067n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(67_032_004_602n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(60_653_065_969n)
  })

  it('should work with negative numbers', () => {
    const initialValue = -100_000_000_000n
    let state = {
      average: initialValue,
      timestampMs: Date.now(),
    }
    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(-90_483_741_803n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(-81_873_075_307n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(-74_081_822_067n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(-67_032_004_602n)

    state = updateEma(state, 0n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(-60_653_065_969n)
  })

  it('should work with changing numbers', () => {
    const initialValue = 100_000_000_000n
    let state = {
      average: initialValue,
      timestampMs: Date.now(),
    }
    state = updateEma(state, 400_000_000_000n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(128_548_774_589n)

    state = updateEma(state, -300_000_000_000n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(87_766_966_701n)

    state = updateEma(state, 200_000_000_000n, state.timestampMs + 3000, TAU_MS)
    expect(state.average).toBe(98_447_351_931n)
  })

  it('should not change the input state', () => {
    const initialValue = 100_000_000_000n
    const initialTimestamp = Date.now()
    const state = {
      average: initialValue,
      timestampMs: initialTimestamp,
    }
    const newState = updateEma(state, 400_000_000_000n, initialTimestamp + 3000, TAU_MS)
    expect(state).toEqual({
      average: initialValue,
      timestampMs: initialTimestamp,
    })
    expect(newState).not.toEqual(state)
  })
})
