import {
  TestAdapter,
  setEnvVariables,
} from '@chainlink/external-adapter-framework/util/testing-utils'
import * as nock from 'nock'
import { mockResponseSuccess } from './fixtures'

describe('execute', () => {
  let spy: jest.SpyInstance
  let testAdapter: TestAdapter
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))
    process.env.API_ENDPOINT = process.env.API_ENDPOINT ?? 'https://api-endpoint-placeholder.com'
    process.env.API_KEY = process.env.API_KEY ?? 'fake-api-key'
    process.env.SXT_TABLE_NAME = process.env.SXT_TABLE_NAME ?? 'ATTESTATIONS_TEST_WELLKNOWN'

    const mockDate = new Date('2001-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const adapter = (await import('../../src')).adapter
    adapter.rateLimiting = undefined
    testAdapter = await TestAdapter.startWithMockedCache(adapter, {})
  })

  afterAll(async () => {
    setEnvVariables(oldEnv)
    await testAdapter.api.close()
    nock.restore()
    nock.cleanAll()
    spy.mockRestore()
  })

  describe('total_reserve endpoint', () => {
    it('should return success', async () => {
      // Removed the outer data wrapper
      const data = {
        endpoint: 'total_reserve',
        biscuit_attestation:
          'EroBClAKDnN4dDpjYXBhYmlsaXR5CgpkcWxfc2VsZWN0Ch9pZG0uYXR0ZXN0YXRpb25zX3Rlc3Rfd2VsbGtub3duGAMiDwoNCIAIEgMYgQgSAxiCCBIkCAASIAVNtw3BJ2W1_jrrDJCAMpcmqXQNOGfxeJEeL8eGgfLtGkBu5Qw3OvorzOAiSvcL9eNHDxoNytnu7fLFEzBvRyTHH0GuITBJaZ-CKj2jYzs419dkSHdA5VkhIKVThgvGekULIiIKIKGwfsIV0Gdq7Hv7AdiajFlScY7o46jB05ctJDxBOnw9',
        biscuit_blockchains:
          'EqoBCkAKDnN4dDpjYXBhYmlsaXR5CgpkcWxfc2VsZWN0Cg9pZG0uYmxvY2tjaGFpbnMYAyIPCg0IgAgSAxiBCBIDGIIIEiQIABIgFywUne_QtPcz0pbyrOxHvwtLLWSZTwd-G63yt0N1AkAaQKuXu0MgcoQg_HoYWG7jZjgJuTMxfISjjlOm9AZXW7mHEzKcdZY1of46f2UV0Hkov8nnXQFmWGK40vsfUHgT5AwiIgogTSZHcD8H7gPuJRC6-vuov3gO7uw3GBekA4ZtmWb-3u0=',
        chain_id: '43113',
        asset_contract_address: '0xFa11d66488D1C29d36ef39426938B949822e3FBd',
        token_contract_address: '0x7fe755a1dc20eC83Af545bc355ad7a9564805fA9',
        namespace: 'IDM',
      }

      mockResponseSuccess()
      const response = await testAdapter.request(data)
      console.log('Response:', response.json())
      expect(response.statusCode).toBe(200)
      expect(response.json()).toMatchSnapshot()
    })

    it('should return error when required parameters are missing', async () => {
      const data = {
        endpoint: 'total_reserve',
        chain_id: '43113',
        namespace: 'IDM',
        // Missing other required parameters
      }

      const response = await testAdapter.request(data)
      expect(response.statusCode).toBe(400)
      expect(response.json()).toMatchSnapshot()
    })
  })
})
