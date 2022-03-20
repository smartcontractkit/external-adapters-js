import nock from 'nock'

export const MOCK_GALAXIS_API_RESP = {
  team_achievements: [
    {
      team_id: 1610612737,
      achievement_id: 2,
      value: true,
    },
    {
      team_id: 1610612738,
      achievement_id: 8,
      value: true,
    },
  ],
  player_achievements: [
    {
      player_id: 203991,
      achievement_id: 15,
      value: 5,
    },
    {
      player_id: 203992,
      achievement_id: 17,
      value: 4,
    },
  ],
}

export function mockGalaxisApiResp(apiEndpoint: string): void {
  nock(apiEndpoint, { encodedQueryParams: true })
    .get('/')
    .reply(200, MOCK_GALAXIS_API_RESP, [
      'Connection',
      'close',
      'Content-Length',
      '4902',
      'Cache-Control',
      'max-age=300',
      'Content-Security-Policy',
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'Content-Type',
      'text/plain; charset=utf-8',
      'ETag',
      '"285d7a1190ad122b5ad61b7b75b0569828e3ed075dd27b7db469feb3fbdbe862"',
      'Strict-Transport-Security',
      'max-age=31536000',
      'X-Content-Type-Options',
      'nosniff',
      'X-Frame-Options',
      'deny',
      'X-XSS-Protection',
      '1; mode=block',
      'X-GitHub-Request-Id',
      '9A9C:6C33:13142D:2167A8:6236DB22',
      'Accept-Ranges',
      'bytes',
      'Date',
      'Sun, 20 Mar 2022 07:43:30 GMT',
      'Via',
      '1.1 varnish',
      'X-Served-By',
      'cache-qpg1231-QPG',
      'X-Cache',
      'MISS',
      'X-Cache-Hits',
      '0',
      'X-Timer',
      'S1647762210.020453,VS0,VE325',
      'Vary',
      'Authorization,Accept-Encoding,Origin',
      'Access-Control-Allow-Origin',
      '*',
      'X-Fastly-Request-ID',
      '37ccd72bbaeacb26a5fc47518bfc54fd0b98aff3',
      'Expires',
      'Sun, 20 Mar 2022 07:48:30 GMT',
      'Source-Age',
      '0',
    ])
}
