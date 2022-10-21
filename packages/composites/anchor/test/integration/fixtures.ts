export const mockSuccessfulLunaFeedResp = {
  jobRunID: '1',
  result: {
    round_id: 314711,
    answer: '262009859746',
    started_at: 1645564682,
    updated_at: 1645564682,
    answered_in_round: 314711,
  },
  statusCode: 200,
  data: {
    result: {
      round_id: 314711,
      answer: '262009859746',
      started_at: 1645564682,
      updated_at: 1645564682,
      answered_in_round: 314711,
    },
  },
}

export const mockSuccessfulTerraEthFeedResp = {
  jobRunID: '1',
  result: {
    round_id: 314711,
    answer: '262009859746',
    started_at: 1645564682,
    updated_at: 1645564682,
    answered_in_round: 314711,
  },
  statusCode: 200,
  data: {
    result: {
      round_id: 314711,
      answer: '262009859746',
      started_at: 1645564682,
      updated_at: 1645564682,
      answered_in_round: 314711,
    },
  },
}

export const mockErrorFeedResponse = {
  jobRunID: '1',
  result: {
    round_id: 314711,
    answer: '0',
    started_at: 1645564682,
    updated_at: 1645564682,
    answered_in_round: 314711,
  },
  statusCode: 200,
  data: {
    result: {
      round_id: 314711,
      answer: '0',
      started_at: 1645564682,
      updated_at: 1645564682,
      answered_in_round: 314711,
    },
  },
}

export const mockSuccessfulAnchorHubContractAddress = {
  jobRunID: '1',
  result: {
    bluna_exchange_rate: '1.000007186099738229',
    stluna_exchange_rate: '1.016582973702789229',
    total_bond_bluna_amount: '83309307395117',
    total_bond_stluna_amount: '1789057091036',
    last_index_modification: 1646371624,
    prev_hub_balance: '239985782176',
    last_unbonded_time: 1646230817,
    last_processed_batch: 109,
    total_bond_amount: '83309307395117',
    exchange_rate: '1.000007186099738229',
  },
  statusCode: 200,
  data: {
    result: {
      bluna_exchange_rate: '1.000007186099738229',
      stluna_exchange_rate: '1.016582973702789229',
      total_bond_bluna_amount: '83309307395117',
      total_bond_stluna_amount: '1789057091036',
      last_index_modification: 1646371624,
      prev_hub_balance: '239985782176',
      last_unbonded_time: 1646230817,
      last_processed_batch: 109,
      total_bond_amount: '83309307395117',
      exchange_rate: '1.000007186099738229',
    },
  },
}

export const mockErrorAnchorHubContractResp = {
  jobRunID: '1',
  result: {
    bluna_exchange_rate: '0',
    stluna_exchange_rate: '0',
    total_bond_bluna_amount: '0',
    total_bond_stluna_amount: '0',
    last_index_modification: 0,
    prev_hub_balance: '0',
    last_unbonded_time: 0,
    last_processed_batch: 0,
    total_bond_amount: '0',
    exchange_rate: '0',
  },
  statusCode: 200,
  data: {
    result: {
      bluna_exchange_rate: '0',
      stluna_exchange_rate: '0',
      total_bond_bluna_amount: '0',
      total_bond_stluna_amount: '0',
      last_index_modification: 0,
      prev_hub_balance: '0',
      last_unbonded_time: 0,
      last_processed_batch: 0,
      total_bond_amount: '0',
      exchange_rate: '0',
    },
  },
}
