import { blocksizeStateSubscriptionRequestTransform } from '../../src/endpoint/utils'

describe('blocksizeStateSubscriptionRequestTransform', () => {
  it('should lowercase base and quote', () => {
    const req = {
      requestContext: {
        data: {
          base: 'EtH',
          quote: 'UsD',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'eth',
      quote: 'usd',
    })
  })

  it('should not modify unrelated request data', () => {
    const req = {
      requestContext: {
        data: {
          base: 'EtH',
          quote: 'UsD',
          endpoint: 'price',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'eth',
      quote: 'usd',
      endpoint: 'price',
    })
  })

  it('should lowercase base when quote is omitted', () => {
    const req = {
      requestContext: {
        data: {
          base: 'AmPl',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'ampl',
    })
  })
})
