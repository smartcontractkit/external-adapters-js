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
            seqNum: 12345,
            yieldOneDay: '0.000113787',
            yieldSevenDay: '4.17',
            recordDate: '2025-09-11T00:00:00.000Z',
            signedMessage: {
              signature: '',
              content: '',
              hash: '',
              prevHash: '',
              prevSig: '',
              prevContent: '',
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
