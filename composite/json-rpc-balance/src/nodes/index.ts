import * as btcd from './btcd'
import * as electrs from './electrs'
import { Execute } from '@chainlink/types'
import { balance } from '@chainlink/ea-factories'

export type GetBalanceImpl = (adapter: Execute) => balance.GetBalance

export const getAddressBalanceImpl = (type: string, adapter: Execute): balance.GetBalance => {
  switch (type.toLowerCase()) {
    case btcd.NAME.toLowerCase():
      return btcd.makeAddressBalanceCall(adapter)
    case electrs.NAME.toLowerCase():
      return electrs.makeAddressBalanceCall(adapter)
  }
  throw Error(`Unknown node type ${type}`)
}
