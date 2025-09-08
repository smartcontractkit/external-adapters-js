import { createSolanaRpc, type Rpc, type SolanaRpcApi } from '@solana/rpc'

export const createRpcFromEnv = (): Rpc<SolanaRpcApi> => {
  const rpcUrl = process.env.RPC_URL
  if (!rpcUrl) throw new Error('RPC_URL not set')
  return createSolanaRpc(rpcUrl)
}
