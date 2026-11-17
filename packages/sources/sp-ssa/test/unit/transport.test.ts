import { EndpointContext } from '@chainlink/external-adapter-framework/adapter'
import { TransportDependencies } from '@chainlink/external-adapter-framework/transports'
import { makeStub } from '@chainlink/external-adapter-framework/util/testing-utils'
import { SsaTransport, SsaTransportTypes } from '../../src/transport/ssa'

describe('SsaTransport with an empty subscription set', () => {
  const awaitBackgroundPeriod = async (milliseconds: number): Promise<void> => {
    const requester = makeStub('requester', { request: jest.fn() })
    const transport = new SsaTransport()
    const dependencies = makeStub('dependencies', {
      requester,
      responseCache: {},
      subscriptionSetFactory: makeStub('subscriptionSetFactory', {
        buildSet: jest.fn(() => ({ add: jest.fn(), getAll: jest.fn() })),
      }),
    } as unknown as TransportDependencies<SsaTransportTypes>)
    const settings = makeStub('adapterSettings', {
      API_ENDPOINT: 'http://api.com',
      AUTH_ENDPOINT: 'http://token.com/token',
      CLIENT_ID: 'client-id',
      API_KEY: 'api-key',
      ORIGIN: 'node-origin',
      BACKGROUND_EXECUTE_MS_HTTP: milliseconds,
      WARMUP_SUBSCRIPTION_TTL: 10_000,
    } as unknown as SsaTransportTypes['Settings'])
    const context = makeStub('context', {
      adapterSettings: settings,
      endpointName: 'ssa',
    } as unknown as EndpointContext<SsaTransportTypes>)

    await transport.initialize(dependencies, settings, 'ssa', 'default_single_transport')
    const started = Date.now()
    await transport.backgroundHandler(context, [])
    const elapsed = Date.now() - started

    expect(requester.request).not.toHaveBeenCalled()
    expect(elapsed).toBeGreaterThanOrEqual(milliseconds - 5)
  }

  it('makes no provider call and sleeps one background period', async () => {
    await awaitBackgroundPeriod(40)
  })
})
