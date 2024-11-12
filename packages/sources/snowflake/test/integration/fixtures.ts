import nock, { Scope } from 'nock'

export const mockSnowflakeResponse = (): Scope =>
  nock('https://test_account.test_region.test_provider.snowflakecomputing.com:443', {
    encodedQueryParams: true,
  })
    .persist()
    .post('/api/statements', {
      database: 'test_database',
      schema: 'test_schema',
      statement:
        "\n        select confirmed\n        from JHU_DASHBOARD_COVID_19_GLOBAL\n        where country_region = 'United States'\n        and province_state = :1\n        and county = :2\n      ",
      bindings: {
        '1': { type: 'TEXT', value: 'Alabama' },
        '2': { type: 'TEXT', value: 'Autauga' },
      },
      resultSetMetaData: { format: 'jsonv2' },
    })
    .reply(
      200,
      {
        resultSetMetaData: {
          numRows: 1,
          format: 'jsonv2',
          partitionInfo: [{ rowCount: 1, uncompressedSize: 9 }],
          rowType: [
            {
              name: 'CONFIRMED',
              database: 'test_database',
              schema: 'test_schema',
              table: 'JHU_DASHBOARD_COVID_19_GLOBAL',
              type: 'fixed',
              byteLength: null,
              scale: 0,
              precision: 38,
              nullable: true,
              collation: null,
              length: null,
            },
          ],
        },
        data: [['10531']],
        code: '090001',
        statementStatusUrl:
          '/api/statements/01a0af11-0000-5d4e-0000-0001316650a5?requestId=e68f6b77-72bd-4b7f-8719-247ac70f6f82',
        requestId: 'e68f6b77-72bd-4b7f-8719-247ac70f6f82',
        sqlState: '00000',
        statementHandle: '01a0af12-0000-5d4d-0000-000131664085',
        message: 'Statement executed successfully.',
        createdOn: 1638467668319,
      },
      [
        'Content-Type',
        'application/json',
        'Date',
        'Thu, 02 Dec 2021 17:54:28 GMT',
        'Expect-CT',
        'enforce, max-age=3600',
        'Link',
        '</api/statements/01a0af11-0000-5d4e-0000-0001316650a5?requestId=c49f5489-38f4-4a90-83b4-56c01f995a68&partition=0>; rel="first",</api/statements/01a0af11-0000-5d4e-0000-0001316650a5?requestId=5d37318b-5d92-45d9-97f1-c0d71667555d&partition=0>; rel="last"',
        'Strict-Transport-Security',
        'max-age=31536000',
        'Vary',
        'Accept-Encoding, User-Agent',
        'X-Content-Type-Options',
        'nosniff',
        'X-Country',
        'Argentina',
        'X-Frame-Options',
        'deny',
        'X-XSS-Protection',
        ': 1; mode=block',
        'Content-Length',
        '907',
        'Connection',
        'Close',
      ],
    )
