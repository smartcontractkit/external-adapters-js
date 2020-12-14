import { assert } from 'chai'
import { successes, validationErrors, serverErrors } from '../helpers'
import { Execute } from '@chainlink/types'

function base(execute: Execute) {
  describe('it should behave like a balance adapter', () => {
    const jobID = '1'
    validationErrors(
      [
        { name: 'empty body', testData: {} },
        {
          name: 'empty addresses',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              dataPath: 'addresses',
              addresses: [],
            },
          },
        },
        {
          name: 'unknown endpoint',
          testData: {
            id: jobID,
            data: {
              endpoint: 'not_real',
              dataPath: 'addresses',
              addresses: [
                {
                  address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
                  coin: 'btc',
                  chain: 'mainnet',
                },
              ],
            },
          },
        },
        {
          name: 'invalid dataPath',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              dataPath: 'not_real',
              addresses: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                  coin: 'btc',
                  chain: 'mainnet',
                },
              ],
            },
          },
        },
      ],
      execute,
    )

    serverErrors(
      [
        {
          name: 'invalid address',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              dataPath: 'addresses',
              addresses: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                  coin: 'btc',
                  chain: 'mainnet',
                },
              ],
            },
          },
        },
        {
          name: 'invalid confirmations',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              confirmations: null,
              dataPath: 'addresses',
              addresses: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                  coin: 'btc',
                  chain: 'mainnet',
                },
              ],
            },
          },
        },
        {
          name: 'invalid chain',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              dataPath: 'addresses',
              addresses: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                  coin: 'btc',
                  chain: 'not_real',
                },
              ],
            },
          },
        },
        {
          name: 'invalid coin',
          testData: {
            id: jobID,
            data: {
              endpoint: 'balance',
              dataPath: 'addresses',
              addresses: [
                {
                  address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                  coin: 'not_real',
                  chain: 'mainnet',
                },
              ],
            },
          },
        },
      ],
      execute,
    )
  })
}

const extensions: { [network: string]: (execute: Execute) => void } = {
  bitcoin_mainnet: (execute) => {
    describe('it should support bitcoin mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'id not supplied',
            testData: {
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                  {
                    address: '3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                ],
              },
            },
          },
          {
            name: 'BTC mainnet',
            testData: {
              id: jobID,
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    address: '3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                  {
                    address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                  {
                    address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                  {
                    address: '3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                  {
                    address: '35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR',
                    coin: 'btc',
                    chain: 'mainnet',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  bitcoin_testnet: (execute) => {
    describe('it should support bitcoin testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'BTC testnet',
            testData: {
              id: jobID,
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    address: 'n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF',
                    chain: 'testnet',
                    coin: 'btc',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  ethereum_mainnet: (execute) => {
    describe('it should support ethereum mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ETH testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'eth',
                    chain: 'mainnet',
                    address: '0x664EEe181C2d65619F367c5AaC7d42F571B61177',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  ethereum_rinkeby: (execute) => {
    describe('it should support ethereum rinkeby testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ETH testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'eth',
                    chain: 'testnet',
                    address: '0x664EEe181C2d65619F367c5AaC7d42F571B61177',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  bitcoin_cash_mainnet: (execute) => {
    describe('it should support bitcoin cash mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'BCH mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'bch',
                    chain: 'mainnet',
                    address: 'qp3wjpa3tjlj042z2wv7hahsldgwhwy0rq9sywjpyy',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  bitcoin_sv_mainnet: (execute) => {
    describe('it should support bitcoin sv mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'BTC SV mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'btsv',
                    chain: 'mainnet',
                    address: '1Hw2k2iuhzcrA1Rvm6EuCoiCSp7Sc6mdrv',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  litecoin_mainnet: (execute) => {
    describe('it should support litecoin mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'LTC mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'ltc',
                    chain: 'mainnet',
                    address: 'M8T1B2Z97gVdvmfkQcAtYbEepune1tzGua',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },

  zcash_mainnet: (execute) => {
    describe('it should support zcash mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.addresses.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ZEC mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                dataPath: 'addresses',
                addresses: [
                  {
                    coin: 'zec',
                    chain: 'mainnet',
                    address:
                      'zs1z7rejlpsa98s2rrrfkwmaxu53e4ue0ulcrw0h4x5g8jl04tak0d3mm47vdtahatqrlkngh9sly',
                  },
                ],
              },
            },
          },
        ],
        execute,
        assertions,
      )
    })
  },
}

type Network = 'bitcoin_mainnet' | 'bitcoin_testnet' | 'ethereum_mainnet' | 'ethereum_rinkeby'

export function shouldBehaveLikeBalanceAdapter(execute: Execute, networks: Network[]) {
  base(execute)

  for (const network of networks) {
    const extension = extensions[network]
    if (extension) extension(execute)
  }
}
