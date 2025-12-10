import { ethers } from 'ethers'
import nock from 'nock'

export type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
  jsonrpc: '2.0'
}

export type EtherFiRpcResponseConfig = {
  splitMainBalance: bigint
  strategyShares: bigint
  convertedBalance: bigint
  queuedShares?: bigint[][]
}

export type EtherFiRpcMockOptions = {
  onRequest?: (requests: JsonRpcPayload[]) => void
  onSharesToUnderlyingCall?: (data: string) => void
}

const splitMainInterface = new ethers.Interface([
  'function getETHBalance(address account) view returns (uint256)',
])
const eigenStrategyInterface = new ethers.Interface([
  'function shares(address user) view returns (uint256)',
  'function sharesToUnderlyingView(uint256 amountShares) view returns (uint256)',
])
const eigenPodManagerInterface = new ethers.Interface(
  require('../../src/config/EigenPodManager.json'),
)

export const ETHERFI_TEST_PARAMS = {
  splitMain: '0x2ed6c4b5da6378c7897ac67ba9e43102feb694ee',
  splitMainAccount: '0xf00baa0000000000000000000000000000000001',
  eigenStrategy: '0x93c4b944d05dfe6df7645a86cd2206016c51564d',
  eigenStrategyUser: '0x1ffab368bb0a2b55c643fbef847c881c6f7f5f01',
  eigenPodManager: '0x39052978723eb8d29c7ae967d0a95aebf71737a7',
} as const

const formatUint256 = (value: bigint) => ethers.toBeHex(value, 32)
const encodeQueuedWithdrawals = (shares: bigint[][]) =>
  eigenPodManagerInterface.encodeFunctionResult('getQueuedWithdrawals', [
    [
      {
        staker: '0x0000000000000000000000000000000000000000',
        delegatedTo: '0x0000000000000000000000000000000000000000',
        withdrawer: '0x0000000000000000000000000000000000000000',
        nonce: 0n,
        startBlock: 0,
        strategies: [],
        scaledShares: [],
      },
    ],
    shares,
  ])

const sumQueuedShares = (shares: bigint[][]) =>
  shares.reduce((outerAcc, subset) => {
    const subsetTotal = subset.reduce((innerAcc, current) => innerAcc + current, 0n)
    return outerAcc + subsetTotal
  }, 0n)

