import {
  addAdapterToConfig,
  ReferenceContractConfig,
  fetchConfigFromUrl,
  parseConfig,
  removeAdapterFromFeed,
  setFluxConfig,
  convertConfigToK6Payload,
  K6Payload,
} from './ReferenceContractConfig'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'

const exampleFeed = [
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'TEST / THIS',
    contractVersion: 4,
    data: {
      from: 'TEST',
      to: 'THIS',
    },
    nodes: [
      {
        name: 'nodeName',
        address: '0x0000000000000000000000000000000000000000',
        dataProviders: ['adapterName1', 'adapterName2'],
      },
      {
        name: 'nodeName2',
        address: '0x0000000000000000000000000000000000000002',
        dataProviders: ['adapterName1'],
      },
    ],
    precision: 18,
    deviationThreshold: 2,
    symbol: 'Ξ',
    path: 'test-this',
    status: 'live',
  },
  {
    address: '0x0000000000000000000000000000000000000000',
    name: 'TEST2 / THIS2',
    contractVersion: 4,
    data: {
      from: 'TEST2',
      to: 'THIS2',
    },
    nodes: [
      {
        name: 'nodeName',
        address: '0x0000000000000000000000000000000000000000',
        dataProviders: ['adapterName1', 'adapterName2'],
      },
      {
        name: 'nodeName2',
        address: '0x0000000000000000000000000000000000000002',
        dataProviders: ['adapterName2'],
      },
    ],
    precision: 18,
    deviationThreshold: 2,
    symbol: 'Ξ',
    path: 'test-this',
    status: 'live',
  },
  {
    address: '0x0000000000000000000000000000000000000003',
    name: 'TEST3 / THIS3',
    contractVersion: 4,
    data: {
      from: 'TEST3',
      to: 'THIS3',
    },
    nodes: [
      {
        name: 'nodeName',
        address: '0x0000000000000000000000000000000000000003',
        dataProviders: ['adapterName3'],
      },
    ],
    precision: 18,
    deviationThreshold: 2,
    symbol: 'Ξ',
    path: 'test-this',
    status: 'live',
  },
]

let reqMock: MockAdapter
const testUrl = 'http://blackhole.com'

beforeEach(() => {
  reqMock = new MockAdapter(axios)
})

afterEach(() => {
  reqMock.restore()
})

describe('flux emulator config editing', () => {
  it('should parse a feed', async () => {
    expect(parseConfig(exampleFeed)).toMatchSnapshot()
  })

  it('should add an adpater to a feed', async () => {
    let config: ReferenceContractConfig[] = addAdapterToConfig(
      'adapterName2',
      'ea-adapterName2',
      parseConfig(exampleFeed),
      [],
    )
    // verify we can add one that doesn't exist
    expect(config[0].nodes[0].dataProviders[0]).toMatch('ea-adapterName2')
    expect(config).toMatchSnapshot()

    // verify adding the same one again doesn't cause duplication
    config = addAdapterToConfig('adapterName2', 'ea-adapterName2', parseConfig(exampleFeed), config)
    expect(config).toMatchSnapshot()

    // verify adding a second one works correctly
    config = addAdapterToConfig('adapterName1', 'ea-adapterName1', parseConfig(exampleFeed), config)
    expect(config).toMatchSnapshot()
  })

  it('should remove an adapter from a feed', async () => {
    let config: ReferenceContractConfig[] = removeAdapterFromFeed(
      'adapterName1',
      parseConfig(exampleFeed),
    )
    expect(config[0].nodes[0].dataProviders.length).toEqual(1)
    expect(config).toMatchSnapshot()

    // verify removing of a node and config
    config = removeAdapterFromFeed('adapterName3', config)
    expect(config.length).toEqual(2)
    expect(config).toMatchSnapshot()

    // verify removing all adapters from the feed
    config = removeAdapterFromFeed('adapterName2', config)
    expect(config.length).toEqual(0)
    expect(config).toMatchSnapshot()
  })

  it('should succeed when it retrieves a valid configuration', async () => {
    reqMock.onGet(testUrl).reply(200, [
      {
        address: '0x0000000000000000000000000000000000000000',
        contractVersion: 3,
        name: 'LINK / USD',
        data: {
          from: 'LINK',
          to: 'USD',
        },
        precision: 8,
        deviationThreshold: 0.5,
        nodes: [],
      },
    ])
    const feedConfig = await fetchConfigFromUrl(testUrl).toPromise()

    expect(feedConfig?.configs).toBeDefined()
    expect(feedConfig?.configs?.length).toEqual(1)
  })

  it('should fail if the feed request is unsuccessful', async () => {
    expect.assertions(1)
    reqMock.onGet(testUrl).reply(500)

    const feedConfig = await fetchConfigFromUrl(testUrl).toPromise()

    expect(feedConfig?.configs).toBeUndefined()
  })

  it('should succeed if it posts a config and the server responds 200', async () => {
    reqMock.onPost(testUrl).reply(200, '')
    await setFluxConfig(parseConfig(exampleFeed), testUrl).toPromise()
  })

  it('should fail if the post of the config is unsuccessful', async () => {
    expect.assertions(1)
    reqMock.onPost(testUrl).reply(500)

    try {
      await setFluxConfig(parseConfig(exampleFeed), testUrl).toPromise()
      expect('').toEqual('We successfully posted a config when we should not have')
    } catch (err) {
      expect(err).toMatchSnapshot()
    }
  })

  it('should convert the config to a k6 payload', async () => {
    const k6Payload: K6Payload[] = convertConfigToK6Payload(parseConfig(exampleFeed))
    expect(k6Payload).toMatchSnapshot()
  })
})
