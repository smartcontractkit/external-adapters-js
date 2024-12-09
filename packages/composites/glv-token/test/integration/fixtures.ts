import nock from 'nock'

export const mockTiingoEAResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'AAVE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 266.5827690523816,
          bid: 266.5282189943363,
          mid: 266.55549402335896,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'APT',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 13.528228814088195,
          bid: 13.51954505808337,
          mid: 13.523886936085782,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ATOM',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.401792563975647,
          bid: 9.398781584380746,
          mid: 9.400287074178197,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'BONK',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.000043571212617576655,
          bid: 0.00004355856438163865,
          mid: 0.00004356488849960765,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'DOGE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.4359017573130787,
          bid: 0.435877802785801,
          mid: 0.43588978004943985,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'EIGEN',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.620884244175103,
          bid: 4.619069471272202,
          mid: 4.619976857723652,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3883.415411989133,
          bid: 3756253334054,
          mid: 3883.3955186612693,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'LTC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 124.80290779857779,
          bid: 124.78825502664415,
          mid: 124.79558141261097,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'NEAR',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.249622039041353,
          bid: 7.2481424951276905,
          mid: 7.248882267084522,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'PEPE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.000025115553579006768,
          bid: 0.00002510563442282441,
          mid: 0.00002511059400091559,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'POL',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.6486600864907868,
          bid: 0.6484761308206339,
          mid: 0.6485681086557104,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'RENDER',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.627706895441122,
          bid: 9.626020557291547,
          mid: 9.626863726366334,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SEI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.6375920684483178,
          bid: 0.6374865037142299,
          mid: 0.637539286081273,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SHIB',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.000030266852436048023,
          bid: 0.000030255992682776523,
          mid: 0.000030261422559412273,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SUI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.01378545345156,
          bid: 4.013365388051823,
          mid: 4.013575420751692,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TIA',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.786793291448073,
          bid: 7.784494421419944,
          mid: 7.7856438564340085,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TON',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 6.48285759696418,
          bid: 6.481215297953613,
          mid: 6.482036447458897,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TRX',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.2977767551033427,
          bid: 0.29768561603140636,
          mid: 0.29773118556737455,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'UNI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 17.57943745498047,
          bid: 17.576315327233928,
          mid: 17.577876391107,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.9999478845368837,
          bid: 0.9998478907088855,
          mid: 0.9998978876228846,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'WLD',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3.4710148604579865,
          bid: 3.4696867300122265,
          mid: 3.4703507952351065,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'XRP',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 2.414690865498324,
          bid: 2.41447914518581,
          mid: 2.4145850053420674,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockNCFXEAResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'AAVE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 266.53795,
          bid: 266.52117,
          mid: 266.52956,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'APT',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 13.527946,
          bid: 13.51908,
          mid: 13.523513,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ATOM',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.4017906,
          bid: 9.3994676,
          mid: 9.4006291,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'BONK',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.00004355406,
          bid: 0.000043540284,
          mid: 0.000043547172,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'DOGE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.43590445,
          bid: 0.43588619,
          mid: 0.43589532,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'EIGEN',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.6215412,
          bid: 4.6190786,
          mid: 4.6203099,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3883.0609,
          bid: 3883.0483,
          mid: 3883.054,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'LTC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 124.8035,
          bid: 124.78712,
          mid: 124.79535,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'NEAR',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.2498917,
          bid: 7.2484708,
          mid: 7.2491813,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'PEPE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.00002511567,
          bid: 0.000025104822,
          mid: 0.000025110249,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'POL',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.64867773,
          bid: 0.64853482,
          mid: 0.6486062,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'RENDER',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.6288742,
          bid: 9.627336,
          mid: 9.6281051,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SEI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.63765545,
          bid: 0.6374982,
          mid: 0.63757683,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SHIB',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.000030019082554340878,
          bid: 0.00003000926160461217,
          mid: 1.0056,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SUI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.0139172,
          bid: 4.0132611,
          mid: 4.0135891,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TIA',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.7854831,
          bid: 7.7838591,
          mid: 7.784671,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TON',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 6.4828323,
          bid: 6.4810494,
          mid: 6.4819409,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TRX',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.29777039,
          bid: 0.29766586,
          mid: 0.29771813,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'UNI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 17.577058,
          bid: 17.57478,
          mid: 17.575921,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.99979765,
          bid: 0.99979634,
          mid: 0.99979,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'WLD',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3.4707488,
          bid: 3.4696207,
          mid: 3.4701848,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'XRP',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 1.0012,
          bid: 1.01,
          mid: 1.0056,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockCoinmetricsEAResponseSuccess = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'AAVE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 266.59570267264434,
          bid: 266.5391728851295,
          mid: 266.5674377788869,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'APT',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 13.529217617179432,
          bid: 13.520716857164299,
          mid: 13.52496723717186,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ATOM',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.40335580464742,
          bid: 9.40058778158952,
          mid: 9.401971793118474,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'BONK',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.00004356124569423944,
          bid: 0.00004354668085049798,
          mid: 0.0000435539632723687,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'DOGE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.4359274603439582,
          bid: 0.43588787076299934,
          mid: 0.43590766555347876,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'EIGEN',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.62192196654594,
          bid: 4.619455727538738,
          mid: 4.62068884704233,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3883.466628862623,
          bid: 3883.378621596221,
          mid: 3883.4226252294225,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'LTC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 124.82020544830917,
          bid: 124.79698302073552,
          mid: 124.80859423452235,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'NEAR',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.25025543480424,
          bid: 7.24885527150741,
          mid: 7.249555353155828,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'PEPE',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.00002511766641574341,
          bid: 0.000025107129110684775,
          mid: 0.00002511239776321409,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'POL',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.6487328261057987,
          bid: 0.6485096260599676,
          mid: 0.6486212260828832,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'RENDER',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 9.62830091054577,
          bid: 9.626484938861605,
          mid: 9.627392924703686,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SEI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.6376519296960494,
          bid: 0.6374955521127794,
          mid: 0.6375737409044144,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SHIB',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.00003026799777578063,
          bid: 0.00003025868584715907,
          mid: 0.000030263341811469853,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SUI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 4.014035855815081,
          bid: 4.013612994983417,
          mid: 4.013824425399249,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TIA',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 7.786347401614356,
          bid: 7.784443956533017,
          mid: 7.7853956790736865,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TON',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 6.4828510270902004,
          bid: 6.481509144054813,
          mid: 6.482180085572507,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TRX',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.2978211455230359,
          bid: 0.2977035988099667,
          mid: 0.2977623721665013,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'UNI',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 17.577430056844136,
          bid: 17.574071884256576,
          mid: 17.575750970550356,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 0.9999487330338629,
          bid: 0.9998484326759072,
          mid: 0.9998985828548851,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'WLD',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 3.471328421541265,
          bid: 3.47002746272482,
          mid: 3.47067794213304,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'XRP',
        quote: 'USD',
      },
    })
    .reply(
      200,
      () => ({
        data: {
          ask: 2.414921152312848,
          bid: 2.414597247223817,
          mid: 2.4147591997683326,
        },
        result: null,
        statusCode: 200,
        timestamps: {
          providerDataReceivedUnixMs: 2028,
          providerDataStreamEstablishedUnixMs: 2020,
          providerIndicatedTimeUnixMs: 1680187094577,
        },
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

export const mockNCFXEAResponseFailure = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'AAVE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'APT',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ATOM',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'BONK',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'DOGE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'EIGEN',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'LTC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'NEAR',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'PEPE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'POL',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'RENDER',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SEI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SHIB',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SUI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TIA',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TON',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TRX',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'UNI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'WLD',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'XRP',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockCoinmetricsEAResponseFailure = (): nock.Scope =>
  nock('http://localhost:8081', {
    encodedQueryParams: true,
  })
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'AAVE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'APT',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ATOM',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'BONK',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'DOGE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'EIGEN',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'ETH',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'LTC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'NEAR',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'PEPE',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'POL',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'RENDER',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SEI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SHIB',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'SUI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TIA',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TON',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'TRX',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'UNI',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'USDC',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'WLD',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()
    .post('/', {
      data: {
        endpoint: 'crypto-lwba',
        base: 'XRP',
        quote: 'USD',
      },
    })
    .reply(500, () => ({}), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .persist()

export const mockRPCResponses = (): nock.Scope =>
  nock('http://localhost:3040/', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x6a9505D0B44cFA863d9281EA5B0b34cB36243b45',
          data: '0x4015e2c2000000000000000000000000fd70de6b91282d8017aa4e741e9ae325cab992d8000000000000000000000000528a5bac7e746c9a509a1f4f6df58a03d44279f9',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x0000000000000000000000000000000000000000000000000000000000000020000000000000000000000000528a5bac7e746c9a509a1f4f6df58a03d44279f900000000000000000000000082af49447d8a07e3bd95bd0d56f35241523fbab1000000000000000000000000af88d065e77c8cc2239327c5edb3a432268e58310000000000000000000000000000000000000000000000000000000000000080000000000000000000000000000000000000000000000000000000000000001500000000000000000000000070d95587d40a2caf56bd97485ab3eec10bee63360000000000000000000000006853ea96ff216fab11d2d930ce3c508556a4bdc4000000000000000000000000d9535bb5f58a1a75032416f2dfe7880c30575a410000000000000000000000000ccb4faa6f1f1b30911619f1184082ab4e25813c000000000000000000000000248c35760068ce009a13076d573ed3497a47bcd400000000000000000000000063dc80ee90f26363b3fcd609007cc9e14c8991be000000000000000000000000b62369752d8ad08392572db6d0cc872127888bed000000000000000000000000d4b737892bab8446ea1e8bb901db092fb1ec1791000000000000000000000000d8471b9ea126272e6d32b5e4782ed76db7e554a400000000000000000000000077b2ec357b56c7d05a87971db0188dbb0c7836a50000000000000000000000000bb2a83f995e1e1eae9d7fdce68ab1ac55b2cc85000000000000000000000000d0a1afdde31eb51e8b53bdce989eb8c2404828a40000000000000000000000006ecf2133e2c9751caadcb6958b9654bae198a797000000000000000000000000b489711b1cb86afda48924730084e23310eb488300000000000000000000000066a69c8eb98a7efe22a22611d1967dfec786a708000000000000000000000000beb1f4ebc9af627ca1e5a75981ce1ae97efeda2200000000000000000000000015c6ebd4175fff9ee3c2615c556fcf62d2d9499c0000000000000000000000003680d7bfe9260d3c5de81aeb2194c119a59a99d1000000000000000000000000fac5ff56c269432706d47dc82ab082e9ae7d989e000000000000000000000000872b5d567a2469ed92d252eacb0eb3bb0769e05b0000000000000000000000004c505e0062459cf8f60fff13279c92ea15ae6e2d',
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
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x6a9505d0b44cfa863d9281ea5b0b34cb36243b45',
          data: '0x52384a78000000000000000000000000fd70de6b91282d8017aa4e741e9ae325cab992d8000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000dcbf21c259a8d000000000000000000000000000000000000000000000000000dcbe8d8ad6a9d00000000000000000000000000000000000000000000d3bf488f7b57f0f7650000000000000000000000000000000000000000000000d3b9dcde0a91b4bef700000000000000000000000000528a5bac7e746c9a509a1f4f6df58a03d44279f90000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000001500000000000000000000000070d95587d40a2caf56bd97485ab3eec10bee63360000000000000000000000006853ea96ff216fab11d2d930ce3c508556a4bdc4000000000000000000000000d9535bb5f58a1a75032416f2dfe7880c30575a410000000000000000000000000ccb4faa6f1f1b30911619f1184082ab4e25813c000000000000000000000000248c35760068ce009a13076d573ed3497a47bcd400000000000000000000000063dc80ee90f26363b3fcd609007cc9e14c8991be000000000000000000000000b62369752d8ad08392572db6d0cc872127888bed000000000000000000000000d4b737892bab8446ea1e8bb901db092fb1ec1791000000000000000000000000d8471b9ea126272e6d32b5e4782ed76db7e554a400000000000000000000000077b2ec357b56c7d05a87971db0188dbb0c7836a50000000000000000000000000bb2a83f995e1e1eae9d7fdce68ab1ac55b2cc85000000000000000000000000d0a1afdde31eb51e8b53bdce989eb8c2404828a40000000000000000000000006ecf2133e2c9751caadcb6958b9654bae198a797000000000000000000000000b489711b1cb86afda48924730084e23310eb488300000000000000000000000066a69c8eb98a7efe22a22611d1967dfec786a708000000000000000000000000beb1f4ebc9af627ca1e5a75981ce1ae97efeda2200000000000000000000000015c6ebd4175fff9ee3c2615c556fcf62d2d9499c0000000000000000000000003680d7bfe9260d3c5de81aeb2194c119a59a99d1000000000000000000000000fac5ff56c269432706d47dc82ab082e9ae7d989e000000000000000000000000872b5d567a2469ed92d252eacb0eb3bb0769e05b0000000000000000000000004c505e0062459cf8f60fff13279c92ea15ae6e2d0000000000000000000000000000000000000000000000000000000000000015000000000000000000000000000000000000000000000000000dcbf21c259a8d000000000000000000000000000000000000000000000000000dcbe8d8ad6a9d0000000000000000000000000000000000000000000000ec4de5058adc3d40000000000000000000000000000000000000000000000000ec4b5c4bcf5440c000000000000000000000000000000000000000000000010848296590687886000000000000000000000000000000000000000000000001083fd93dde37e554ff0000000000000000000000000000000000000000000001ff54a773ee364fff480000000000000000000000000000000000000000000001ff492d3e47b94ff0fe0000000000000000000000000000000000000000000007c6e8323747f72467f60000000000000000000000000000000000000000000007c66a28dbf64d3108000000000000000000000000000000000000000000000000000000000000006e9fe400000000000000000000000000000000000000000000000000000000006e9a570000000000000000000000000000000000000000000000000000000001cdd5e40000000000000000000000000000000000000000000000000000000001cdb1b6000000000000000000000000000000000000000000000000000004340952508000000000000000000000000000000000000000000000000000000433768a054000000000000000000000000000000000000000000000000000000ffc90797f8c00000000000000000000000000000000000000000000000000000ffbf2b29dc00000000000000000000000000000000000000000000000000000f274a340aade0000000000000000000000000000000000000000000000000000f267efd0d6a000000000000000000000000000000000000000000000000000000000017f3c1c00000000000000000000000000000000000000000000000000000000017f14e2000000000000000000000000000000000000000000000000000000970834a6d000000000000000000000000000000000000000000000000000000096fe2f96cc0000000000000000000000000000000000000000000000d9984a8ac1569100000000000000000000000000000000000000000000000000d990a21cb644a8f9c00000000000000000000000000000000000000000000000000000009477044a60000000000000000000000000000000000000000000000000000000946db22871000000000000000000000000000000000000000000001ca5aae393d9cc6dc380000000000000000000000000000000000000000000001ca0f5c697126ed5b1000000000000000000000000000000000000000000000670d2bd099ba9d4dfc80000000000000000000000000000000000000000000006706b8d6e3b11e143ba0000000000000000000000000000000000000000000000015f6fa185858fa9108000000000000000000000000000000000000000000000015f58ee3e89d8a44e60000000000000000000000000000000000000000000003f0e829f159ffd17f300000000000000000000000000000000000000000000003f0991d00e9308c676000000000000000000000000000000000000000000000000179d56559d8a8fdd000000000000000000000000000000000000000000000000179b50e3221c5fbfc000000000000000000000000000000000000000000000000000000328289b96aa00000000000000000000000000000000000000000000000000000327d971ed1c000000000000000000000000000000000000000000000000000008c1c3749fd2000000000000000000000000000000000000000000000000000008c15737186e',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x00000000000000000000000000000000000000104e1e2482161ac42d6ef3d0da0000000000000000000000000000000010ad6fb47f26e1e760bc417c15cc9dd50000000000000000000000000000000000000000000e31d795cda40550c6fb2c',
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
    .post('/', {
      method: 'eth_call',
      params: [
        {
          to: '0x6a9505d0b44cfa863d9281ea5b0b34cb36243b45',
          data: '0x52384a78000000000000000000000000fd70de6b91282d8017aa4e741e9ae325cab992d8000000000000000000000000000000000000000000000000000000000000012000000000000000000000000000000000000000000000000000000000000003e0000000000000000000000000000000000000000000000000000dcbf21c259a8d000000000000000000000000000000000000000000000000000dcbe8d8ad6a9d00000000000000000000000000000000000000000000d3bf488f7b57f0f7650000000000000000000000000000000000000000000000d3b9dcde0a91b4bef700000000000000000000000000528a5bac7e746c9a509a1f4f6df58a03d44279f90000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001500000000000000000000000070d95587d40a2caf56bd97485ab3eec10bee63360000000000000000000000006853ea96ff216fab11d2d930ce3c508556a4bdc4000000000000000000000000d9535bb5f58a1a75032416f2dfe7880c30575a410000000000000000000000000ccb4faa6f1f1b30911619f1184082ab4e25813c000000000000000000000000248c35760068ce009a13076d573ed3497a47bcd400000000000000000000000063dc80ee90f26363b3fcd609007cc9e14c8991be000000000000000000000000b62369752d8ad08392572db6d0cc872127888bed000000000000000000000000d4b737892bab8446ea1e8bb901db092fb1ec1791000000000000000000000000d8471b9ea126272e6d32b5e4782ed76db7e554a400000000000000000000000077b2ec357b56c7d05a87971db0188dbb0c7836a50000000000000000000000000bb2a83f995e1e1eae9d7fdce68ab1ac55b2cc85000000000000000000000000d0a1afdde31eb51e8b53bdce989eb8c2404828a40000000000000000000000006ecf2133e2c9751caadcb6958b9654bae198a797000000000000000000000000b489711b1cb86afda48924730084e23310eb488300000000000000000000000066a69c8eb98a7efe22a22611d1967dfec786a708000000000000000000000000beb1f4ebc9af627ca1e5a75981ce1ae97efeda2200000000000000000000000015c6ebd4175fff9ee3c2615c556fcf62d2d9499c0000000000000000000000003680d7bfe9260d3c5de81aeb2194c119a59a99d1000000000000000000000000fac5ff56c269432706d47dc82ab082e9ae7d989e000000000000000000000000872b5d567a2469ed92d252eacb0eb3bb0769e05b0000000000000000000000004c505e0062459cf8f60fff13279c92ea15ae6e2d0000000000000000000000000000000000000000000000000000000000000015000000000000000000000000000000000000000000000000000dcbf21c259a8d000000000000000000000000000000000000000000000000000dcbe8d8ad6a9d0000000000000000000000000000000000000000000000ec4de5058adc3d40000000000000000000000000000000000000000000000000ec4b5c4bcf5440c000000000000000000000000000000000000000000000010848296590687886000000000000000000000000000000000000000000000001083fd93dde37e554ff0000000000000000000000000000000000000000000001ff54a773ee364fff480000000000000000000000000000000000000000000001ff492d3e47b94ff0fe0000000000000000000000000000000000000000000007c6e8323747f72467f60000000000000000000000000000000000000000000007c66a28dbf64d3108000000000000000000000000000000000000000000000000000000000000006e9fe400000000000000000000000000000000000000000000000000000000006e9a570000000000000000000000000000000000000000000000000000000001cdd5e40000000000000000000000000000000000000000000000000000000001cdb1b6000000000000000000000000000000000000000000000000000004340952508000000000000000000000000000000000000000000000000000000433768a054000000000000000000000000000000000000000000000000000000ffc90797f8c00000000000000000000000000000000000000000000000000000ffbf2b29dc00000000000000000000000000000000000000000000000000000f274a340aade0000000000000000000000000000000000000000000000000000f267efd0d6a000000000000000000000000000000000000000000000000000000000017f3c1c00000000000000000000000000000000000000000000000000000000017f14e2000000000000000000000000000000000000000000000000000000970834a6d000000000000000000000000000000000000000000000000000000096fe2f96cc0000000000000000000000000000000000000000000000d9984a8ac1569100000000000000000000000000000000000000000000000000d990a21cb644a8f9c00000000000000000000000000000000000000000000000000000009477044a60000000000000000000000000000000000000000000000000000000946db22871000000000000000000000000000000000000000000001ca5aae393d9cc6dc380000000000000000000000000000000000000000000001ca0f5c697126ed5b1000000000000000000000000000000000000000000000670d2bd099ba9d4dfc80000000000000000000000000000000000000000000006706b8d6e3b11e143ba0000000000000000000000000000000000000000000000015f6fa185858fa9108000000000000000000000000000000000000000000000015f58ee3e89d8a44e60000000000000000000000000000000000000000000003f0e829f159ffd17f300000000000000000000000000000000000000000000003f0991d00e9308c676000000000000000000000000000000000000000000000000179d56559d8a8fdd000000000000000000000000000000000000000000000000179b50e3221c5fbfc000000000000000000000000000000000000000000000000000000328289b96aa00000000000000000000000000000000000000000000000000000327d971ed1c000000000000000000000000000000000000000000000000000008c1c3749fd2000000000000000000000000000000000000000000000000000008c15737186e',
        },
        'latest',
      ],
      id: /^\d+$/,
      jsonrpc: '2.0',
    })
    .reply(
      200,
      (_, request) => ({
        jsonrpc: '2.0',
        id: request['id'],
        result:
          '0x00000000000000000000000000000000000000104d61f31d7c2f8e5aa05c73e10000000000000000000000000000000010acaf36f1519a7aa69245450a0dd33f0000000000000000000000000000000000000000000e31d795cda40550c6fb2c',
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
