export const tokenFixture = {
  access_token: 'test-access-token',
  expires_in: 1800,
  token_type: 'Bearer',
  scope: 'rtg_ssa',
}

export const providerRecord = (overrides: Record<string, unknown> = {}) => ({
  last_modified_date_time: '2025-01-17T00:00Z',
  security_id: 'SP-EURC',
  security_name: 'EURC',
  ssa: '2',
  ssa_desc: 'Strong',
  ...overrides,
})

export const scoresFixture = (records?: Record<string, unknown>[]) =>
  records ?? [
    providerRecord(),
    providerRecord({
      last_modified_date_time: '2024-12-04T00:00Z',
      security_id: 'SP-GUSD',
      security_name: 'GUSD',
    }),
  ]