const createEtherFiRpcMock = (
  {
    splitMainBalance,
    strategyShares,
    convertedBalance,
    queuedShares = [],
  }: EtherFiRpcResponseConfig,
  { onRequest, onSharesToUnderlyingCall }: EtherFiRpcMockOptions = {},
): nock.Scope => {
  const splitMainCallData = splitMainInterface.encodeFunctionData('getETHBalance', [
    ETHERFI_TEST_PARAMS.splitMainAccount,
  ])
  const sharesCallData = eigenStrategyInterface.encodeFunctionData('shares', [
    ETHERFI_TEST_PARAMS.eigenStrategyUser,
  ])
  const totalShares = strategyShares + sumQueuedShares(queuedShares)
  const sharesToUnderlyingCallData = eigenStrategyInterface.encodeFunctionData(
    'sharesToUnderlyingView',
    [totalShares],
  )
  const queuedWithdrawalResult = encodeQueuedWithdrawals(queuedShares)

  const buildResponse = (request: JsonRpcPayload) => {
    const method = request.method
    if (method === 'eth_chainId') {
      return {
        jsonrpc: '2.0',
        id: request.id,
        result: '0x1',
      }
    }

    if (method === 'eth_call') {
      const target = request.params[0].to.toLowerCase()
      const data = request.params[0].data

      if (target === ETHERFI_TEST_PARAMS.splitMain.toLowerCase() && data === splitMainCallData) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: formatUint256(splitMainBalance),
        }
      }

      if (target === ETHERFI_TEST_PARAMS.eigenStrategy.toLowerCase() && data === sharesCallData) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: formatUint256(strategyShares),
        }
      }

      if (
        target === ETHERFI_TEST_PARAMS.eigenStrategy.toLowerCase() &&
        data === sharesToUnderlyingCallData
      ) {
        onSharesToUnderlyingCall?.(data)
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: formatUint256(convertedBalance),
        }
      }

      const eigenPodManagerCallData = eigenPodManagerInterface.encodeFunctionData(
        'getQueuedWithdrawals',
        [ETHERFI_TEST_PARAMS.eigenStrategyUser],
      )
      if (
        target === ETHERFI_TEST_PARAMS.eigenPodManager.toLowerCase() &&
        data === eigenPodManagerCallData
      ) {
        return {
          jsonrpc: '2.0',
          id: request.id,
          result: queuedWithdrawalResult,
        }
      }
    }

    return {
      jsonrpc: '2.0',
      id: request.id,
      error: { code: -32601, message: 'Method not found' },
    }
  }

  return nock('http://localhost-eth-mainnet:8080', {})
    .post('/', () => true)
    .reply(
      200,
      (_uri, requestBody: any) => {
        const requests = Array.isArray(requestBody) ? requestBody : [requestBody]
        const responses = requests.map((request: JsonRpcPayload) => buildResponse(request))
        onRequest?.(requests)
        return Array.isArray(requestBody) ? responses : responses[0]
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
}

export const ETHERFI_SUCCESS_NO_QUEUED_CONFIG: EtherFiRpcResponseConfig = {
  splitMainBalance: 1_000_000_000_000_000_000n,
  strategyShares: 250_000_000_000_000_000n,
  convertedBalance: 3_500_000_000_000_000_000n,
  queuedShares: [],
}

export const ETHERFI_SUCCESS_WITH_QUEUED_CONFIG: EtherFiRpcResponseConfig = {
  splitMainBalance: 0n,
  strategyShares: 50n,
  convertedBalance: 12_345n,
  queuedShares: [[5n, 10n], [2n]],
}

export const mockEtherFiSuccessNoQueued = (options?: EtherFiRpcMockOptions): nock.Scope =>
  createEtherFiRpcMock(ETHERFI_SUCCESS_NO_QUEUED_CONFIG, options)

export const mockEtherFiSuccessWithQueued = (options?: EtherFiRpcMockOptions): nock.Scope =>
  createEtherFiRpcMock(ETHERFI_SUCCESS_WITH_QUEUED_CONFIG, options)

export const mockETHMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x1',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            // balanceOf(0x3A29CD3052774224E7C2CF001254211C986967B2)
            request.method === 'eth_call' &&
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000003a29cd3052774224e7c2cf001254211c986967b2'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x000000000000000000000000000000000000000000000000000000000029e6cd', // 2746061
            }
          } else if (
            // balanceOf(0x3d9bCcA8Bc7D438a4c5171435f41a0AF5d5E6083)
            request.method === 'eth_call' &&
            request.params[0].to === '0xc96de26018a54d51c097160568752c4e3bd6c364' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000003d9bcca8bc7d438a4c5171435f41a0af5d5e6083'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000006e926d9', // 115943129
            }
          } else {
            // Default response for unsupported calls
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' },
            }
          }
        })
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockBASEMainnetContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-base-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x2105',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            // balanceOf(0x1fCca65fb6Ae3b2758b9b2B394CB227eAE404e1E)
            request.method === 'eth_call' &&
            request.params[0].to === '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000001fcca65fb6ae3b2758b9b2b394cb227eae404e1e'
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x00000000000000000000000000000000000000000000000000000000046ab089', // 74100873
            }
          } else {
            // Default response for unsupported calls
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' },
            }
          }
        })
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockETHContractCallResponseSuccess = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: any[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x1',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000006',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xdd50c053c096cb04a3e3362e2b622529ec5f2e8a' &&
            request.params[0].data ===
              '0x70a082310000000000000000000000005eaff7af80488033bc845709806d5fae5291eb88' // balanceOf()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x00000000000000000000000000000000000000000000000000002098639125aa',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xce9a6626eb99eaea829d7fa613d5d0a2eae45f40' &&
            request.params[0].data === '0x313ce567' // decimals()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000000000008',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xce9a6626eb99eaea829d7fa613d5d0a2eae45f40' &&
            request.params[0].data === '0x50d25bcd' // latestAnswer()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: '0x0000000000000000000000000000000000000000000000000000000006882052',
            }
          } else if (
            request.method === 'eth_call' &&
            request.params[0].to === '0xce9a6626eb99eaea829d7fa613d5d0a2eae45f40' &&
            request.params[0].data === '0xfeaf968c' // latestRoundData()
          ) {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result:
                '0x00000000000000000000000000000000000000000000000000000000000002f6000000000000000000000000000000000000000000000000000000000695299300000000000000000000000000000000000000000000000000000000683720cf00000000000000000000000000000000000000000000000000000000683720cf00000000000000000000000000000000000000000000000000000000000002f6',
            }
          } else {
            // Default response for unsupported calls
            return {
              jsonrpc: '2.0',
              id: request.id,
              error: { code: -32601, message: 'Method not found' },
            }
          }
        })
      },
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()

