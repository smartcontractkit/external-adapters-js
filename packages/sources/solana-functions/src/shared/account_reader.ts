import { BorshCoder, Idl } from '@coral-xyz/anchor'
import { type Address } from '@solana/addresses'
import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/rpc'

export class SolanaAccountReader {
  rpc: Rpc<SolanaRpcApi>

  initSolanaRpc = (): Rpc<SolanaRpcApi> => {
    const rpcUrl = process.env.RPC_URL
    if (!rpcUrl) throw new Error('RPC_URL not set')
    const rpc: Rpc<SolanaRpcApi> = createSolanaRpc(rpcUrl)
    return rpc
  }
  constructor() {
    this.rpc = this.initSolanaRpc()
  }

  // fetch account information using base64 encoding - accountName must match IDL account name exactly
  async fetchAccountInformation<T>(addr: Address, accountName: string, idl: Idl): Promise<T> {
    const encoding = 'base64'
    const resp = await this.rpc.getAccountInfo(addr, { encoding }).send()
    const value = resp.value
    if (!value || !value.data || value.data[0] == null) {
      throw new Error(`Account ${accountName} not found at ${addr}`)
    }
    const dataEncoded = value.data[0] as string
    const data = Buffer.from(dataEncoded, encoding)
    const coder = new BorshCoder(idl as unknown as Idl)
    return coder.accounts.decode(accountName, data) as unknown as T
  }
}
