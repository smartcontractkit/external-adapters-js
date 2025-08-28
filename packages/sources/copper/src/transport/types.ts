export interface WalletsEndpointResponse {
  wallets: {
    available: string
    balance: string
    createdAt: string
    currency: string
    extra: {
      externalAccountId: string
    }
    locked: string
    mainCurrency: string
    organizationId: string
    portfolioId: string
    portfolioType: 'custody'
    reserve: string
    stakeBalance: string
    totalBalance: string
    updatedAt: string
    walletId: string
  }[]
}

export interface ActiveStakesEndpointResponse {
  activeStakes: {
    activeStake: {
      activeStakedAmount: string
      claimableRewardsAmount: string
      endTimeSeconds: string
      pool: {
        extra: {
          netuid: string
        }
        poolId: string
        poolName: string
        totalBonded: string
      }
      pools: [
        {
          extra: {
            netuid: string
          }
          poolId: string
          poolName: string
          totalBonded: string
        },
      ]
      readyToRedelegate: true
      readyToUndelegateStakingPermissions: true
      readyToUnstake: true
      readyToUnstakeAt: string
      requireChillToUnstake: true
      rewardRate: string
      rewardsAutoRestake: true
      rewardsRequireClaim: true
      stakeAddress: string
      warning: {
        code: string
        message: string
      }
    }
    activeStakeId: string
    createdAt: string
    currency: string
    depositTargetId: string
    mainCurrency: string
    organizationId: string
    portfolioId: string
    updatedAt: string
  }[]
}

export interface PendingStakesEndpointResponse {
  pendingStakes: {
    createdAt: string
    currency: string
    depositTargetId: string
    mainCurrency: string
    organizationId: string
    pendingStake: {
      canBeRebonded: true
      canBeUnstaked: true
      originPool: {
        extra: {
          netuid: string
        }
        poolId: string
        poolName: string
        totalBonded: string
      }
      pendingAmount: string
      pendingEndsAt: string
      pendingStakeStatus: 'unbonding'
      pool: {
        extra: {
          netuid: string
        }
        poolId: string
        poolName: string
        totalBonded: string
      }
      pools: [
        {
          extra: {
            netuid: string
          }
          poolId: string
          poolName: string
          totalBonded: string
        },
      ]
      requireChillToUnstake: true
      stakeAddress: string
      warning: {
        code: string
        message: string
      }
    }
    pendingStakeId: string
    portfolioId: string
    updatedAt: string
  }[]
}

export interface OutstandingStakesEndpointResponse {
  outstandingStakes: {
    createdAt: string
    currency: string
    depositTargetId: string
    mainCurrency: string
    organizationId: string
    outstandingOperation: {
      canCreatePool: true
      claimResourceId: string
      outstandingAmount: string
      outstandingOperationType: 'claim-reward'
      pool: {
        extra: {
          netuid: string
        }
        poolId: string
        poolName: string
        totalBonded: string
      }
      pools: [
        {
          extra: {
            netuid: string
          }
          poolId: string
          poolName: string
          totalBonded: string
        },
      ]
      rewardResourceIds: [string]
      stakeAddress: string
    }
    outstandingStakeId: string
    portfolioId: string
    updatedAt: string
  }[]
}
