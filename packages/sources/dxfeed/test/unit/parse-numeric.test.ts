import { parseNumeric } from '../../src/transport/ws'

// Spec valueRangeScalingNotes: "Prices and volumes arrive as JSON numbers (or
// the JSON string \"NaN\", which is invalid)." The frame parser maps the "NaN"
// string to NaN before a record is processed; parseNumeric itself accepts JSON
// numbers only — no string coercion.
describe('parseNumeric (spec valueRangeScalingNotes wire shape: JSON numbers only, "NaN" invalid)', () => {
  it('accepts a JSON number verbatim', () => {
    expect(parseNumeric(190.05)).toBe(190.05)
    expect(parseNumeric(0)).toBe(0)
    expect(parseNumeric(100)).toBe(100)
  })

  it('rejects every string — a numeric string is a provider wire-shape regression, not a value', () => {
    expect(Number.isNaN(parseNumeric('190.05'))).toBe(true)
    expect(Number.isNaN(parseNumeric('100'))).toBe(true)
  })

  it('maps the "NaN" marker string to NaN (invalid)', () => {
    expect(Number.isNaN(parseNumeric('NaN'))).toBe(true)
  })

  it('rejects non-finite numbers and non-numeric types', () => {
    expect(Number.isNaN(parseNumeric(Infinity))).toBe(true)
    expect(Number.isNaN(parseNumeric(NaN))).toBe(true)
    expect(Number.isNaN(parseNumeric(null))).toBe(true)
    expect(Number.isNaN(parseNumeric(undefined))).toBe(true)
    expect(Number.isNaN(parseNumeric(true))).toBe(true)
  })
})
