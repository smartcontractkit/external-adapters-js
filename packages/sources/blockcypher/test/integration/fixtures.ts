import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api.blockcypher.com/v1', {
    encodedQueryParams: true,
  })
    .get(
      '/btc/main/addrs/3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws/balance?confirmations=6&token=fake-api-key',
    )
    .reply(
      200,
      () => ({
        address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
        total_received: 2111956338035,
        total_sent: 2111956337488,
        balance: 547,
        unconfirmed_balance: 0,
        final_balance: 547,
        n_tx: 19,
        unconfirmed_n_tx: 0,
        final_n_tx: 19,
        txrefs: [
          {
            address: '3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws',
            tx_hash: '37fcec0a27e2a8fc52a34fb2768b2b5b7218452d1e7a099bb0f67c7e87056564',
            tx_input_n: 0,
            tx_output_n: 0,
            value: 649142878298,
            ref_balance: 547,
            confirmations: 0,
            double_spend: false,
          },
        ],
        tx_url: 'https://api.blockcypher.com/v1/btc/main/txs/',
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
