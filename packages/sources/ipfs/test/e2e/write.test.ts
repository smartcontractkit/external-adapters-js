import { assertSuccess } from '@chainlink/ea-test-helpers'
import { AdapterRequest } from '@chainlink/types'
import { execute } from '../../src/endpoint/write'
import { makeConfig } from '../../src'
import mockOracleRewardsData from '../mock-data/mock-oracle-rewards-data.json'
import { CID } from '../../src/endpoint/read'

describe('execute', () => {
  const jobID = '1'
  const config = makeConfig()
  const mockEpoch0 = CID.parse('QmdJZkigqJfvjya9YQ5qW7mFdNHpxUUsSQFKPDjLrdFfg4')
  const mockEpoch1 = CID.parse('QmRmAK7teai1Mki1V2zNxmBLXnYVVeJ92DCuEotwHPa98a')

  describe('successful calls', () => {
    const requests = [
      {
        name: 'simple text',
        testData: { id: jobID, data: { data: 'some simple text' } },
      },
      {
        name: 'dag-cbor codec',
        testData: { id: jobID, data: { data: { name: 'my object', id: 123 }, codec: 'dag-cbor' } },
      },
      {
        name: 'dag-cbor codec with link',
        testData: {
          id: jobID,
          data: {
            data: {
              name: 'my object',
              id: 123,
              link: CID.parse('QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf'),
            },
            codec: 'dag-cbor',
          },
        },
      },
      {
        name: 'json codec',
        testData: { id: jobID, data: { data: { name: 'my object', id: 123 }, codec: 'json' } },
      },
      {
        name: 'json codec CID v1',
        testData: {
          id: jobID,
          data: { data: { name: 'my object', id: 123 }, codec: 'json', cidVersion: 1 },
        },
      },
      {
        name: 'dag',
        testData: { id: jobID, data: { data: { name: 'my object', id: 123 }, type: 'dag' } },
      },
      {
        name: 'json mockOracleRewardsData',
        testData: { id: jobID, data: { data: mockOracleRewardsData, codec: 'json' } },
      },
      {
        name: 'json mockOracleRewardsData epoch 1',
        testData: {
          id: jobID,
          data: { data: { ...mockOracleRewardsData, epoch: 1 }, codec: 'json' },
        },
      },
      {
        name: 'dag-cbor oracleRewardsDataByEpoch',
        testData: {
          id: jobID,
          data: {
            data: {
              latestEpoch: 0,
              dataByEpoch: {
                '0': mockEpoch0,
                '1': mockEpoch1,
              },
            },
            type: 'dag',
          },
        },
      },
    ]

    requests.forEach((req) => {
      it(`${req.name}`, async () => {
        const data = await execute(req.testData as AdapterRequest, {}, config)
        assertSuccess({ expected: 200, actual: data.statusCode }, data, jobID)
        expect(data).toMatchSnapshot()
      })
    })
  })
})
