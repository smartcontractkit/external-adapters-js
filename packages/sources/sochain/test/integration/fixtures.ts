import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://sochain.com')
    .get('/api/v2/get_address_balance/BTC/3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz/3')
    .reply(
      200,
      () => ({
        status: 'success',
        data: {
          network: 'BTC',
          address: '3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz',
          confirmed_balance: '0.00000000',
          unconfirmed_balance: null,
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
    .get('/api/v2/get_address_balance/BTC/38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF/3')
    .reply(
      200,
      () => ({
        status: 'success',
        data: {
          network: 'BTC',
          address: '38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF',
          confirmed_balance: '0.00002188',
          unconfirmed_balance: null,
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
