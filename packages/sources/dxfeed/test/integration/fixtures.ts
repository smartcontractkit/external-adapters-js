import nock from 'nock'

export function mockPriceEndpoint() {
  nock('https://tools.dxfeed.com:443', { encodedQueryParams: true })
    .get('/webservice/rest/events.json')
    .query({ events: 'Trade', symbols: 'TSLA:BFX' })
    .reply(
      200,
      {
        status: 'OK',
        Trade: {
          'TSLA:BFX': {
            eventSymbol: 'TSLA:BFX',
            eventTime: 0,
            time: 1636744209248,
            timeNanoPart: 0,
            sequence: 775394,
            exchangeCode: 'V',
            price: 239.255,
            change: 0.03,
            size: 3,
            dayVolume: 700004,
            dayTurnover: 167577930,
            tickDirection: 'ZERO_UP',
            extendedTradingHours: false,
          },
        },
      },
      [
        'Server',
        'nginx',
        'Date',
        'Fri, 12 Nov 2021 19:10:13 GMT',
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

export const mockHeartbeatMsg2 = {
  request: [
    {
      id: 4,
      channel: '/meta/connect',
      connectionType: 'websocket',
      clientId: 'dczhok6vqr2dw8pmio9857029',
    },
  ],

  response: [
    [
      {
        channel: '/meta/connect',
        id: '4',
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
          Quote: ['TSLA'],
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
          ['TSLA', 0, 0, 0, 1645634934000, 'U', 788.0, 140.0, 1645634934000, 'V', 790.18, 233.0],
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
          Quote: ['TSLA'],
        },
      },
      clientId: 'dczhok6vqr2dw8pmio9857029',
      id: '4',
    },
  ],

  response: null,
}
