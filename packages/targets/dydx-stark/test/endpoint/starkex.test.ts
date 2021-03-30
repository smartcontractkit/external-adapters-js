import { assert } from 'chai'
import * as starkwareCrypto from '@authereum/starkware-crypto'
import { AdapterError } from '@chainlink/ea-bootstrap'
import {
  PriceDataPoint,
  getKeyPair,
  requireNormalizedPrice,
  getPricePayload,
} from '../../src/endpoint/starkex'

describe('starkex', () => {
  context('getKeyPair', () => {
    type KeyPairTest = {
      name: string
      testData: {
        privateKey: string
        starkMessage: string
        expected: string
      }
    }

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
    type PriceNormalizationTest = {
      name: string
      testData: {
        price: number | string
        expected: undefined | string
        error: boolean
      }
    }

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
          expected: '9007199254740992000000000000000000',
          error: false,
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
        name: 'price number many decimals',
        testData: {
          price: 0.1234567899999999,
          expected: '123456789999999900',
          error: false,
        },
      },
      {
        name: 'price number many decimals #2',
        testData: {
          price: 12.34567899999999,
          expected: '12345678999999990000',
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
        name: 'price number with 18 decimals #2',
        testData: {
          price: 1.000000000000000001,
          expected: '1000000000000000000', // TODO: can we detect precision loss and throw?
          error: false,
        },
      },
      {
        name: 'price number scientific notation',
        testData: {
          price: 2.32323300000012e-12,
          expected: '2323233',
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
        name: 'price string with 18 decimals #2',
        testData: {
          price: '1.000000000000000001',
          expected: '1000000000000000001',
          error: false,
        },
      },
      {
        name: 'price number with more than 18 decimals',
        testData: {
          price: 0.0000000000000000001,
          expected: '0', // TODO: can we detect precision loss and throw?
          error: false,
        },
      },
      {
        name: 'Error: price string with more than 18 decimals',
        testData: {
          price: '0.0000000000000000001',
          expected: '0', // TODO: can we detect precision loss and throw?
          error: false,
        },
      },
    ]

    tests.forEach((t) => {
      it(`${t.name}`, async () => {
        try {
          const normalizedPrice = requireNormalizedPrice(t.testData.price)
          assert.equal(normalizedPrice, t.testData.expected)
          assert.isFalse(t.testData.error)
        } catch (err) {
          if (!(err instanceof AdapterError)) throw err
          assert.isTrue(t.testData.error)
        }
      })
    })
  })

  context('getPricePayload', () => {
    type PricePayloadTest = {
      name: string
      testData: {
        privateKey: string
        starkMessage: string
        data: PriceDataPoint
        expected: {
          signatureR: string
          signatureS: string
          starkKey: string
        }
      }
    }

    const tests: PricePayloadTest[] = [
      {
        name: 'signature construction #1',
        testData: {
          privateKey: '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
          starkMessage: 'StarkKeyDerivation',
          data: {
            oracleName: 'Maker',
            assetName: 'BTCUSD',
            timestamp: 1577836800,
            price: requireNormalizedPrice('11512.34'),
          },
          expected: {
            signatureR: '0x6a7a118a6fa508c4f0eb77ea0efbc8d48a64d4a570d93f5c61cd886877cb920',
            signatureS: '0x6de9006a7bbf610d583d514951c98d15b1a0f6c78846986491d2c8ca049fd55',
            starkKey: '0x1895a6a77ae14e7987b9cb51329a5adfb17bd8e7c638f92d6892d76e51cebcf',
          },
        },
      },
    ]

    tests.forEach((t) => {
      it(`${t.name}`, async () => {
        const payload = await getPricePayload(
          t.testData.privateKey,
          t.testData.starkMessage,
          t.testData.data,
        )
        assert.equal(payload.starkKey, t.testData.expected.starkKey)
        assert.equal(payload.signatureR, t.testData.expected.signatureR)
        assert.equal(payload.signatureS, t.testData.expected.signatureS)
      })
    })
  })
})
