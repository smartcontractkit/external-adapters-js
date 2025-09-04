import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'

export const fakeEusxProgram = {
  programId: new PublicKey('eUSXyKoZ6aGejYVbnp3wtWQ1E8zuokLAJPecPxxtgG3'),
  account: {
    yieldPool: {
      fetch: jest.fn().mockResolvedValue({
        sharesSupply: new BN(1000),
        totalAssets: new BN(5000),
      }),
    },
    vestingSchedule: {
      fetch: jest.fn().mockResolvedValue({
        vestingAmount: new BN(1000),
        startTime: new BN(1000),
        endTime: new BN(2000),
      }),
    },
  },
} as any
