import { PoRAdapter } from '@chainlink/external-adapter-framework/adapter/por'
import { adapter } from '../../src'
import * as transportModule from '../../src/transport/reserves'

const reservesTransport = (transportModule as unknown as { reservesTransport?: unknown })
  .reservesTransport

describe('adapter', () => {
  it('is a PoR adapter with one reserves endpoint on the HTTP subscription transport', () => {
    expect(adapter).toBeInstanceOf(PoRAdapter)
    expect(adapter.defaultEndpoint).toBe('reserves')
    expect(adapter.endpoints).toHaveLength(1)

    const endpoint = adapter.endpoints[0]
    expect(endpoint.name).toBe('reserves')
    expect(endpoint.aliases ?? []).toEqual([])

    const routes = endpoint.transportRoutes.entries()
    expect(routes).toHaveLength(1)
    expect(routes[0][1]).toBe(reservesTransport)
  })
})
