export const mockConnectionTime = new Date('2023-03-08T02:30:00.000Z')

export const mockSubscribeResponse = { msg: 'auth', sta: 1 }

export const mockUSDCADResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTUSDCADSPT:GBL.BIL.QTE.RTM!IC',
  sta: 1,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 6.2,
    BID: 6.3,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'USD',
    MID_PRICE: 6.25,
    FID_515: 'SPT',
    CCY2: 'CAD',
  },
}

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

export const mockSeparateSourcePriceResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTEURUSDSPT:BGK.BIL.QTE.RTM!IC',
  sta: 1,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 1.02,
    BID: 2.01,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'EUR',
    MID_PRICE: 1.55,
    FID_515: 'SPT',
    CCY2: 'USD',
  },
}

export const mockTPPriceResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTEURUSDSPT:GBL.BIL.QTE.RTM!TP',
  sta: 1,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 1.234,
    BID: 1.567,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'EUR',
    MID_PRICE: 1.345,
    FID_515: 'SPT',
    CCY2: 'USD',
  },
}

export const mockInversePriceResponse = {
  msg: 'sub',
  pro: 'OMM',
  rec: 'FXSPTUSDIDRSPT:GBL.BIL.QTE.RTM!IC',
  sta: 1,
  img: 1,
  fvs: {
    VALUE_DT1: null,
    ASK: 0.8064,
    BID: 0.8068,
    ACTIV_DATE: '2023-03-08',
    TIMACT: '02:31:00',
    CCY1: 'USD',
    MID_PRICE: 0.8066,
    FID_515: 'SPT',
    CCY2: 'IDR',
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
    providerIndicatedTimeUnixMs: undefined,
  },
}
