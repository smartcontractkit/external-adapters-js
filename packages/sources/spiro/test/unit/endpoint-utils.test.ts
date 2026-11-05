import { validateFundId } from '../../src/endpoint/utils'

describe('validateFundId', () => {
  it.each(['michigan-pilot', 'a1', 'a_b-c'])('accepts %s', (fundId) => {
    expect(validateFundId(fundId)).toBeUndefined()
  })

  it.each(['CaseFund', '../etc/passwd', '', '\ud800', '-foo', 'foo!bar', 'a.b'])(
    'rejects %s',
    (fundId) => {
      const error = validateFundId(fundId)
      expect(error).toBeDefined()
      expect(error?.statusCode).toBe(400)
      expect(error?.message).toContain('Invalid fundId')
    },
  )
})
