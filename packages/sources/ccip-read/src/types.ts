import { FunctionFragment } from '@ethersproject/abi'
import { StateRootBatchHeader } from './endpoint/optimism-metis-gateway/types'

export interface HandlerResponse {
  returnType: FunctionFragment
  response: readonly [
    string,
    {
      stateRoot: string
      stateRootBatchHeader: StateRootBatchHeader
      stateRootProof: {
        index: number
        siblings: Buffer[]
      }
      stateTrieWitness: string
      storageTrieWitness: string
    },
  ]
}
