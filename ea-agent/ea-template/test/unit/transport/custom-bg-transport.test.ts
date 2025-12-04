// TODO: update the import paths to target your custom subscription transport.
import { CustomTransport } from '../../../src/transport/price-custombg'
import type { CustomTransportTypes } from '../../../src/transport/price-custombg'

const buildTransport = () => {
  const transport = new CustomTransport()
  transport.name = 'custombg-template'
  transport.responseCache = {
    write: jest.fn(),
  } as any
  return transport
}

const SAMPLE_PARAM = {
  base: 'ETH',
  quote: 'USD',
} as unknown as CustomTransportTypes['Parameters']

describe.skip('Custom background transport template', () => {
  it('writes successful responses to the cache', async () => {
    const transport = buildTransport()
    jest.spyOn(transport, '_handleRequest').mockResolvedValue({
      result: 2000,
      data: { result: 2000 },
      statusCode: 200,
      timestamps: {
        providerDataRequestedUnixMs: Date.now(),
        providerDataReceivedUnixMs: Date.now(),
        providerIndicatedTimeUnixMs: undefined,
      },
    })

    await transport.handleRequest(SAMPLE_PARAM)

    expect(transport.responseCache.write).toHaveBeenCalledWith(
      'custombg-template',
      expect.arrayContaining([
        expect.objectContaining({
          params: SAMPLE_PARAM,
          response: expect.objectContaining({ result: 2000 }),
        }),
      ]),
    )
  })

  it('records provider errors when _handleRequest throws', async () => {
    const transport = buildTransport()
    jest.spyOn(transport, '_handleRequest').mockRejectedValue(new Error('provider failed'))

    await transport.handleRequest(SAMPLE_PARAM)

    expect(transport.responseCache.write).toHaveBeenCalledWith(
      'custombg-template',
      expect.arrayContaining([
        expect.objectContaining({
          response: expect.objectContaining({
            statusCode: 502,
            errorMessage: 'provider failed',
          }),
        }),
      ]),
    )
  })
})

