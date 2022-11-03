import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.novaposhta.ua/v2.0/json/', {
    encodedQueryParams: true,
  })
    .post('/', {
      apiKey: '',
      modelName: 'TrackingDocument',
      calledMethod: 'getStatusDocuments',
      methodProperties: {
        Documents: [
          {
            DocumentNumber: '59000869676636',
            Phone: '',
          },
        ],
      },
    })
    .reply(
      200,
      () => ({
        success: true,
        data: [
          {
            StatusCode: '3',
          },
        ],
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
