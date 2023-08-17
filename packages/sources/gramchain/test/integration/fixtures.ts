import nock from 'nock'

export const mockResponseSuccess = (): nock.Scope =>
  nock('https://api-prod.gramchain.net/api/public', { encodedQueryParams: true })
    .persist()
    .get('/getgrambalances?custodianID=Cache&metalCode=AU&utilizationLockCode=Locked')
    .reply(
      200,
      () => [
        {
          VaultID: 'IDS_DFW1',
          MetalCode: 'AU',
          CustodianID: 'CACHE',
          UtilizationLockCode: 'Locked',
          EntityID: '',
          ItemCategoryCode: 'Bullion',
          NrParcels: 11,
          PureGrams: 1099.89,
          GrossGrams: 1100,
          FixedValuation: 0,
          AsOfUTC: '2022-02-02T02:22:24.293Z',
          MetalName: 'Gold',
          CategoryName: 'Bullion',
          ParcelGrouping: 'Gold Bullion',
          Valuation: 2046.03,
        },
        {
          VaultID: 'LoomSWZ1',
          MetalCode: 'AU',
          CustodianID: 'CACHE',
          UtilizationLockCode: 'Locked',
          EntityID: '',
          ItemCategoryCode: 'Bullion',
          NrParcels: 19,
          PureGrams: 9999,
          GrossGrams: 10000,
          FixedValuation: 0,
          AsOfUTC: '2022-02-02T02:22:24.293Z',
          MetalName: 'Gold',
          CategoryName: 'Bullion',
          ParcelGrouping: 'Gold Bullion',
          Valuation: 18600.27,
        },
        {
          VaultID: 'TSH_SIN1',
          MetalCode: 'AU',
          CustodianID: 'CACHE',
          UtilizationLockCode: 'Locked',
          EntityID: '',
          ItemCategoryCode: 'Bullion',
          NrParcels: 92,
          PureGrams: 82022.89,
          GrossGrams: 82031.1,
          FixedValuation: 0,
          AsOfUTC: '2022-02-02T02:22:24.293Z',
          MetalName: 'Gold',
          CategoryName: 'Bullion',
          ParcelGrouping: 'Gold Bullion',
          Valuation: 152580.06,
        },
      ],
      ['Date', 'Mon, 07 Feb 2022 15:42:34 GMT', 'Content-Type', 'application/json; charset=utf-8'],
    )
