import { SessionAwareSmoother } from '../../../src/lib/smoother'

describe('SessionAwareSmoother', () => {
  it('should return rawPrice unchanged', () => {
    const smoother = new SessionAwareSmoother()

    const result = smoother.processUpdate(10n, 100)

    expect(result).toBe(10n)
  })
})
