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
              result: [],
            },
          },
        },
        {
          name: 'unknown endpoint',
          testData: {
            id: jobID,
            data: {
              endpoint: 'not_real',
              result: [
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
              result: [
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
              result: [
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
              result: [
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
              result: [
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
              result: [
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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
                result: [
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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

  ethereum_testnet: (execute) => {
    describe('it should support ethereum testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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

  bitcoin_cash_testnet: (execute) => {
    describe('it should support bitcoin cash testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'BCH testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'bch',
                    chain: 'testnet',
                    address: 'muLqdHvyvbbB9oz4xnWotEuGVVeJtQZQxx',
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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

  bitcoin_sv_testnet: (execute) => {
    describe('it should support bitcoin sv testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'BTC SV testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'btsv',
                    chain: 'testnet',
                    address: 'qzlqpln4k995wsjlhl9dcw6kacwv06ka6580wavplr',
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
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

  litecoin_testnet: (execute) => {
    describe('it should support litecoin testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'LTC testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'ltc',
                    chain: 'testnet',
                    address: '2N2PJEucf6QY2kNFuJ4chQEBoyZWszRQE16',
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
        const numAddr = request?.testData?.data?.result.length
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
                result: [
                  {
                    coin: 'zec',
                    chain: 'mainnet',
                    address: 't1VShHAhsQc5RVndQLyM1ZbQXLHKd35GkG1',
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

  zcash_testnet: (execute) => {
    describe('it should support zcash testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ZEC testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'zec',
                    chain: 'testnet',
                    address: 'tmA64veBVeGVe53MjK2AAAdRo2S4MAqs2oU',
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

  doge_mainnet: (execute) => {
    describe('it should support doge mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'DOGE mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'doge',
                    chain: 'mainnet',
                    address: 'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
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

  doge_testnet: (execute) => {
    describe('it should support doge testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'DOGE testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'doge',
                    chain: 'testnet',
                    address: '2MtF65ZhrkqsHsNoFtA91e1AdveqXLMvS5M',
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

  zilliqa_mainnet: (execute) => {
    describe('it should support zilliqa mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ZIL mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'zil',
                    chain: 'mainnet',
                    address: 'zil16cgczanfw3ml5w5rutg7pyrncdx6ue4xcgt6gg',
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

  zilliqa_testnet: (execute) => {
    describe('it should support zilliqa testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ZIL testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'zil',
                    chain: 'testnet',
                    address: 'zil1qwzy0kc7p5gg4xn44d4ysfj9r5p49ydsygdxu4',
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

  dash_mainnet: (execute) => {
    describe('it should support dash mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'DOGE mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'dash',
                    chain: 'mainnet',
                    address: 'Xo2w6T1PjgaZ4PHLcoceueAQZifdDQ5ViD',
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

  dash_testnet: (execute) => {
    describe('it should support dash testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'DOGE testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'dash',
                    chain: 'testnet',
                    address: 'yLegnSEA83TTfo67XXLaszLUcxYQCrLjwH',
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

  ethereum_classic_mainnet: (execute) => {
    describe('it should support ethereum_classic mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ETC mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'etc',
                    chain: 'mainnet',
                    address: '0xd6054746a43e3a5c47a18796dc47437574127561',
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

  ethereum_classic_testnet: (execute) => {
    describe('it should support ethereum_classic testnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'ETC testnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'etc',
                    chain: 'testnet',
                    address: '0xDf7D7e053933b5cC24372f878c90E62dADAD5d42',
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

  groestlcoin_mainnet: (execute) => {
    describe('it should support groestlcoin mainnet', () => {
      const jobID = '1'

      const assertions = (request: any, response: any) => {
        const numAddr = request?.testData?.data?.result.length
        assert.isAbove(Number(response.data.result.length), 0)
        assert.isAbove(Number(response.result.length), 0)
        assert.equal(Number(response.data.result.length), numAddr)
        assert.equal(Number(response.result.length), numAddr)
      }

      successes(
        [
          {
            name: 'GRS mainnet',
            testData: {
              id: '1',
              data: {
                endpoint: 'balance',
                result: [
                  {
                    coin: 'grs',
                    chain: 'mainnet',
                    address: 'Fai7L9MJHa58NBe4RS4s4foXmBeMyN6N7a',
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

type Network =
  | 'bitcoin_mainnet'
  | 'bitcoin_testnet'
  | 'ethereum_mainnet'
  | 'ethereum_testnet'
  | 'bitcoin_cash_mainnet'
  | 'bitcoin_cash_testnet'
  | 'bitcoin_sv_mainnet'
  | 'bitcoin_sv_testnet'
  | 'ethereum_classic_mainnet'
  | 'ethereum_classic_testnet'
  | 'litecoin_mainnet'
  | 'litecoin_testnet'
  | 'zcash_mainnet'
  | 'zcash_testnet'
  | 'zilliqa_mainnet'
  | 'zilliqa_testnet'
  | 'doge_mainnet'
  | 'doge_testnet'
  | 'dash_mainnet'
  | 'dash_testnet'
  | 'groestlcoin_mainnet'

export function shouldBehaveLikeBalanceAdapter(execute: Execute, networks: Network[]) {
  base(execute)

  for (const network of networks) {
    const extension = extensions[network]
    if (extension) extension(execute)
  }
}
