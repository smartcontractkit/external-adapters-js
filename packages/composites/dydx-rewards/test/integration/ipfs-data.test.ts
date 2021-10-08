import * as IPFS_Adapter from '@chainlink/ipfs-adapter'
import { types } from '@chainlink/ipfs-adapter'
import {
  OracleRewardsDataByEpoch,
  OracleRewardsData,
  storeJsonTree,
  MerkleTreeData,
} from '../../src/ipfs-data'
import mockRewards from '../mock-data/rewards.json'
import nock from 'nock'
import { mockIpfsResponseSuccess } from './fixtures'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.RPC_URL = process.env.API_ENDPOINT || 'http://127.0.0.1:5001'
  process.env.API_VERBOSE = 'true'
  if (process.env.RECORD) {
    nock.recorder.rec()
  }
})

afterAll(() => {
  process.env = oldEnv
  if (process.env.RECORD) {
    nock.recorder.play()
  }

  nock.restore()
  nock.cleanAll()
  nock.enableNetConnect()
})

describe('ipfs data', () => {
  const ipfs = IPFS_Adapter.makeExecute()

  it('should encode/decode IPFS data into interface', async () => {
    mockIpfsResponseSuccess()

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
      openInterest: {
        [address]: 123,
      },
      quoteScore: {
        [address]: 123,
      },
    }

    const writeParams = {
      id: '1',
      data: { endpoint: 'write', data: writeData, codec: 'json', cidVersion },
    }
    const writeResult = await ipfs(writeParams, {})
    const writeCid = types.read.CID.parse(writeResult.result)

    const writeData2: OracleRewardsDataByEpoch = {
      latestEpoch: 123,
      dataByEpoch: {
        123: writeCid,
      },
    }

    const writeParams2 = {
      id: '1',
      data: { endpoint: 'write', data: writeData2, type: 'dag', cidVersion },
    }
    const writeResult2 = await ipfs(writeParams2, {})

    const readParams = {
      id: '1',
      data: { endpoint: 'read', cid: writeResult2.result, type: 'dag' },
    }
    const readResult = await ipfs(readParams, {})
    const result = readResult.result as OracleRewardsDataByEpoch

    const readParams2 = {
      id: '1',
      data: { endpoint: 'read', cid: result.dataByEpoch[123].toV1(), codec: 'json' },
    }
    const readResult2 = await ipfs(readParams2, {})
    const finalResponse = readResult2.result as OracleRewardsData

    expect(finalResponse.epoch).toEqual(writeData.epoch)
    expect(finalResponse).toMatchSnapshot()
  })

  it('should get correct CID from rewards data', async () => {
    mockIpfsResponseSuccess()

    const result = await storeJsonTree('1', ipfs, mockRewards as MerkleTreeData, {})
    expect(result).toMatchSnapshot()
  })
})
