// TODO: update the import paths to target your custom foreground transport.
import { CustomTransport } from '../../../src/transport/price-customfg'

const buildTransport = () => {
  const transport = new CustomTransport()
  transport.name = 'customfg-template'
  transport.responseCache = {
    write: jest.fn(),
  } as any
  transport.requester = {
    request: jest.fn(),
  } as any
  return transport
}

const SAMPLE_REQUEST = {
  data: {
    base: 'ETH',
    quote: 'USD',
  },
} as any // AdapterRequest<typeof inputParameters.validated>

describe.skip('Custom foreground transport template', () => {
  it('returns a formatted adapter response', async () => {
    const transport = buildTransport()

    const response = await transport.foregroundExecute(SAMPLE_REQUEST as any)

    expect(response.statusCode).toBe(200)
    expect(response.result).toBeDefined()
    expect(response.timestamps?.providerDataRequestedUnixMs).toBeDefined()
  })
})
