export const mockConnectionTime = new Date('2023-03-08 02:30:00')
const providerIndicatedTimeUnixMs = new Date('2023-03-08 02:31:00')

export const mockSubscribeResponse = { msg: 'auth', sta: 1 }

export const mockPriceResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!IC',
  sta: 1,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 1.054,
    BID: 1.0538,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'EUR',
    MID_PRICE: 1.0539,
    FID_515: 'SPT',
    CCY2: 'USD',
  },
}

export const mockStalePriceResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTJPYUSDSPT:GBL.BIL.QTE.RTM!IC',
  sta: 0,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 0.0073,
    BID: 0.0073,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'JPY',
    MID_PRICE: 0.0073,
    FID_515: 'SPT',
    CCY2: 'USD',
  },
}

export const adapterResponse = {
  result: 1.0539,
  statusCode: 200,
  data: { result: 1.0539 },
  timestamps: {
    providerDataReceivedUnixMs: mockConnectionTime.getTime(),
    providerDataStreamEstablishedUnixMs: mockConnectionTime.getTime(),
    providerIndicatedTimeUnixMs: providerIndicatedTimeUnixMs.getTime(),
  },
}
