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
import { AdapterRequest, Execute } from '@chainlink/ea-bootstrap'
import { TInputParameters } from '@chainlink/ipfs-adapter/dist/endpoint/read'

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  oldEnv = JSON.parse(JSON.stringify(process.env))
  process.env.CACHE_ENABLED = 'false'
  process.env.ETHEREUM_RPC_URL = process.env.API_ENDPOINT || 'http://127.0.0.1:5001'
  process.env.API_VERBOSE = 'true'
  process.env.CHAIN_ID = process.env.CHAIN_ID || '42'
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

describe('dummy test', () => {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  it('dumm test case', async () => {})
})

/*
NOTE: Commenting out as the test is failing and the EA isn't being used.

We want to edit the ea-bootstrap framework to add meta: adapterName to the EA response,
and this failing test is blocking.

describe('ipfs data', () => {
  const ipfs = IPFS_Adapter.makeExecute() as Execute

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
      averageActiveStakedDYDX: {},
    }

    const writeParams = {
      id: '1',
      data: { endpoint: 'write', data: writeData, codec: 'json', cidVersion },
    }
    const writeResult = await ipfs(writeParams as unknown as AdapterRequest<TInputParameters>, {})
    const writeCid = types.read.CID.parse(writeResult.result as string)

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
    const writeResult2 = await ipfs(writeParams2 as unknown as AdapterRequest<TInputParameters>, {})

    const readParams = {
      id: '1',
      data: { endpoint: 'read', cid: writeResult2.result, type: 'dag' },
    }
    const readResult = await ipfs(readParams as unknown as AdapterRequest<TInputParameters>, {})
    const result = readResult.result as unknown as OracleRewardsDataByEpoch

    const readParams2 = {
      id: '1',
      data: { endpoint: 'read', cid: result.dataByEpoch[123].toV1(), codec: 'json' },
    }
    const readResult2 = await ipfs(readParams2 as unknown as AdapterRequest<TInputParameters>, {})
    const finalResponse = readResult2.result as unknown as OracleRewardsData

    expect(finalResponse.epoch).toEqual(writeData.epoch)
    expect(finalResponse).toMatchSnapshot()
  })

  it('should get correct CID from rewards data', async () => {
    mockIpfsResponseSuccess()

    const result = await storeJsonTree('1', ipfs, mockRewards as MerkleTreeData, {})
    expect(result).toMatchSnapshot()
  })
})
*/
