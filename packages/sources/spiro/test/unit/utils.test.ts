import { checkRipcord } from '../../src/transport/utils'

describe('ripcord helper', () => {
  it('returns a ripcord message on ripcord', () => {
    const check = checkRipcord({ ripcord: true, ripcordDetails: ['NAV is stale'] }, false)
    expect(check.ripcord).toBe(true)
    expect(check.ripcordAsInt).toBe(1)
    expect(check.message).toBe('Ripcord indicator true. Details: NAV is stale')
  })

  it('returns no message on ripcord when noErrorOnRipcord is true', () => {
    const check = checkRipcord({ ripcord: true, ripcordDetails: ['NAV is stale'] }, true)
    expect(check.message).toBeUndefined()
    expect(check.ripcord).toBe(true)
    expect(check.ripcordAsInt).toBe(1)
  })

  it('returns no message and zero int when ripcord is false', () => {
    const check = checkRipcord({ ripcord: false, ripcordDetails: [] }, false)
    expect(check.message).toBeUndefined()
    expect(check.ripcord).toBe(false)
    expect(check.ripcordAsInt).toBe(0)
  })

  it('does not trip on a string "false" ripcord value', () => {
    const check = checkRipcord(
      { ripcord: 'false' as unknown as boolean, ripcordDetails: [] },
      false,
    )
    expect(check.ripcord).toBe(false)
    expect(check.ripcordAsInt).toBe(0)
    expect(check.message).toBeUndefined()
  })

  it('joins missing ripcordDetails as empty', () => {
    const check = checkRipcord(
      { ripcord: true, ripcordDetails: undefined as unknown as string[] },
      false,
    )
    expect(check.message).toBe('Ripcord indicator true. Details: ')
  })
})
