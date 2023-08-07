import nock from 'nock'

export function mockRecordCheckResponse() {
  nock('https://dns.google:443', { encodedQueryParams: true })
    .get('/resolve')
    .query({ name: 'example.com', type: 'TXT' })
    .reply(
      200,
      {
        Status: 0,
        TC: false,
        RD: true,
        RA: true,
        AD: true,
        CD: false,
        Question: [{ name: 'example.com.', type: 16 }],
        Answer: [
          { name: 'example.com.', type: 16, TTL: 21600, data: 'v=spf1 -all' },
          { name: 'example.com.', type: 16, TTL: 21600, data: '8j5nfqld20zpcyr8xjw0ydcfq9rk8hgm' },
        ],
        Comment: 'Response from 199.43.133.53.',
      },
      [
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload',
        'Access-Control-Allow-Origin',
        '*',
        'X-Content-Type-Options',
        'nosniff',
        'Date',
        'Mon, 15 Nov 2021 14:48:00 GMT',
        'Expires',
        'Mon, 15 Nov 2021 14:48:00 GMT',
        'Cache-Control',
        'private, max-age=21600',
        'Content-Type',
        'application/x-javascript; charset=UTF-8',
        'Server',
        'HTTP server (unknown)',
        'X-XSS-Protection',
        '0',
        'X-Frame-Options',
        'SAMEORIGIN',
        'Alt-Svc',
        'clear',
        'Accept-Ranges',
        'none',
        'Vary',
        'Accept-Encoding',
        'Connection',
        'close',
        'Transfer-Encoding',
        'chunked',
      ],
    )
}
