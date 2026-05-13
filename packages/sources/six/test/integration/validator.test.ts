import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

describe('execute', () => {
  it('throw on invalid keys', async () => {
    const oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.PRIVATE_KEY = 'fake-private-key'
    process.env.PUBLIC_CERT = 'fake-public-cert'

    const adapter = (await import('../../src')).adapter
    await expect(
      TestAdapter.startWithMockedCache(adapter, {
        testAdapter: {} as TestAdapter<never>,
      }),
    ).rejects.toThrow(
      'Validation failed for the following variables:\n' +
        'PRIVATE_KEY: Value must be a valid private key that starts with "-----BEGIN PRIVATE KEY-----\\n" and end with "\\n-----END PRIVATE KEY-----"\n' +
        'PUBLIC_CERT: Value must be a valid public certificate that starts with "-----BEGIN CERTIFICATE-----\\n" and end with "\\n-----END CERTIFICATE-----"',
    )

    setEnvVariables(oldEnv)
  })
})
