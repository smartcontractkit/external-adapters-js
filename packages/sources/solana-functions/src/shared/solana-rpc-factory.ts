import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/rpc'
export class SolanaRpcFactory {
  private readonly defaultUrl?: string

  constructor(override?: string) {
    this.defaultUrl = override ?? process.env.RPC_URL
  }

  create(url?: string): Rpc<SolanaRpcApi> {
    const rpcUrl = url ?? this.defaultUrl
    if (!rpcUrl) throw new Error('RPC URL not provided')
    return createSolanaRpc(rpcUrl)
  }
}