export const mockXrplResponseSuccess = (): nock.Scope =>
  nock('http://localhost-xrpl:8080', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'account_lines',
      params: [
        {
          account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
          ledger_index: 'validated',
          peer: 'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
        },
      ],
    })
    .reply(
      200,
      {
        result: {
          account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
          ledger_hash: '1D08128C3E24093DCF18AE9E6800D795207320B3CAB8C1CD4F5C34F99107955D',
          ledger_index: 96115827,
          lines: [
            {
              account: 'rJNE2NNz83GJYtWVLwMvchDWEon3huWnFn',
              balance: '4663215.314987',
              currency: 'TBL',
              limit: '9999999999999999',
              limit_peer: '0',
              no_ripple: true,
              no_ripple_peer: false,
              peer_authorized: true,
              quality_in: 0,
              quality_out: 0,
            },
          ],
          status: 'success',
          validated: true,
        },
      },
      [
        'Date',
        'Wed, 14 May 2025 13:00:06 GMT',
        'Content-Type',
        'application/json; charset=UTF-8',
        'Content-Length',
        '444',
        'Connection',
        'keep-alive',
        'nel',
        '{"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}',
        'x-kong-upstream-latency',
        '3',
        'x-kong-proxy-latency',
        '1',
        'via',
        'kong/3.4.0',
        'cf-cache-status',
        'DYNAMIC',
        'report-to',
        '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=W2C1dDN5VsyGgu6eSLNm74YaGLBWjASjNyCy3BQVTxAgPjWM9LBCaxZtWqLWP7XitG%2B0rUqCxqWliq3G%2FkEL6u8JW6dnWy6nhLU3P8a9NNs0%2FF1PrYlnsyEsDqWa35qHikiBJsoIU1ZrZ3izVA%2FPLPMCdw%3D%3D"}]}',
        'cf-ray',
        '93fa939bcbb0fef1-PDX',
        'alt-svc',
        'h3=":443"; ma=86400',
        'x-rpc-provider',
        'simplyvc1',
      ],
    )
    .persist()

export const mockXrpResponseSuccess = (): nock.Scope =>
  nock('http://localhost-xrpl:8080', { encodedQueryParams: true })
    .persist()
    .post('/', {
      method: 'account_info',
      params: [
        {
          account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
          ledger_index: 'validated',
        },
      ],
    })
    .reply(
      200,
      {
        result: {
          account_data: {
            Account: 'rGSA6YCGzywj2hsPA8DArSsLr1DMTBi2LH',
            Balance: '19999926',
            Flags: 0,
            LedgerEntryType: 'AccountRoot',
            OwnerCount: 2,
            PreviousTxnID: '5B989CDCB384800BCA249711641C972117BEDE5ADDA4A0FDA8A119B341F52FAB',
            PreviousTxnLgrSeq: 98743223,
            Sequence: 89903599,
            index: '93962858E81AB0241126F57DA48B385A1C2142B720FEF1CC27830131767AEEC2',
          },
          ledger_hash: '08D14CE87B7C312F570ED368C271811CE680B7EB2A164A115BFBD01FC16287F0',
          ledger_index: 98776630,
          validated: true,
          account_flags: {
            defaultRipple: false,
            depositAuth: false,
            disableMasterKey: false,
            disallowIncomingXRP: false,
            globalFreeze: false,
            noFreeze: false,
            passwordSpent: false,
            requireAuthorization: false,
            requireDestinationTag: false,
            disallowIncomingNFTokenOffer: false,
            disallowIncomingCheck: false,
            disallowIncomingPayChan: false,
            disallowIncomingTrustline: false,
            allowTrustLineClawback: false,
          },
          status: 'success',
        },
      },
      [
        'Date',
        'Wed, 14 May 2025 13:00:06 GMT',
        'Content-Type',
        'application/json; charset=UTF-8',
        'Content-Length',
        '444',
        'Connection',
        'keep-alive',
        'nel',
        '{"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}',
        'x-kong-upstream-latency',
        '3',
        'x-kong-proxy-latency',
        '1',
        'via',
        'kong/3.4.0',
        'cf-cache-status',
        'DYNAMIC',
        'report-to',
        '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=W2C1dDN5VsyGgu6eSLNm74YaGLBWjASjNyCy3BQVTxAgPjWM9LBCaxZtWqLWP7XitG%2B0rUqCxqWliq3G%2FkEL6u8JW6dnWy6nhLU3P8a9NNs0%2FF1PrYlnsyEsDqWa35qHikiBJsoIU1ZrZ3izVA%2FPLPMCdw%3D%3D"}]}',
        'cf-ray',
        '93fa939bcbb0fef1-PDX',
        'alt-svc',
        'h3=":443"; ma=86400',
        'x-rpc-provider',
        'simplyvc1',
      ],
    )
    .persist()

