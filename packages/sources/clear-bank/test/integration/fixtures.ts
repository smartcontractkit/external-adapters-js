import nock from 'nock'

export const mockResponseValid = (): nock.Scope =>
  nock('https://institution-api.clearbank.co.uk', {
    encodedQueryParams: true,
  })
    .get('/v3/Accounts')
    .query({
      PageNumber: 1,
      PageSize: 50,
    })
    .reply(200, {
      accounts: [
        {
          id: 'd30797d4-8aa0-4f19-82ab-745207784dc7',
          name: 'Operating Account',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Operating Account',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Operating Account',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Closed',
          statusReason: 'NotProvided',
          iban: 'GB49CLRB04084000000016',
          bban: 'CLRB04084000000017',
        },
        {
          id: 'd1d6bdcd-790c-42a9-9f8b-ef90273a7b04',
          name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB44CLRB04084000000010',
          bban: 'CLRB04084000000010',
        },
        {
          id: 'd30797d4-8aa0-4f19-82ab-745207784dc7',
          name: 'Operating Account',
          label: '',
          type: 'CACC',
          currency: ['AED'],
          balances: [
            {
              name: 'Operating Account',
              amount: 2000000.0,
              currency: 'AED',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Operating Account',
            amount: 0.0,
            currency: 'AED',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB49CLRB04084000000018',
          bban: 'CLRB04084000000017',
        },
        {
          id: 'd30797d4-8aa0-4f19-82ab-745207784dc7',
          name: 'Operating Account',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Operating Account',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Operating Account',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB49CLRB04084000000017',
          bban: 'CLRB04084000000017',
        },
        {
          id: 'd30797d4-8aa0-4f19-82ab-745207784dc7',
          name: 'Operating Account',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Operating Account',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'CLBD',
            },
          ],
          minimumBalance: {
            name: 'Operating Account',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB49CLRB04084000000019',
          bban: 'CLRB04084000000017',
        },
      ],
      halLinks: [
        {
          name: 'self',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts?PageNumber=1&PageSize=50',
          templated: false,
        },
        {
          name: 'Account',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}',
          templated: true,
        },
        {
          name: 'Transactions',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}/Transactions',
          templated: true,
        },
        {
          name: 'Mandates',
          href: 'https://institution-api-sim.clearbank.co.uk/v2/Accounts/{accountId}/Mandates',
          templated: true,
        },
      ],
    })
    .persist()

export const mockResponseSuccessSinglePage1 = (): nock.Scope =>
  nock('https://institution-api.clearbank.co.uk', {
    encodedQueryParams: true,
  })
    .get('/v3/Accounts')
    .query({
      PageNumber: 1,
      PageSize: 1,
    })
    .reply(200, {
      accounts: [
        {
          id: 'd30797d4-8aa0-4f19-82ab-745207784dc7',
          name: 'Operating Account',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Operating Account',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Operating Account',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB49CLRB04084000000017',
          bban: 'CLRB04084000000017',
        },
      ],
      halLinks: [
        {
          name: 'self',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts?PageNumber=1&PageSize=1',
          templated: false,
        },
        {
          name: 'Account',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}',
          templated: true,
        },
        {
          name: 'Transactions',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}/Transactions',
          templated: true,
        },
        {
          name: 'Mandates',
          href: 'https://institution-api-sim.clearbank.co.uk/v2/Accounts/{accountId}/Mandates',
          templated: true,
        },
      ],
    })
    .persist()

export const mockResponseSuccessSinglePage2 = (): nock.Scope =>
  nock('https://institution-api.clearbank.co.uk', {
    encodedQueryParams: true,
  })
    .get('/v3/Accounts')
    .query({
      PageNumber: 2,
      PageSize: 1,
    })
    .reply(200, {
      accounts: [
        {
          id: 'd1d6bdcd-790c-42a9-9f8b-ef90273a7b04',
          name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
          label: '',
          type: 'CACC',
          currency: ['GBP'],
          balances: [
            {
              name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
              amount: 2000000.0,
              currency: 'GBP',
              status: 'VALU',
            },
          ],
          minimumBalance: {
            name: 'Gen Seg Acc Wsale - Blackfridge SC Limited',
            amount: 0.0,
            currency: 'GBP',
            status: 'VALU',
          },
          status: 'Enabled',
          statusReason: 'NotProvided',
          iban: 'GB44CLRB04084000000010',
          bban: 'CLRB04084000000010',
        },
      ],
      halLinks: [
        {
          name: 'self',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts?PageNumber=1&PageSize=1',
          templated: false,
        },
        {
          name: 'Account',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}',
          templated: true,
        },
        {
          name: 'Transactions',
          href: 'https://institution-api-sim.clearbank.co.uk/v3/Accounts/{accountId}/Transactions',
          templated: true,
        },
        {
          name: 'Mandates',
          href: 'https://institution-api-sim.clearbank.co.uk/v2/Accounts/{accountId}/Mandates',
          templated: true,
        },
      ],
    })
    .persist()
