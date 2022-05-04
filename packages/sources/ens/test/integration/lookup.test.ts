import { AdapterRequest } from '@chainlink/types'
import http from 'http'
import { AddressInfo } from 'net'
import nock from 'nock'
import request, { SuperTest, Test } from 'supertest'
import { server as startServer } from '../../src'

const mockSuccessInput = {
  mockInputEthTLD: 'mockInputEthTLD.eth'.toLowerCase(),
  mockInputNonEthTLD: 'mockInputNonEthTLD.test'.toLowerCase(),
  mockInputEthTLDSubdomain: 'subdomain.mockInputEthTLD.eth'.toLowerCase(),
  mockInputNonEthTLDSubdomain: 'subdomain.mockInputNonEthTLD.test'.toLowerCase(),
}

const mockFailInput = {
  mockInputNoTLD: 'mockInputNoTLD',
}

const toMockOutput = (input: string) => `0x0${input}`

const mockVariables = {
  rpcUrl: 'fake-ethereum-rpc-url',
  registrarContractAddress: 'fake-registrar-address',
  registryContractAddress: 'fake-registry-address',
  controllerContractAddress: 'fake-controller-address',
  resolverContractAddress: 'fake-resolver-address',
}

const mockRegistrarContract = {
  ownerOf: jest.fn().mockReturnValue('fake-registrar-ownerOf'),
  ens: jest.fn().mockReturnValue(mockVariables.registryContractAddress),
}

const mockRegistryContract = {
  owner: jest.fn().mockReturnValue('fake-registry-owner'),
}

const mockControllerContract = {}

const mockResolverContract = {
  interfaceImplementer: jest.fn().mockReturnValue(mockVariables.controllerContractAddress),
}

const mockNetworkProvider = {
  resolveName: jest.fn().mockImplementation((name: string) => {
    switch (name) {
      case 'eth':
        return mockVariables.registrarContractAddress
      case 'resolver.eth':
        return mockVariables.resolverContractAddress
      case mockSuccessInput.mockInputEthTLD:
        return toMockOutput(mockSuccessInput.mockInputEthTLD)
      case mockSuccessInput.mockInputNonEthTLD:
        return toMockOutput(mockSuccessInput.mockInputNonEthTLD)
      case mockSuccessInput.mockInputEthTLDSubdomain:
        return toMockOutput(mockSuccessInput.mockInputEthTLDSubdomain)
      case mockSuccessInput.mockInputNonEthTLDSubdomain:
        return toMockOutput(mockSuccessInput.mockInputNonEthTLDSubdomain)
      case mockFailInput.mockInputNoTLD:
        return toMockOutput(mockFailInput.mockInputNoTLD)
      default:
        break
    }
  }),
}

jest.mock('ethers', () => {
  const actualEthersLib = jest.requireActual('ethers')
  return {
    ...actualEthersLib,
    ethers: {
      ...actualEthersLib.ethers,
      utils: actualEthersLib.ethers.utils,
      providers: {
        JsonRpcProvider: jest.fn().mockImplementation(() => mockNetworkProvider),
      },
      Contract: jest.fn().mockImplementation((address: string) => {
        switch (address) {
          case mockVariables.registrarContractAddress:
            return mockRegistrarContract
          case mockVariables.registryContractAddress:
            return mockRegistryContract
          case mockVariables.controllerContractAddress:
            return mockControllerContract
          case mockVariables.resolverContractAddress:
            return mockResolverContract
          default:
            console.log('Mock address not found: ', address)
            break
        }
      }),
    },
  }
})

describe('execute', () => {
  const id = '1'
  let server: http.Server
  let req: SuperTest<Test>
  let oldEnv: NodeJS.ProcessEnv

  beforeAll(async () => {
    oldEnv = JSON.parse(JSON.stringify(process.env))

    process.env.CACHE_ENABLED = 'false'
    process.env.API_VERBOSE = 'true'
    process.env.RPC_URL = mockVariables.rpcUrl
    if (process.env.RECORD) {
      nock.recorder.rec()
    }
    server = await startServer()
    req = request(`localhost:${(server.address() as AddressInfo).port}`)
  })

  afterAll((done) => {
    process.env = oldEnv

    if (process.env.RECORD) {
      nock.recorder.play()
    }

    nock.restore()
    nock.cleanAll()
    nock.enableNetConnect()
    server.close(done)
  })

  describe('lookup endpoint', () => {
    it('should return success', async () => {
      for (const ensName of Object.values(mockSuccessInput)) {
        const data: AdapterRequest = {
          id,
          data: {
            ensName,
          },
        }
        const response = await req
          .post('/')
          .send(data)
          .set('Accept', '*/*')
          .set('Content-Type', 'application/json')
          .expect('Content-Type', /json/)
          .expect(200)
        expect(response.body).toMatchSnapshot()
      }
    })

    it('should fail when format is not valid', async () => {
      const data: AdapterRequest = {
        id,
        data: {
          ensName: mockFailInput.mockInputNoTLD,
        },
      }
      await req
        .post('/')
        .send(data)
        .set('Accept', '*/*')
        .set('Content-Type', 'application/json')
        .expect('Content-Type', /json/)
        .expect(400)
    })
  })
})
