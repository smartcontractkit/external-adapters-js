import {
  buildMockAttestationRow,
  mockExecute,
  TEST_AUDITOR_ADDRESS,
} from './fixtures'
import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'

const mockClient = {
  execute: jest.fn(),
}

jest.mock('@libsql/client', () => ({
  createClient: jest.fn(() => mockClient),
}))

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv
  let mockRow: Record<string, unknown>

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env['TURSO_DATABASE_URL'] = 'libsql://test-db.turso.io'
    process.env['TURSO_AUTH_TOKEN'] = 'test-auth-token'
    const mockDate = new Date('2022-05-10T16:09:27.193Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    // Build a mock row with a valid EIP-712 signature from the test wallet
    mockRow = await buildMockAttestationRow()

    const adapter = (await import('./../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {
      testAdapter: {} as TestAdapter<never>,
    })
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    spy.mockRestore()
  })

  describe('trust endpoint', () => {
    it('should return verified cumulative amount on success', async () => {
      mockClient.execute.mockResolvedValueOnce(mockExecute([mockRow]))

      const data = {
        chain_id: 11155111,
        auditor_address: TEST_AUDITOR_ADDRESS,
        fractional_contract_address: '0x2224E19fEe054E389e7e3dF4b5e83E3E2e4cDB30',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(200)
      expect(response.json().result).toBe(5954903980000)
      expect(response.json().data.result).toBe(5954903980000)
    })

    it('should return 502 when signature does not match auditor', async () => {
      mockClient.execute.mockResolvedValueOnce(mockExecute([mockRow]))

      const data = {
        chain_id: 11155111,
        auditor_address: '0x0000000000000000000000000000000000000001',
        fractional_contract_address: '0x2224E19fEe054E389e7e3dF4b5e83E3E2e4cDB30',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
      expect(response.json().errorMessage).toContain('Signature verification failed')
    })

    it('should return 502 when no attestation found', async () => {
      mockClient.execute.mockResolvedValueOnce(mockExecute([]))

      const data = {
        chain_id: 11155111,
        auditor_address: '0x0000000000000000000000000000000000000000',
        fractional_contract_address: '0x0000000000000000000000000000000000000000',
      }
      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(502)
    })
  })
})
