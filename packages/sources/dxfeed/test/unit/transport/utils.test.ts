import { toNumber } from '../../../src/transport/utils'

describe('toNumber', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty string', ''],
    ['whitespace string', ' '],
    ['tab string', '\t'],
    ['NaN string', 'NaN'],
    ['Infinity string', 'Infinity'],
    ['-Infinity string', '-Infinity'],
    ['numeric string', '0'],
    ['decimal string', '1.5'],
    ['boolean true', true],
    ['boolean false', false],
    ['object', {}],
    ['array', [1]],
    ['NaN number', NaN],
    ['Infinity number', Infinity],
  ])('returns null for %s', (_name, value) => {
    expect(toNumber(value)).toBeNull()
  })

  it.each([
    ['zero', 0],
    ['positive decimal', 1.5],
    ['negative decimal', -2],
  ])('returns the finite number for %s', (_name, value) => {
    expect(toNumber(value)).toBe(value)
  })
})
