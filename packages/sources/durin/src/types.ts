import { FunctionFragment } from '@ethersproject/abi'

export interface HandlerResponse {
  returnType: FunctionFragment
  response: any[]
}
