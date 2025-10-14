import BN from 'bn.js'

export const fakeYieldPoolAccount = {
  shares_supply: new BN(1000),
  total_assets: new BN(5000),
}

export const fakeVestingScheduleAccount = {
  vesting_amount: new BN(1000),
  start_time: new BN(1000),
  end_time: new BN(2000),
}
