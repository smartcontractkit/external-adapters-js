import nock from 'nock'

const fileUploadMatches = (expected) => (body) => {
  const lines = body.split('\r\n')
  return lines.length === 7 && lines[4] === expected
}

export const mockIpfsSuccessfulResponse = (): nock =>
  nock('http://127.0.0.1:5001', { encodedQueryParams: true })
    .persist()
    .post('/api/v0/add', fileUploadMatches('some simple text'))
    .query({ 'stream-channels': 'true', 'cid-version': '0', progress: 'false' })
    .reply(
      200,
      {
        Name: 'QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf',
        Hash: 'QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf',
        Size: '24',
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Connection',
        'close',
        'Content-Type',
        'application/json',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'X-Chunked-Output',
        '1',
        'Date',
        'Mon, 13 Sep 2021 15:25:10 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
    .post('/api/v0/cat')
    .query({ arg: 'QmPChd2hVbrJ6bfo3WBcTW4iZnpHm8TEzWkLHmLpXhF68A' })
    .reply(200, 'Hello, <YOUR NAME HERE>', [
      'Access-Control-Allow-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Access-Control-Expose-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Content-Type',
      'text/plain',
      'Server',
      'go-ipfs/0.9.1',
      'Trailer',
      'X-Stream-Error',
      'Vary',
      'Origin',
      'X-Content-Length',
      '23',
      'X-Stream-Output',
      '1',
      'Date',
      'Tue, 14 Sep 2021 10:41:02 GMT',
      'Transfer-Encoding',
      'chunked',
    ])
    .post('/api/v0/cat')
    .query({ arg: 'QmXLpPi3yorJmGe6NsdBfyWSFvLnkX12EJR5zitwv4q8Tf' })
    .reply(200, 'some simple text', [
      'Access-Control-Allow-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Access-Control-Expose-Headers',
      'X-Stream-Output, X-Chunked-Output, X-Content-Length',
      'Content-Type',
      'text/plain',
      'Server',
      'go-ipfs/0.9.1',
      'Trailer',
      'X-Stream-Error',
      'Vary',
      'Origin',
      'X-Content-Length',
      '16',
      'X-Stream-Output',
      '1',
      'Date',
      'Tue, 14 Sep 2021 10:41:02 GMT',
      'Transfer-Encoding',
      'chunked',
    ])

export const mockIpfsErrorResponse = (): nock =>
  nock('http://127.0.0.1:5001', { encodedQueryParams: true })
    .persist()
    .post('/api/v0/cat')
    .query({ arg: 'not_real' })
    .reply(
      500,
      {
        Message: 'invalid path "not_real": selected encoding not supported',
        Code: 0,
        Type: 'error',
      },
      [
        'Access-Control-Allow-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Access-Control-Expose-Headers',
        'X-Stream-Output, X-Chunked-Output, X-Content-Length',
        'Content-Type',
        'application/json',
        'Server',
        'go-ipfs/0.9.1',
        'Trailer',
        'X-Stream-Error',
        'Vary',
        'Origin',
        'Date',
        'Tue, 14 Sep 2021 10:41:02 GMT',
        'Transfer-Encoding',
        'chunked',
      ],
    )
