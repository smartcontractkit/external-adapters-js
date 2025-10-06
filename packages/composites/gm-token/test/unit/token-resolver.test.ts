import type { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { TokenResolver, type TokenMeta } from '../../src/transport/token-resolver'

describe('TokenResolver', () => {
  let now: number
  let nowSpy: jest.SpyInstance<number, []>
  const advance = (ms: number) => {
    now += ms
  }

  const TTL = 10_000

  const settings: any = {
    ARBITRUM_TOKENS_INFO_URL: 'http://arb.local/tokens',
    BOTANIX_TOKENS_INFO_URL: 'http://bot.local/tokens',
    GMX_TOKENS_CACHE_MS: TTL,
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

  beforeEach(() => {
    now = 1_700_000_000_000 // fixed base time
    nowSpy = jest.spyOn(Date, 'now').mockImplementation(() => now)
  })

  afterEach(() => {
    nowSpy.mockRestore()
    jest.clearAllMocks()
  })

  it('fetches on first request and returns token meta (case-insensitive symbol)', async () => {
    const arbTokens: TokenMeta[] = [
      { symbol: 'LINK', address: '0xLinkArb', decimals: 18 },
      { symbol: 'USDC', address: '0xUsdcArb', decimals: 6 },
    ]
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: arbTokens,
    })
    const resolver = new TokenResolver(requester, settings)

    const metaLower = await resolver.get('arbitrum', 'link')
    const metaUpper = await resolver.get('arbitrum', 'LINK')

    expect(requester.request).toHaveBeenCalledTimes(1)
    expect(metaLower).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })
    expect(metaUpper).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })

    // Also verify the JSON-stringified key was used
    const [keyArg, reqArg] = (requester.request as any).mock.calls[0]
    expect(reqArg).toEqual({ url: settings.ARBITRUM_TOKENS_INFO_URL, method: 'GET' })
    expect(keyArg).toBe(JSON.stringify(reqArg))
  })

  it('serves from cache within TTL (no second network call)', async () => {
    const arbTokens: TokenMeta[] = [{ symbol: 'ETH', address: '0xEthArb', decimals: 18 }]
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: arbTokens,
    })
    const resolver = new TokenResolver(requester, settings)

    // 1st call fetches
    const first = await resolver.get('arbitrum', 'ETH')
    expect(first).toEqual({ symbol: 'ETH', address: '0xEthArb', decimals: 18 })
    expect(requester.request).toHaveBeenCalledTimes(1)

    // 2nd call within TTL does not fetch
    advance(TTL - 1)
    const second = await resolver.get('arbitrum', 'ETH')
    expect(second).toEqual(first)
    expect(requester.request).toHaveBeenCalledTimes(1)
  })

  it('refreshes after TTL expiry (second network call)', async () => {
    const firstSet: TokenMeta[] = [{ symbol: 'ETH', address: '0xEthV1', decimals: 18 }]
    const secondSet: TokenMeta[] = [{ symbol: 'ETH', address: '0xEthV2', decimals: 18 }]
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: firstSet,
    })

    // Swap handler result after first call by overriding mock implementation.
    ;(requester.request as any).mockImplementationOnce(async (_key: string, r: any) => ({
      response: { data: { tokens: firstSet } },
    }))
    ;(requester.request as any).mockImplementationOnce(async (_key: string, r: any) => ({
      response: { data: { tokens: secondSet } },
    }))

    const resolver = new TokenResolver(requester, settings)

    const first = await resolver.get('arbitrum', 'ETH')
    expect(first).toEqual({ symbol: 'ETH', address: '0xEthV1', decimals: 18 })
    expect(requester.request).toHaveBeenCalledTimes(1)

    // Pass TTL
    advance(TTL + 1)

    const second = await resolver.get('arbitrum', 'ETH')
    expect(second).toEqual({ symbol: 'ETH', address: '0xEthV2', decimals: 18 })
    expect(requester.request).toHaveBeenCalledTimes(2)
  })

  it('maintains independent caches per chain and hits respective URLs', async () => {
    const arbTokens: TokenMeta[] = [{ symbol: 'LINK', address: '0xLinkArb', decimals: 18 }]
    const botTokens: TokenMeta[] = [{ symbol: 'LINK', address: '0xLinkBot', decimals: 18 }]

    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: arbTokens,
      [settings.BOTANIX_TOKENS_INFO_URL]: botTokens,
    })

    const resolver = new TokenResolver(requester, settings)

    const arbMeta = await resolver.get('arbitrum', 'LINK')
    const botMeta = await resolver.get('botanix', 'LINK')

    expect(arbMeta).toEqual({ symbol: 'LINK', address: '0xLinkArb', decimals: 18 })
    expect(botMeta).toEqual({ symbol: 'LINK', address: '0xLinkBot', decimals: 18 })

    // two separate fetches (one per chain)
    expect(requester.request).toHaveBeenCalledTimes(2)
    const urls = (requester.request as any).mock.calls.map(([, r]: any) => r.url).sort()
    expect(urls).toEqual(
      [settings.ARBITRUM_TOKENS_INFO_URL, settings.BOTANIX_TOKENS_INFO_URL].sort(),
    )
  })

  it('returns undefined when the symbol is not present', async () => {
    const requester = makeRequester({
      [settings.ARBITRUM_TOKENS_INFO_URL]: [{ symbol: 'USDC', address: '0xUsdc', decimals: 6 }],
    })
    const resolver = new TokenResolver(requester, settings)

    const meta = await resolver.get('arbitrum', 'MISSING')
    expect(meta).toBeUndefined()
    expect(requester.request).toHaveBeenCalledTimes(1)
  })

  it('rebuilds entire map from payload (multiple tokens)', async () => {
    const list: TokenMeta[] = [
      { symbol: 'A', address: '0xA', decimals: 18 },
      { symbol: 'b', address: '0xB', decimals: 8 },
      { symbol: 'Cc', address: '0xC', decimals: 6 },
    ]
    const requester = makeRequester({
      [settings.BOTANIX_TOKENS_INFO_URL]: list,
    })
    const resolver = new TokenResolver(requester, settings)

    expect(await resolver.get('botanix', 'A')).toEqual({
      symbol: 'A',
      address: '0xA',
      decimals: 18,
    })
    expect(await resolver.get('botanix', 'B')).toEqual({ symbol: 'b', address: '0xB', decimals: 8 })
    expect(await resolver.get('botanix', 'CC')).toEqual({
      symbol: 'Cc',
      address: '0xC',
      decimals: 6,
    })
    expect(requester.request).toHaveBeenCalledTimes(1)
  })
})
