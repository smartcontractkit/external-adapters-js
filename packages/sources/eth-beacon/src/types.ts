export type ValidatorStatus =
  | 'pending_initialized' // When the first deposit is processed, but not enough funds are available (or not yet the end of the first epoch) to get validator into the activation queue.
  | 'pending_queued' // When validator is waiting to get activated, and have enough funds etc. while in the queue, validator activation epoch keeps changing until it gets to the front and make it through (finalization is a requirement here too).
  | 'active_ongoing' // When validator must be attesting, and have not initiated any exit.
  | 'active_exiting' // When validator is still active, but filed a voluntary request to exit.
  | 'active_slashed' // When validator is still active, but have a slashed status and is scheduled to exit.
  | 'exited_unslashed' // When validator has reached reguler exit epoch, not being slashed, and doesn't have to attest any more, but cannot withdraw yet.
  | 'exited_slashed' // When validator has reached reguler exit epoch, but was slashed, have to wait for a longer withdrawal period.
  | 'withdrawal_possible' // After validator has exited, a while later is permitted to move funds, and is truly out of the system.
  | 'withdrawal_done' // (not possible in phase0, except slashing full balance) - actually having moved funds away

export type StateId =
  | 'head' // canonical head in node's view
  | 'genesis'
  | 'finalized'
  | 'justified'
  | number // slot
  | string // hex encoded stateRoot with 0x prefix