export const mockStellarResponseSuccess = (): nock.Scope =>
  nock('http://localhost-stellar:8080', { encodedQueryParams: true })
    .persist()
    .post('/', {
      jsonrpc: '2.0',
      id: 1,
      method: 'getLedgerEntries',
      params: {
        keys: [
          'AAAAAAAAAABziXLsMRsuIgKWk6j+9AY1VMp7qz2sjkLXEubgEpdYCg==',
          'AAAAAAAAAAB5JNQfUAo8pLWciV1i2cg3UgGnOrdpJid2ry0YeEiNZQ==',
        ],
      },
    })
    .reply(
      200,
      {
        result: {
          entries: [
            {
              key: 'AAAAAAAAAABziXLsMRsuIgKWk6j+9AY1VMp7qz2sjkLXEubgEpdYCg==',
              xdr: 'AAAAAAAAAABziXLsMRsuIgKWk6j+9AY1VMp7qz2sjkLXEubgEpdYCgAAOkPp9KUnA2IfqAAAAAsAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAOVF1kAAAAAaS2dTA==',
              lastModifiedLedgerSeq: 60102494,
              extXdr: 'AAAAAA==',
            },
            {
              key: 'AAAAAAAAAAB5JNQfUAo8pLWciV1i2cg3UgGnOrdpJid2ry0YeEiNZQ==',
              xdr: 'AAAAAAAAAAB5JNQfUAo8pLWciV1i2cg3UgGnOrdpJid2ry0YeEiNZQAAAAAX14OcAgdV6gAACjgAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAIAAAAAAAAAAAAAAAAAAAADAAAAAAOVRdcAAAAAaS6kuw==',
              lastModifiedLedgerSeq: 60114391,
              extXdr: 'AAAAAA==',
            },
          ],
        },
      },
      [
        'Date',
        'Wed, 14 May 2025 13:00:06 GMT',
        'Content-Type',
        'application/json; charset=UTF-8',
        'Content-Length',
        '444',
        'Connection',
        'keep-alive',
        'nel',
        '{"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}',
        'x-kong-upstream-latency',
        '3',
        'x-kong-proxy-latency',
        '1',
        'via',
        'kong/3.4.0',
        'cf-cache-status',
        'DYNAMIC',
        'report-to',
        '{"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=W2C1dDN5VsyGgu6eSLNm74YaGLBWjASjNyCy3BQVTxAgPjWM9LBCaxZtWqLWP7XitG%2B0rUqCxqWliq3G%2FkEL6u8JW6dnWy6nhLU3P8a9NNs0%2FF1PrYlnsyEsDqWa35qHikiBJsoIU1ZrZ3izVA%2FPLPMCdw%3D%3D"}]}',
        'cf-ray',
        '93fa939bcbb0fef1-PDX',
        'alt-svc',
        'h3=":443"; ma=86400',
        'x-rpc-provider',
        'simplyvc1',
      ],
    )
    .persist()
