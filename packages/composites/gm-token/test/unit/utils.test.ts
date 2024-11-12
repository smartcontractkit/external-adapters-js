import { toFixed, median } from '../../src/transport/utils'

describe('toFixed', () => {
  it('should return a string with correct precision', () => {
    let res = toFixed(0.62296417, 12)
    expect(res).toBe('622964170000000000')
    res = toFixed(44.3422343, 8)
    expect(res).toBe('443422343000000000000000')
  })
})

describe('median', () => {
  it('should return correct median value', () => {
    let res = median([1, 2, 3, 4, 5])
    expect(res).toBe(3)
    res = median([1, 2, 3, 4])
    expect(res).toBe(2.5)
  })
})
