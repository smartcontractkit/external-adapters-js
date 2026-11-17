// Field names, nesting, and value types follow the provider recording.
export const tokenResponseBody = {
  token_type: 'Bearer',
  expires_in: 3600,
  access_token: 'replay-credential',
  scope: 'rtg_ssa',
}

export const unauthorizedBody = {
  code: 401,
  requestId: 'e5e75e91-b115-4fe4-a5e2-7f4bc7e75da8#213173',
  message: 'Unauthorized',
}

const recordedScores = [
  {
    last_modified_date_time: '2025-12-19T00:00:00Z',
    security_id: 'SP-EURC',
    security_name: 'EURC',
    ssa: '2',
    ssa_desc: 'Strong',
  },
  {
    last_modified_date_time: '2025-12-05T00:00:00Z',
    security_id: 'SP-EURCV',
    security_name: 'EURCV',
    ssa: '3',
    ssa_desc: 'Adequate',
  },
  {
    last_modified_date_time: '2025-12-03T00:00:00Z',
    security_id: 'SP-GUSD',
    security_name: 'GUSD',
    ssa: '3',
    ssa_desc: 'Adequate',
  },
  {
    last_modified_date_time: '2026-11-11T00:00:00Z',
    security_id: 'SP-TUSD',
    security_name: 'TUSD',
    ssa: '5',
    ssa_desc: 'Weak',
  },
  {
    last_modified_date_time: '2026-11-10T00:00:00Z',
    security_id: 'SP-FDUSD',
    security_name: 'FDUSD',
    ssa: '4',
    ssa_desc: 'Constrained',
  },
  {
    last_modified_date_time: '2025-12-18T00:00:00Z',
    security_id: 'SP-USDC',
    security_name: 'USDC',
    ssa: '2',
    ssa_desc: 'Strong',
  },
  {
    last_modified_date_time: '2026-02-12T00:00:00Z',
    security_id: 'SP-USDG',
    security_name: 'USDG',
    ssa: '2',
    ssa_desc: 'Strong',
  },
  {
    last_modified_date_time: '2025-12-01T00:00:00Z',
    security_id: 'SP-USDP',
    security_name: 'USDP',
    ssa: '2',
    ssa_desc: 'Strong',
  },
  {
    last_modified_date_time: '2025-12-08T00:00:00Z',
    security_id: 'SP-USDS/DAI',
    security_name: 'USDS/DAI',
    ssa: '4',
    ssa_desc: 'Constrained',
  },
  {
    last_modified_date_time: '2025-11-26T00:00:00Z',
    security_id: 'SP-USDT',
    security_name: 'USDT',
    ssa: '5',
    ssa_desc: 'Weak',
  },
  {
    last_modified_date_time: '2026-01-14T00:00:00Z',
    security_id: 'SP-USDe',
    security_name: 'USDe',
    ssa: '5',
    ssa_desc: 'Weak',
  },
]

export const scoresFixture = (): Record<string, unknown>[] =>
  recordedScores.map((record) => ({ ...record }))

export const providerRecord = (
  overrides: Record<string, unknown> = {},
): Record<string, unknown> => ({
  last_modified_date_time: '2025-12-19T00:00:00Z',
  security_id: 'SP-EURC',
  security_name: 'EURC',
  ssa: '2',
  ssa_desc: 'Strong',
  ...overrides,
})

export const scoresWith = (
  securityId: string,
  overrides: Record<string, unknown> = {},
): Record<string, unknown>[] =>
  scoresFixture().map((record) =>
    record.security_id === securityId ? { ...record, ...overrides } : record,
  )
