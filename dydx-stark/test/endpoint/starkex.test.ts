import { assert } from 'chai'
import { getKeyPair, requireNormalizedPrice } from '../../src/endpoint/starkex'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import { AdapterError } from '@chainlink/external-adapter'

type KeyPairTest = {
  name: string
  testData: {
    privateKey: string
    starkMessage: string
    expected: string
  }
}

type PriceNormalizationTest = {
  name: string
  testData: {
    price: number | string
    expected: undefined | string
    error: boolean
  }
}

describe('starkex', () => {
  context('getKeyPair', () => {
    const tests: KeyPairTest[] = [
      {
        name: 'Test key derivation #1',
        testData: {
          privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
          starkMessage: 'StarkKeyDerivation',
          expected: '0x1895a6a77ae14e7987b9cb51329a5adfb17bd8e7c638f92d6892d76e51cebcf',
        },
      },
    ]

    tests.forEach((t) => {
      it(`${t.name}`, async () => {
        const keyPair = await getKeyPair(t.testData.privateKey, t.testData.starkMessage)
        const pk = starkwareCrypto.getStarkPublicKey(keyPair)
        const pkNormalized = '0x' + pk.substr(3)
        assert.equal(pkNormalized, t.testData.expected)
      })
    })
  })

  context('requireNormalizedPrice', () => {
    const tests: PriceNormalizationTest[] = [
      {
        name: 'price number (zero)',
        testData: {
          price: 0,
          expected: '0',
          error: false,
        },
      },
      {
        name: 'price string (zero)',
        testData: {
          price: '0',
          expected: '0',
          error: false,
        },
      },
      {
        name: 'price number (no decimals)',
        testData: {
          price: 11512,
          expected: '11512000000000000000000',
          error: false,
        },
      },
      {
        name: 'price string (no decimals)',
        testData: {
          price: '11512',
          expected: '11512000000000000000000',
          error: false,
        },
      },
      {
        name: 'price number (decimals)',
        testData: {
          price: 11512.34,
          expected: '11512340000000000000000',
          error: false,
        },
      },
      {
        name: 'price string (decimals)',
        testData: {
          price: '11512.34',
          expected: '11512340000000000000000',
          error: false,
        },
      },
      {
        name: 'price string (no decimals) #2',
        testData: {
          price: '1151234',
          expected: '1151234000000000000000000',
          error: false,
        },
      },
      {
        name: 'Error: price number negative',
        testData: {
          price: -1151234,
          expected: undefined,
          error: true,
        },
      },
      {
        name: 'Error: price string negative',
        testData: {
          price: '-1151234',
          expected: undefined,
          error: true,
        },
      },
      {
        name: 'price number max safe number',
        testData: {
          price: Number.MAX_SAFE_INTEGER,
          expected: '9007199254740991000000000000000000',
          error: false,
        },
      },
      {
        name: 'Error: price number over max safe number',
        testData: {
          price: Number.MAX_SAFE_INTEGER + 1,
          expected: undefined,
          error: true,
        },
      },
      {
        name: 'price string over max safe number',
        testData: {
          price: '9007199254740999',
          expected: '9007199254740999000000000000000000',
          error: false,
        },
      },
      {
        name: 'price number with 18 decimals',
        testData: {
          price: 0.000000000000000001,
          expected: '1',
          error: false,
        },
      },
      {
        name: 'price string with 18 decimals',
        testData: {
          price: '0.000000000000000001',
          expected: '1',
          error: false,
        },
      },
      {
        name: 'Error: price number with more than 18 decimals',
        testData: {
          price: 0.0000000000000000001,
          expected: undefined,
          error: true,
        },
      },
      {
        name: 'Error: price string with more than 18 decimals',
        testData: {
          price: '0.0000000000000000001',
          expected: undefined,
          error: true,
        },
      },
    ]

    tests.forEach((t) => {
      it(`${t.name}`, async () => {
        try {
          const normalizedPrice = requireNormalizedPrice('1', t.testData.price)
          assert.equal(normalizedPrice, t.testData.expected)
        } catch (err) {
          assert.isTrue(err instanceof AdapterError)
          assert.isTrue(t.testData.error)
        }
      })
    })
  })
})
