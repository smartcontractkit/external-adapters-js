import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({
      assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
      sortBy: 'recordDate',
      sortOrder: 'DESC',
      page: 1,
      limit: 1,
    })
    .reply(
      200,
      () => ({
        docs: [
          {
            assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
            name: 'my asset',
            nav: 1,
            seqNum: 12346,
            yieldOneDay: '0.000113787',
            yieldSevenDay: '4.17',
            recordDate: '2025-09-11T00:00:00.000Z',
            signedMessage: {
              signature:
                'f386e20fbf859ecd28ede08283ed43d41044ed7a7d3d63a00401fe66f0b8d7fbbf1ad79e9575c537e0d0e9c9cb661b02a70c0e36b839fe2f78489a1df7e39d02',
              content:
                '63353263336437392d383331372d343639322d383666382d3465306466643530383637327c7c317c7c323032352d30392d31315430303a30303a30302e3030305a7c7c31323334367c7c37613530316462353731633634313564353634376235383238383562623864383136313537613064366464663431353464303031643832366337313237316139663331666132316561663035333833393530613563373538303537623866313936396264393464323864323266313035363161393336396631343839653030367c7c63376638333561346339386238663333383062393662376531643432363634326633623036333935633738323164336137333732643830643536316636396165',
              hash: '1afb5dd05fb5b7b2076381b0cc94df2d02799f27930771b42a1372a31ce1a070',
              prevHash: 'c7f835a4c98b8f3380b96b7e1d426642f3b06395c7821d3a7372d80d561f69ae',
              prevSig:
                '7a501db571c6415d5647b582885bb8d816157a0d6ddf4154d001d826c71271a9f31fa21eaf05383950a5c758057b8f1969bd94d28d22f10561a9369f1489e006',
              prevContent:
                '63353263336437392d383331372d343639322d383666382d3465306466643530383637327c7c317c7c323032352d30392d31315430303a30303a30302e3030305a7c7c31323334357c7c7c7c',
            },
          },
        ],
        totalDocs: 36,
        limit: 1,
        totalPages: 36,
        page: 1,
        prevPage: null,
        nextPage: 2,
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

export const mockResponseSuccessWithMissingPrevSig = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({
      assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
      sortBy: 'recordDate',
      sortOrder: 'DESC',
      page: 1,
      limit: 1,
    })
    .reply(
      200,
      () => ({
        docs: [
          {
            assetId: 'c52c3d79-8317-4692-86f8-4e0dfd508672',
            name: 'my asset',
            nav: 1,
            seqNum: 12345,
            yieldOneDay: '0.000113787',
            yieldSevenDay: '4.17',
            recordDate: '2025-09-11T00:00:00.000Z',
            signedMessage: {
              signature:
                '7a501db571c6415d5647b582885bb8d816157a0d6ddf4154d001d826c71271a9f31fa21eaf05383950a5c758057b8f1969bd94d28d22f10561a9369f1489e006',
              content:
                '63353263336437392d383331372d343639322d383666382d3465306466643530383637327c7c317c7c323032352d30392d31315430303a30303a30302e3030305a7c7c31323334357c7c7c7c',
              hash: 'c7f835a4c98b8f3380b96b7e1d426642f3b06395c7821d3a7372d80d561f69ae',
              prevSig: null,
              prevContent: null,
              prevHash: null,
            },
          },
        ],
        totalDocs: 36,
        limit: 1,
        totalPages: 36,
        page: 1,
        prevPage: null,
        nextPage: 2,
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

export const mockResponseFailure = (): nock.Scope =>
  nock('https://dataproviderapi.com', {
    encodedQueryParams: true,
  })
    .get('/')
    .query({
      assetId: '35d707cc-1563-4420-b6fd-ecdd47cfa0d1',
      sortBy: 'recordDate',
      sortOrder: 'DESC',
      page: 1,
      limit: 1,
    })
    .reply(
      200,
      () => ({
        docs: [],
        totalDocs: 0,
        limit: 1,
        totalPages: 1,
        page: 1,
        prevPage: null,
        nextPage: null,
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
