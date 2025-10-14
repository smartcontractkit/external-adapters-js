import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TokenResolver, type TokenMeta } from '../../src/transport/token-resolver'

describe('TokenResolver', () => {
  const settings: any = {
    ARBITRUM_TOKENS_INFO_URL: 'http://arb.local/tokens',
    BOTANIX_TOKENS_INFO_URL: 'http://bot.local/tokens',
  }

  const makeRequester = (handlers: Record<string, TokenMeta[]>) => {
    const req = {
      request: jest.fn(async (_key: string, r: { url: string; method: 'GET' }) => {
        const list = handlers[r.url] ?? []
        return {
          response: {
            data: {
              tokens: list.map((t) => ({
                symbol: t.symbol,
                address: t.address,
                decimals: t.decimals,
              })),
            },
          },
        }
      }),
    }
    return req as unknown as Requester
  }

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('fetches and returns token meta (case-insensitive symbol)', async () => {
    const arbTokens: TokenMeta[] = [
      { symbol: 'LINK', address: '0xLinkArb', decimals: 18 },
      { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
    ]
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: arbTokens,
    })
    const resolver = new TokenResolver(requester, settings)

    const metaLower = await resolver.getToken('arbitrum', 'link')
    const metaUpper = await resolver.getToken('arbitrum', 'LINK')

    expect(requester.request).toHaveBeenCalledTimes(2)
    expect(metaLower).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })
    expect(metaUpper).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })

    const [keyArg, reqArg] = (requester.request as any).mock.calls[0]
    const expected = { url: settings.ARBITRUM_TOKENS_INFO_URL, method: 'GET' as const }
    expect(reqArg).toEqual(expected)
    expect(keyArg).toBe(JSON.stringify(expected))
  })

  it('hits respective URLs per chain', async () => {
    const arbTokens: TokenMeta[] = [{ symbol: 'LINK', address: '0xLinkArb', decimals: 18 }]
    const botTokens: TokenMeta[] = [{ symbol: 'LINK', address: '0xLinkBot', decimals: 18 }]

    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: arbTokens,
      [settings.BOTANIX_TOKENS_INFO_URL]: botTokens,
    })

    const resolver = new TokenResolver(requester, settings)

    const arbMeta = await resolver.getToken('arbitrum', 'LINK')
    const botMeta = await resolver.getToken('botanix', 'LINK')

    expect(arbMeta).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })
    expect(botMeta).toEqual({ symbol: 'LINK', address: '0xLinkBot', decimals: 18 })

    expect(requester.request).toHaveBeenCalledTimes(2)
    const urls = (requester.request as any).mock.calls.map(([, r]: any) => r.url).sort()
    expect(urls).toEqual(
      [settings.ARBITRUM_TOKENS_INFO_URL, settings.BOTANIX_TOKENS_INFO_URL].sort(),
    )
  })

  it('throws when the symbol is not present', async () => {
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: [{ symbol: 'USDC', address: '0xUsdc', decimals: 6 }],
    })
    const resolver = new TokenResolver(requester, settings)

    await expect(resolver.getToken('arbitrum', 'MISSING')).rejects.toThrow(
      'Token with symbol "MISSING" not found on arbitrum',
    )
    expect(requester.request).toHaveBeenCalledTimes(1)
  })

  it('handles multiple tokens in payload across calls', async () => {
    const list: TokenMeta[] = [
      { symbol: 'A', address: '0xA', decimals: 18 },
      { symbol: 'b', address: '0xB', decimals: 8 },
      { symbol: 'Cc', address: '0xC', decimals: 6 },
    ]
    const requester = makeRequester({
      [settings.BOTANIX_TOKENS_INFO_URL]: list,
    })
    const resolver = new TokenResolver(requester, settings)

    expect(await resolver.getToken('botanix', 'A')).toEqual({
      symbol: 'A',
      address: '0xA',
      decimals: 18,
    })
    expect(await resolver.getToken('botanix', 'B')).toEqual({
      symbol: 'b',
      address: '0xB',
      decimals: 8,
    })
    expect(await resolver.getToken('botanix', 'CC')).toEqual({
      symbol: 'Cc',
      address: '0xC',
      decimals: 6,
    })

    expect(requester.request).toHaveBeenCalledTimes(3)
  })
})
