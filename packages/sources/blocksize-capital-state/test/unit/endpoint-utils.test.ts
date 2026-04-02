import { blocksizeStateSubscriptionRequestTransform } from '../../src/endpoint/utils'

describe('blocksizeStateSubscriptionRequestTransform', () => {
  it('should lowercase base and quote', () => {
    const req = {
      requestContext: {
        data: {
          base: 'CbBtC',
          quote: 'UsD',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'cbbtc',
      quote: 'usd',
    })
  })

  it('should not modify unrelated request data', () => {
    const req = {
      requestContext: {
        data: {
          base: 'CbBtC',
          quote: 'UsD',
          endpoint: 'state',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'cbbtc',
      quote: 'usd',
      endpoint: 'state',
    })
  })

  it('should lowercase base when quote is omitted', () => {
    const req = {
      requestContext: {
        data: {
          base: 'CbBtC',
        },
      },
    } as any

    blocksizeStateSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'cbbtc',
    })
  })
})
