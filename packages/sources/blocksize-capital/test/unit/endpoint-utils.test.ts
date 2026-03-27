import { blocksizeCommonSubscriptionRequestTransform } from '../../src/endpoint/utils'

describe('blocksizeCommonSubscriptionRequestTransform', () => {
  it('should lowercase base and quote', () => {
    const req = {
      requestContext: {
        data: {
          base: 'EtH',
          quote: 'UsD',
        },
      },
    } as any

    blocksizeCommonSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'eth',
      quote: 'usd',
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

    blocksizeCommonSubscriptionRequestTransform()(req)

    expect(req.requestContext.data).toEqual({
      base: 'ampl',
    })
  })
})
