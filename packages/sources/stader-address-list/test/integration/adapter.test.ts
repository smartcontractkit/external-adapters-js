import request, { SuperTest, Test } from 'supertest'
import { createAdapter } from './setup'
import { expose, ServerInstance } from '@chainlink/external-adapter-framework'
import { AddressInfo } from 'net'
import { ValidatorRegistryResponse } from '../../src/utils'

const mockNodeRegistryAddresses: Record<number, string> = {
  1: '0xfb2E1e5854Ba5De7e4611E2352cfe85d91106291',
  2: '0x50297e640b62281b6Dac0d5Aa91848Fb028357Ea',
}

const mockValidatorAddresses: Record<number, ValidatorRegistryResponse[]> = {
  1: [
    [
      4,
      '0x82aec070f2c77f13ef33647c6b6df6bfcaa1cb3607e4530801a753099c4a523005ff701ccb296da9d4488ddd5ac531c3',
      '0xa81f0e3ef17847e61e21a6ac8e2276a7af54df53c2573f653a9a5815f4b81101b1b9fd9607e03c052a39464c524e22ed0670af1ea8b5a0e5a3cfbe3e0caae491a2ab763b61220142b3879f95972f251e9de0efca8f5adeb47b8d68183ac3bc0c',
      '0x9469523ff1410d4417e2da95c6a8b86aa697056425818ce1ba1e631f4e6666326a1567dbaf2fd452337d3def0ec2898a002aba36f8e0bd9964e85b5a3a377caa8555d9f15a8925c594bc422fa2b7aafc27d747f33375151b5ab215c4ad274f7e',
      '0x05ef9b38092ebd70523275f95027709aeac9759c',
      2,
      4000000000000000000,
      1679924532,
      0,
    ],
    [
      4,
      '0x893b284977dbd07276d5e0f3761dddad88aa4e1ed8575541c79a5bb12fdc841dcbe9ecfb424ee7744db4f5e297c0eaf4',
      '0xb2ab614bfebff2ac7ad9ed178b0aa40555539e5106d27cc3d3ad60d9a14a3e2ff75371212a2a205115f991eab25bb2c902b65632b633ca48ba5838e0223331a3c2246cca3fe832eb988de302a10eceffc98a3ad445957bc26bcfc54919cdc727',
      '0x8a10dbc42bb27e0be5d26579e29cddab2eadc1a493879bbc47b78575d17aa6b231bc874d5408cc3408db79034c03c2eb175fbbba0b9cdc6bbf81701aa3e39c9eda2f1293d75e5cbeef704967626748141cdfcc6051cc24e2714595a27606efcf',
      '0xf43d5b8aa1ca682f6fb804899117bfce3a67dbd1',
      2,
      4000000000000000000,
      1679934732,
      0,
    ],
  ],
  2: [
    [
      3,
      '0x999d1e56148505251d7a7682996f1d1a7e5ecf4657dcfa9d6d71b97dc1d8755e1cb4451f57f370201c882126e97ca35e',
      '0x86f71619e07b4423abf7ac8122138bc13fa1271b6fbb3afe6e2bcedc84655683e7a0486c00764c21ceb1b145f2c65d180e0356839c2587edaf10f43368744794fb9e74d4d728b62de3cc145d955ad920281b1176799b2496772aa9552dfab120',
      '0x86c2cd91227ac34fd1a6edde0fd20dbb4ce625f3e0eb47c8f8d0eb62588ddf54255044efb11e0a1177bbbc52ea7d499716b2bb59ae1fde016d7c690fec142649d89215b07d71a3d0d6463042addb9fc29ae35b62434ca9e49c84e3544a3c9b5c',
      '0xe731fd3b95136dac85cfd0c3164707a9e10026f1',
      2,
      4000000000000000000,
      1679934732,
      0,
    ],
    [
      6,
      '0x89cbed0fe0b742c5ad8e9068650dfd6789aa64f2a8e264caf1cbb9e3a50c6eb1ed6b08f2075a384b1666c8e073a0e51d',
      '0x96e61684831b7d18a36ae491f578d1ee20105d0c84704a179b22764b82c80e7eb03ff1bdd2d9d7c82dec679f1f5871e20580c7b8a31ac54f1ed5c7785a41f69e2a6de08d752797c8dec32a3dc37c722f01cc24e6eaf2bb6adc6203e18f97bd48',
      '0xaaec961158b897cb1e2770db067f7e9c564da7c45ab14710b3b5ee4a8fdb82456061517e2ed86b23e2afbd8da3d5fe650d62eaf96a47714cd2bdd138dba6fd9b2425356e0ce625ce6933ec39520b50c90f5caa2fc556687b973248c406f180da',
      '0x2f32b2ed50d03bcf925cd32d870a12d1e33556aa',
      2,
      4000000000000000000,
      1679934732,
      0,
    ],
  ],
}

