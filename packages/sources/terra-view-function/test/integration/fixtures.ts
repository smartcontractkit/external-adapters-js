import nock from 'nock'

export const mockLCDResponseSuccess = (): nock.Scope =>
  nock('http://localhost:1234', { encodedQueryParams: true })
    .get('/terra/wasm/v1beta1/contracts/terra1dw5ex5g802vgrek3nzppwt29tfzlpa38ep97qy/store')
    .query({
      query_msg: 'eyJhZ2dyZWdhdG9yX3F1ZXJ5Ijp7ImdldF9sYXRlc3Rfcm91bmRfZGF0YSI6e319fQ%3D%3D',
    })
    .reply(200, {
      query_result: {
        round_id: 102601,
        answer: '450925174149',
        started_at: 1635943989,
        updated_at: 1635943989,
        answered_in_round: 102601,
      },
    })
