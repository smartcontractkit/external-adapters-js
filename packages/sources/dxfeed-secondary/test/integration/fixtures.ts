import nock from 'nock'

export function mockPriceResponse() {
  nock('https://tools.dxfeed.com:443', { encodedQueryParams: true })
    .get('/webservice/rest/events.json')
    .query({ events: 'Trade', symbols: 'UKX.IND%3ATEI' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'UKX.IND:TEI': {
            eventSymbol: 'UKX.IND:TEI',
            eventTime: 0,
            time: 1636750796767,
            timeNanoPart: 0,
            sequence: 17844,
            exchangeCode: '',
            price: 7343.84,
            change: -36.21,
            size: 0,
            dayVolume: 'NaN',
            dayTurnover: 'NaN',
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 21:50:50 GMT',
        'Content-Type',
        'application/json',
        'Transfer-Encoding',
        'chunked',
        'Connection',
        'close',
        'X-Origin-Nginx',
        'tools1',
        'Access-Control-Allow-Origin',
        '*',
        'Access-Control-Allow-Methods',
        'GET, POST, OPTIONS',
        'Access-Control-Max-Age',
        '86400',
        'X-Origin-Nginx',
        'tools1',
      ],
    )
}

export const mockHandshake = {
  request: [
    {
      id: '1',
      version: '1.0',
      minimumVersion: '1.0',
      channel: '/meta/handshake',
      supportedConnectionTypes: ['websocket', 'long-polling', 'callback-polling'],
      advice: {
        timeout: 60000,
        interval: 0,
      },
    },
  ],

  response: [
    [
      {
        minimumVersion: '1.0',
        clientId: 'dczhok6vqr2dw8pmio9857029',
        supportedConnectionTypes: ['websocket'],
        advice: {
          interval: 0,
          timeout: 30000,
          reconnect: 'retry',
        },
        channel: '/meta/handshake',
        id: '1',
        version: '1.0',
        successful: true,
      },
    ],
  ],
}

export const mockFirstHeartbeatMsg = {
  request: [
    {
      id: '2',
      channel: '/meta/connect',
      connectionType: 'websocket',
      advice: {
        timeout: 0,
      },
      clientId: 'dczhok6vqr2dw8pmio9857029',
    },
  ],

  response: [
    [
      {
        advice: {
          interval: 0,
          timeout: 30000,
          reconnect: 'retry',
        },
        channel: '/meta/connect',
        id: '2',
        successful: true,
      },
    ],
  ],
}

export const mockHeartbeatMsg = {
  request: [
    {
      id: '3',
      channel: '/meta/connect',
      connectionType: 'websocket',
      clientId: 'dczhok6vqr2dw8pmio9857029',
    },
  ],

  response: [
    [
      {
        channel: '/meta/connect',
        id: '3',
        successful: true,
      },
    ],
  ],
}

export const mockSubscribe = {
  request: [
    {
      channel: '/service/sub',
      data: {
        add: {
          Quote: ['FTSE'],
        },
      },
      clientId: 'dczhok6vqr2dw8pmio9857029',
      id: '4',
    },
  ],

  response: [
    [
      {
        data: [
          'Quote',
          ['FTSE', 0, 0, 0, 1645634934000, 'U', 788.0, 140.0, 1645634934000, 'V', 790.18, 233.0],
        ],
        channel: '/service/data',
      },
    ],
  ],
}

export const mockUnsubscribe = {
  request: [
    {
      channel: '/service/sub',
      data: {
        remove: {
          Quote: ['FTSE'],
        },
      },
    },
  ],

  response: null,
}
