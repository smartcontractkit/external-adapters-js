import nock from 'nock'
import { oct2021data } from './testdata/data'

export function mockGistEmptyResponseSuccess() {
  nock('https://gist.githubusercontent.com')
    .persist()
    .get(
      '/thodges-gh/3bd03660676504478de60c3a17800556/raw/0013f560b97eb1b2481fd4d57f02507c96f0d88f/balances.json',
    )
    .reply(200, [])
}

export function mockGistResponseSuccess() {
  nock('https://gist.githubusercontent.com')
    .persist()
    .get(
      '/thodges-gh/3bd03660676504478de60c3a17800556/raw/0013f560b97eb1b2481fd4d57f02507c96f0d88f/balances.json',
    )
    .reply(200, [
      {
        address: 'a',
        balance: 100,
      },
      {
        address: 'b',
        balance: 10,
      },
      {
        address: 'c',
        balance: 1,
      },
    ])
}

export function mockGistOct2021DataResponseSuccess() {
  nock('https://gist.githubusercontent.com')
    .persist()
    .get(
      '/thodges-gh/3bd03660676504478de60c3a17800556/raw/0013f560b97eb1b2481fd4d57f02507c96f0d88f/balances.json',
    )
    .reply(200, oct2021data)
}

export function mockGistResponseFailure() {
  nock('https://gist.githubusercontent.com')
    .persist()
    .get(
      '/thodges-gh/3bd03660676504478de60c3a17800556/raw/0013f560b97eb1b2481fd4d57f02507c96f0d88f/balances.json',
    )
    .reply(500, [])
}
