import nock from 'nock'

type JsonRpcPayload = {
  id: number
  method: string
  params: Array<{ to: string; data: string }>
  jsonrpc: '2.0'
}

const BALANCE_OF_SIG_HASH = '0x70a08231'
const GET_TOTAL_LPT_SIG_HASH = '0x9b1209b5'
const TOTAL_SUPPLY_SIG_HASH = '0x18160ddd'
const BLOCK_HEIGHT = 23030750n

export const METH_ADDRESS = '0xd5F7838F5C461fefF7FE49ea5ebaF7728bB0ADfa'
export const CMETH_ADDRESS = '0xE6829d9a7eE3040e1276Fa75293Bde931859e8fA'

export const BORING_VAULT_ADDRESS = '0x33272D40b247c4cd9C646582C9bbAD44e85D4fE4'

export const POSITION_MANAGER_KARAK_ADDRESS = '0x52EA8E95378d01B0aaD3B034Ca0656b0F0cc21A2'
export const V1_POSITION_MANAGER_SYMBIOTIC_ADDRESS = '0x919531146f9a25dfc161d5ab23b117feae2c1d36'
export const V1_POSITION_MANAGER_EIGEN_A41_ADDRESS = '0x6DfbE3A1a0e835C125EEBb7712Fffc36c4D93b25'
export const V1_POSITION_MANAGER_EIGEN_P2P_ADDRESS = '0x021180A06Aa65A7B5fF891b5C146FbDaFC06e2DA'
export const V2_POSITION_MANAGER_SYMBIOTIC_ADDRESS = '0x5bb8e5e8602b71b182e0Efe256896a931489A135'
export const V2_POSITION_MANAGER_EIGEN_A41_ADDRESS = '0xCaC15044a1F67238D761Aa4C7650DaB59cEF849D'
export const V2_POSITION_MANAGER_EIGEN_P2P_ADDRESS = '0x0b5d15445b715bf117ba0482b7a9f772af46d93a'

export const V1_SYMBIOTIC_RESTAKING_POOL_ADDRESS = '0x475d3eb031d250070b63fa145f0fcfc5d97c304a'

export const DELAYED_WITHDRAW_ADDRESS = '0x12Be34bE067Ebd201f6eAf78a861D90b2a66B113'

const BALANCES: Record<string, Record<string, bigint>> = {
  [METH_ADDRESS.toLowerCase()]: {
    [BORING_VAULT_ADDRESS.toLowerCase()]: 600148699891045598199n,
    [DELAYED_WITHDRAW_ADDRESS.toLowerCase()]: 1141793853000000000000n,
  },
}

const TOTAL_LPT: Record<string, bigint> = {
  [POSITION_MANAGER_KARAK_ADDRESS.toLowerCase()]: 26378n,
  [V2_POSITION_MANAGER_SYMBIOTIC_ADDRESS.toLowerCase()]: 90460000000000000000000n,
  [V2_POSITION_MANAGER_EIGEN_A41_ADDRESS.toLowerCase()]: 52230000000000000000000n,
  [V2_POSITION_MANAGER_EIGEN_P2P_ADDRESS.toLowerCase()]: 52230000000000000000000n,
}

const TOTAL_SUPPLY: Record<string, bigint> = {
  [CMETH_ADDRESS.toLowerCase()]: 196661942552891045624577n,
}

const bigintToEthRpcResult = (value: bigint): string => {
  return '0x' + value.toString(16).padStart(64, '0')
}

export const mockEthereumRpc = (): nock.Scope =>
  nock('http://localhost-eth-mainnet:8080', {})
    .post('/', (body: any) => Array.isArray(body))
    .reply(
      200,
      (_uri, requestBody: JsonRpcPayload[]) => {
        return requestBody.map((request: JsonRpcPayload) => {
          if (request.method === 'eth_chainId') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: bigintToEthRpcResult(1n),
            }
          } else if (request.method === 'eth_blockNumber') {
            return {
              jsonrpc: '2.0',
              id: request.id,
              result: bigintToEthRpcResult(BLOCK_HEIGHT),
            }
          } else if (request.method === 'eth_call') {
            const [{ to, data }] = request.params
            if (data.startsWith(BALANCE_OF_SIG_HASH)) {
              const tokenContractAddress = to.toLowerCase()
              const account = '0x' + data.slice(34).toLowerCase()
              const balance = BALANCES[tokenContractAddress]?.[account] ?? 0
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: bigintToEthRpcResult(balance),
              }
            } else if (data === GET_TOTAL_LPT_SIG_HASH) {
              const contractAddress = to.toLowerCase()
              const totalLpt = TOTAL_LPT[contractAddress] ?? 0
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: bigintToEthRpcResult(totalLpt),
              }
            } else if (data === TOTAL_SUPPLY_SIG_HASH) {
              const contractAddress = to.toLowerCase()
              const totalSupply = TOTAL_SUPPLY[contractAddress] ?? 0
              return {
                jsonrpc: '2.0',
                id: request.id,
                result: bigintToEthRpcResult(totalSupply),
              }
            }
          }
          console.log('unMocked Ethereum RPC request:', JSON.stringify(request, null, 2))
          return {
            jsonrpc: '2.0',
            id: request.id,
            result: '',
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
