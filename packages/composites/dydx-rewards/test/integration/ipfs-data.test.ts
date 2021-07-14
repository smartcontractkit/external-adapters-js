import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import { CID } from 'ipfs'
import { OracleRewardsDataByEpoch, OracleRewardsData, storeJsonTree } from '../../src/ipfs-data'
import mockRewards from '../mock-data/rewards.json'

export const EXPECTED_MOCK_CID = 'bafkreigx6x553cdksm5gj2hh2fkhs2csjnmnny3zxp3tcyzevfj3f3ekli'

describe('ipfs data', () => {
  const ipfs = IPFS_Adapter.makeExecute()

  it('should encode/decode IPFS data into interface', async () => {
    // Quick test to make rewards data with links, write them to IPFS,
    // then read the same data and follow the links.
    // Should throw an error if anything doesn't work
    const cidVersion = 1
    const address = '0xE4dDb4233513498b5aa79B98bEA473b01b101a67'

    const writeData: OracleRewardsData = {
      epoch: 123,
      tradeFeesPaid: {
        [address]: 123,
      },
      averageOpenInterest: {
        [address]: 123,
      },
      quoteScore: {
        [address]: 123,
      },
    }

    const writeParams = {
      id: '1',
      data: { method: 'write', data: writeData, codec: 'json', cidVersion },
    }
    const writeResult = await ipfs(writeParams)
    const writeCid = new CID(writeResult.result)

    const writeData2: OracleRewardsDataByEpoch = {
      latestEpoch: 123,
      dataByEpoch: {
        123: writeCid,
      },
    }

    const writeParams2 = {
      id: '1',
      data: { method: 'write', data: writeData2, type: 'dag', cidVersion },
    }
    const writeResult2 = await ipfs(writeParams2)

    const readParams = { id: '1', data: { method: 'read', cid: writeResult2.result, type: 'dag' } }
    const readResult = await ipfs(readParams)
    const result = readResult.result as OracleRewardsDataByEpoch

    const readParams2 = {
      id: '1',
      data: { method: 'read', cid: result.dataByEpoch[123].toV1(), codec: 'json' },
    }
    const readResult2 = await ipfs(readParams2)
    const finalResponse = readResult2.result as OracleRewardsData

    expect(finalResponse.epoch).toEqual(writeData.epoch)
  })

  it('should get correct CID from rewards data', async () => {
    const result = await storeJsonTree('1', ipfs, mockRewards)
    expect(result).toEqual(EXPECTED_MOCK_CID)
  })
})
