import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { calculateReserves } from '../../src/lib/btc/por'

const waitFor = async (predicate: () => boolean): Promise<void> => {
  for (let i = 0; i < 50; i += 1) {
    if (predicate()) {
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  throw new Error('Timed out waiting for condition')
}

describe('calculateReserves', () => {
  it('includes pending spends when the source output meets minConfirmations', async () => {
    const requester = {
      request: async (_cacheKey: string, config: { url?: string }) => {
        const url = config.url ?? ''

        if (url.endsWith('/blocks/tip/height')) {
          return { response: { data: 1000 } }
        }

        if (url.endsWith('/address/vault/utxo')) {
          return { response: { data: [] } }
        }

        if (url.endsWith('/address/vault/txs/mempool')) {
          return {
            response: {
              data: [
                {
                  txid: 'pending-spend',
                  vin: [
                    {
                      txid: 'eligible-prevout',
                      vout: 0,
                      prevout: {
                        scriptpubkey_address: 'vault',
                        value: 10000,
                      },
                    },
                  ],
                },
              ],
            },
          }
        }

        if (url.endsWith('/tx/eligible-prevout/status')) {
          return {
            response: {
              data: {
                confirmed: true,
                block_height: 995,
              },
            },
          }
        }

        throw new Error(`Unexpected URL: ${url}`)
      },
    } as unknown as Requester

    await expect(
      calculateReserves(requester, 'http://localhost:8546', ['vault'], 6, 5000),
    ).resolves.toBe(10000n)
  })

  it('excludes pending spends when the source output is below minConfirmations', async () => {
    const requester = {
      request: async (_cacheKey: string, config: { url?: string }) => {
        const url = config.url ?? ''

        if (url.endsWith('/blocks/tip/height')) {
          return { response: { data: 1000 } }
        }

        if (url.endsWith('/address/vault/utxo')) {
          return { response: { data: [] } }
        }

        if (url.endsWith('/address/vault/txs/mempool')) {
          return {
            response: {
              data: [
                {
                  txid: 'pending-spend',
                  vin: [
                    {
                      txid: 'ineligible-prevout',
                      vout: 0,
                      prevout: {
                        scriptpubkey_address: 'vault',
                        value: 10000,
                      },
                    },
                  ],
                },
              ],
            },
          }
        }

        if (url.endsWith('/tx/ineligible-prevout/status')) {
          return {
            response: {
              data: {
                confirmed: true,
                block_height: 996,
              },
            },
          }
        }

        throw new Error(`Unexpected URL: ${url}`)
      },
    } as unknown as Requester

    await expect(
      calculateReserves(requester, 'http://localhost:8546', ['vault'], 6, 5000),
    ).resolves.toBe(0n)
  })

  it('caps concurrent streams address lookups at 10', async () => {
    let activeUtxoRequests = 0
    let maxConcurrentUtxoRequests = 0
    let pendingUtxoResolvers: Array<() => void> = []

    const requester = {
      request: async (_cacheKey: string, config: { url?: string }) => {
        const url = config.url ?? ''

        if (url.endsWith('/blocks/tip/height')) {
          return { response: { data: 1000 } }
        }

        if (url.endsWith('/utxo')) {
          activeUtxoRequests += 1
          maxConcurrentUtxoRequests = Math.max(maxConcurrentUtxoRequests, activeUtxoRequests)

          await new Promise<void>((resolve) => {
            pendingUtxoResolvers.push(() => {
              activeUtxoRequests -= 1
              resolve()
            })
          })

          return { response: { data: [] } }
        }

        if (url.endsWith('/txs/mempool')) {
          return { response: { data: [] } }
        }

        throw new Error(`Unexpected URL: ${url}`)
      },
    } as unknown as Requester

    const reservesPromise = calculateReserves(
      requester,
      'http://localhost:8546',
      Array.from({ length: 11 }, (_, index) => `address-${index}`),
      0,
      5000,
    )

    await waitFor(() => pendingUtxoResolvers.length === 10)
    expect(maxConcurrentUtxoRequests).toBe(10)

    const firstBatchResolvers = pendingUtxoResolvers
    pendingUtxoResolvers = []
    firstBatchResolvers.forEach((resolve) => resolve())

    await waitFor(() => pendingUtxoResolvers.length === 1)
    pendingUtxoResolvers.forEach((resolve) => resolve())

    await expect(reservesPromise).resolves.toBe(0n)
  })
})
