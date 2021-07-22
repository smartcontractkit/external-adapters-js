import nock from 'nock'
import * as mocksData from "./mockData"

export function mockCurrencyEndpointETH() {
  nock('https://www.deribit.com')
    .get('/api/v2/public/get_index?currency=ETH')
    .reply(
        200,
        {
            "jsonrpc": "2.0",
            "result": {
                "edp": 1991.38,
                "ETH": 1991.38
            },
            "usIn": 1626892427613580,
            "usOut": 1626892427613743,
            "usDiff": 163,
            "testnet": false
        },
        [
            'X-Powered-By',
            'Express',
            'Content-Type',
            'application/json; charset=utf-8',
            'Content-Length',
            '714',
            'ETag',
            'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
            'Date',
            'Wed, 23 Jun 2021 22:38:43 GMT',
            'Connection',
            'close',
        ],
    )
}

export function mockCurrencyEndpointBTC() {
    nock('https://www.deribit.com')
        .get('/api/v2/public/get_index?currency=BTC')
        .reply(
            200,
            {
                "jsonrpc": "2.0",
                "result": {
                    "edp": 32267.78,
                    "BTC": 32267.78
                },
                "usIn": 1626892572363226,
                "usOut": 1626892572363454,
                "usDiff": 228,
                "testnet": false
            },
            [
                'X-Powered-By',
                'Express',
                'Content-Type',
                'application/json; charset=utf-8',
                'Content-Length',
                '714',
                'ETag',
                'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
                'Date',
                'Wed, 23 Jun 2021 22:38:43 GMT',
                'Connection',
                'close',
            ],
        )
}

export function mockBookDataEndpointETH() {
    nock('https://www.deribit.com')
        .get('/api/v2/public/get_book_summary_by_currency?currency=ETH&kind=option')
        .reply(
        200,
        mocksData.bookSummary.eth,
        [
            'X-Powered-By',
            'Express',
            'Content-Type',
            'application/json; charset=utf-8',
            'Content-Length',
            '714',
            'ETag',
            'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
            'Date',
            'Wed, 23 Jun 2021 22:38:43 GMT',
            'Connection',
            'close',
        ],
    )
}

export function mockBookDataEndpointBTC() {
    nock('https://www.deribit.com')
        .get('/api/v2/public/get_book_summary_by_currency?currency=BTC&kind=option')
        .reply(
        200,
        mocksData.bookSummary.btc,
        [
            'X-Powered-By',
            'Express',
            'Content-Type',
            'application/json; charset=utf-8',
            'Content-Length',
            '714',
            'ETag',
            'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
            'Date',
            'Wed, 23 Jun 2021 22:38:43 GMT',
            'Connection',
            'close',
        ],
    )
}

export function mockInstrumentsETH() {
    nock('https://www.deribit.com')
        .get('/api/v2/public/get_instruments?currency=ETH')
        .reply(
            200,
            mocksData.instruments.eth,
            [
                'X-Powered-By',
                'Express',
                'Content-Type',
                'application/json; charset=utf-8',
                'Content-Length',
                '714',
                'ETag',
                'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
                'Date',
                'Wed, 23 Jun 2021 22:38:43 GMT',
                'Connection',
                'close',
            ],
    )
}


export function mockInstrumentsBTC() {
    nock('https://www.deribit.com', { encodedQueryParams: true })
        .get('/api/v2/public/get_instruments?currency=BTC')
        .reply(
            200,
            mocksData.instruments.btc,
            [
                'X-Powered-By',
                'Express',
                'Content-Type',
                'application/json; charset=utf-8',
                'Content-Length',
                '714',
                'ETag',
                'W/"2ca-B0TkX1zAQfIfnHwQo6e4kGAEMCs"',
                'Date',
                'Wed, 23 Jun 2021 22:38:43 GMT',
                'Connection',
                'close',
            ],
    )
}