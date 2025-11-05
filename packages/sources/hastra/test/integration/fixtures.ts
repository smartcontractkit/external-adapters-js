import nock from 'nock'

export const mockResponseSuccess = ({
  tokenName,
  contractAddress,
  accruedInterest,
}: {
  tokenName: string
  contractAddress: string
  accruedInterest: string
}): nock.Scope =>
  nock('https://hastra-api', {
    encodedQueryParams: true,
  })
    .get(`/tokens/interest_accrued/${contractAddress}`)
    .reply(
      200,
      () => ({
        token_name: tokenName,
        contract_address: contractAddress,
        outstanding_interest_accrued: accruedInterest,
        as_of_datetime: new Date(Date.now()).toISOString(),
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    .persist()