const mockSocialPoolAddresses: Record<number, string> = {
  1: '0xEB31F35afF9036bcDEC75604D9492aC9c446127F',
  2: '0x481be4fACe9E50bae3a716801F3c8799020325a0',
}

const mockElRewardAddresses: string[] = [
  '0x0D086a2FB3be4251221066a491645273C61A45Fc',
  '0x6D75F292A22fCE61d64448789549ae735eFEC398',
]

jest.mock('ethers', () => {
  const actualModule = jest.requireActual('ethers')
  let getAllActiveValidatorsCallCount = 1
  return {
    ...actualModule,
    ethers: {
      ...actualModule.ethers,
      providers: {
        JsonRpcProvider: function () {
          return {
            getBlockNumber: jest.fn().mockReturnValue(1000),
          }
        },
      },
      Contract: function () {
        return {
          getNodeRegistry: jest.fn().mockImplementation((poolId) => {
            return mockNodeRegistryAddresses[poolId]
          }),
          getPoolIdArray: jest.fn().mockReturnValue([1, 2]),
          getAllActiveValidators: jest.fn().mockImplementation(() => {
            return mockValidatorAddresses[(getAllActiveValidatorsCallCount++ % 2) + 1]
          }),
          getSocializingPoolAddress: jest.fn().mockImplementation((poolId) => {
            return mockSocialPoolAddresses[poolId]
          }),
          getAllNodeELVaultAddress: jest.fn().mockImplementation(() => {
            return mockElRewardAddresses
          }),
          nextValidatorId: jest.fn().mockReturnValue(3),
          nextOperatorId: jest.fn().mockReturnValue(3),
          getPoolUtils: jest.fn().mockReturnValue('0x9bE5fd05529450c4ABA3c1525b82EF69Af9b3253'),
          getPermissionlessNodeRegistry: jest
            .fn()
            .mockReturnValue('0x28d5FdcE4db361e19FCA420C9b5141bC3DC6aE3B'),
          getStaderOracle: jest.fn().mockReturnValue('0xAAe724e44766aC7ccaA6f6aA95c8B1659F5FB44D'),
          getERReportableBlock: jest.fn().mockReturnValue(500),
        }
      },
    },
  }
})

describe('execute', () => {
  let fastify: ServerInstance | undefined
  let req: SuperTest<Test>
  let spy: jest.SpyInstance

  beforeAll(async () => {
    const mockDate = new Date('2022-01-01T11:11:11.111Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())
  })

  afterAll((done) => {
    spy.mockRestore()
    fastify?.close(done())
  })

  it('addresses should return success', async () => {
    const data = {
      data: { network: 'ethereum', chainId: 'goerli' },
    }
    process.env['RPC_URL'] = 'http://localhost:9091'
    process.env['BACKGROUND_EXECUTE_MS'] = '0'
    fastify = await expose(createAdapter())
    req = request(`http://localhost:${(fastify?.server.address() as AddressInfo).port}`)
    const mockDate = new Date('2022-08-01T07:14:54.909Z')
    spy = jest.spyOn(Date, 'now').mockReturnValue(mockDate.getTime())

    const response = await req
      .post('/')
      .send(data)
      .set('Accept', '*/*')
      .set('Content-Type', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
    expect(response.body).toMatchSnapshot()
  })
})
