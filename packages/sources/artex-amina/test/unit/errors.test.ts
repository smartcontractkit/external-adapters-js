import {
  AdapterConnectionError,
  AdapterDataProviderError,
} from '@chainlink/external-adapter-framework/validation/error'
import { mapAminaError } from '../../src/transport/errors'

const timestamps = {
  providerDataRequestedUnixMs: 1,
  providerDataReceivedUnixMs: 2,
  providerIndicatedTimeUnixMs: undefined,
}

describe('AMINA error mapping', () => {
  it('does not echo the raw connection message', () => {
    const error = new AdapterConnectionError(
      {
        statusCode: 502,
        message:
          'request failed with headers Authorization: Bearer secret Amina-Signature: secret password: secret',
      },
      timestamps,
    )

    const mapped = mapAminaError(error)

    expect(mapped.message).toBe('AMINA connection failed')
    expect(mapped.message).not.toContain('Bearer')
    expect(mapped.message).not.toContain('Amina-Signature')
    expect(mapped.message).not.toContain('password')
  })

  it('keeps only the safe provider error fields', () => {
    const error = new AdapterDataProviderError(
      {
        statusCode: 502,
        providerStatusCode: 500,
        message: 'raw provider message with Bearer secret',
        errorResponse: {
          title: 'Forbidden',
          detail: 'Authorization: Bearer secret',
          instance: 'instance-1',
        },
      },
      timestamps,
    )

    const mapped = mapAminaError(error)

    expect(mapped.message).toBe('AMINA request failed (500): Forbidden | instance-1')
    expect(mapped.message).not.toContain('Bearer')
    expect(mapped.message).not.toContain('Authorization')
  })
})
