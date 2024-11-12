import { BigNumber } from 'ethers'

export interface LatestRoundResponse {
  roundId: BigNumber
  answer: BigNumber
  startedAt: BigNumber
  updatedAt: BigNumber
  ansIn: BigNumber
}
