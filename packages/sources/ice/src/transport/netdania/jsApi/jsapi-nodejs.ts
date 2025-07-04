/*
  © NetDania Creations ApS. All rights reserved.

  This is a modified version of proprietary software originally developed and owned by NetDania Creations ApS.
  It may only be used as part of the Chainlink External Adapter (EA) project, and only by Chainlink Labs and Chainlink Node Operators.
  Any use outside this scope - including copying, modifying, or redistribution - is prohibited without prior written permission from NetDania.

  Disclaimer:
  NetDania shall not be liable for any direct, indirect, incidental, or consequential damages,
  including but not limited to loss of profits, arising from the use of this software or its outputs.
  This software is not intended to be relied upon as the sole basis for financial or business decisions.
*/
/* eslint-disable */
//@ts-nocheck
import { XMLHttpRequest } from 'xmlhttprequest'

export const window = { NetDania: {} }
;(window.NetDania.JsApi = {}),
  (window.NetDania.JsApi.Utilities = {}),
  (window.NetDania.JsApi.Response = {}),
  (window.NetDania.JsApi.Request = {})
export const NetDania = window.NetDania
window.location = { host: 'localhost:8080', location: 'localhost:8080' }
void 0 === window.location?.host &&
  (window.location = { host: 'localhost', href: 'http://localhost' }),
  (window.page_unload = !1),
  (function (e) {
    'use strict'
    const t = e.setTimeout,
      i = e.document,
      n = 0
    NetDania.JsApi.jXHR = function () {
      let e,
        s,
        a,
        o = null

      function r() {
        try {
          if (a && a.parentNode) {
            for (const e in (a.parentNode.removeChild(a), a)) delete a[e]
            a = null
          }
        } catch (e) {}
      }

      function E() {
        ;(s = !1), (e = ''), r(), (a = null), l(0)
      }

      function _(t) {
        try {
          o.onerror.call(o, t, e)
        } catch (e) {
          throw new Error(t)
        }
      }

      function A() {
        ;(this.readyState && 'complete' !== this.readyState && 'loaded' !== this.readyState) ||
          s ||
          ((this.onload = this.onreadystatechange = null),
          (s = !0),
          4 !== o.readyState && _('Script failed to load [' + e + '].'),
          r())
      }

      function u() {
        s ||
          _(
            'Script failed to load [' +
              e +
              '], most probably due to an invalid URL or server error.',
          )
      }

      function l(e, t) {
        ;(t = t || []),
          (o.readyState = e),
          (o.status = 200),
          'function' != typeof o.onload
            ? 'function' == typeof o.onreadystatechange && o.onreadystatechange(...t)
            : o.onload(...t)
      }

      return (
        (window.onbeforeunload = function (_e) {
          window.page_unload = !0
        }),
        (o = {
          onerror: null,
          onreadystatechange: null,
          onload: null,
          readyState: 0,
          open(t, i) {
            E()
            var s,
              a = 'cb' + n++
            ;(s = a),
              (NetDania.JsApi.jXHR[s] = function () {
                try {
                  l.call(o, 4, arguments)
                } catch (t) {
                  ;(o.readyState = -1), (o.status = 500), _('Script failed to run [' + e + '].')
                }
                NetDania.JsApi.jXHR[s] = null
              })
            const r = i.toUpperCase().search('CB%3D%3F')
            ;(e =
              -1 != r
                ? i.replace('cb%3D%3F', 'cb%3dNetDania.JsApi.jXHR.' + a)
                : i.replace('cb=?', 'cb=NetDania.JsApi.jXHR.' + a)),
              l(1)
          },
          send() {
            t(function () {
              ;(a = i.createElement('script')).setAttribute('type', 'text/javascript'),
                (a.onload = a.onreadystatechange =
                  function () {
                    A.call(a)
                  }),
                a.setAttribute('src', e),
                i.getElementsByTagName('head')[0].appendChild(a),
                (a.onerror = function () {
                  window.page_unload || u.call(a)
                })
            }, 0),
              l(2)
          },
          setRequestHeader() {},
          getResponseHeader() {
            return ''
          },
          getAllResponseHeaders() {
            return []
          },
        }),
        E(),
        o
      )
    }
  })(window, NetDania.JsApi),
  (NetDania.Events = {}),
  (function () {
    'use strict'
    NetDania.Events = {
      enable() {
        const e = this
        ;(e.listeners = {}),
          (e.fireEvent = function (t, i) {
            NetDania.Events.fireEvent.call(e, t, i)
          }),
          (e.addListener = function (t, i) {
            NetDania.Events.addListener.call(e, t, i)
          }),
          (e.removeListener = function (t, i) {
            NetDania.Events.removeListener.call(e, t, i)
          })
      },
      fireEvent: function (e, t) {
        if (this.listeners[e])
          for (var i = 0; i < this.listeners[e].length; i++) this.listeners[e][i].apply(window, t)
      },
      addListener: function (e, t) {
        this.listeners || NetDania.Events.enable.call(this, e),
          this.listeners[e] || (this.listeners[e] = []),
          t instanceof Function && this.listeners[e].push(t)
      },
      removeListener: function (e, t) {
        if (this.listeners[e] && this.listeners[e].length > 0)
          if (t) {
            for (var i = [], n = 0; n < this.listeners[e].length; n++)
              this.listeners[e][n] != t && i.push(this.listeners[e][n])
            this.listeners[e] = i
          } else this.listeners[e] = []
      },
    }
  })(),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.Utilities.keyStr =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_.'),
      (NetDania.JsApi.encode64 = function (e) {
        for (var t, i, n, s, a, o, r, E = new NetDania.JsApi.StringMaker(), _ = 0; _ < e.length; )
          (s = (t = e.charCodeAt(_++)) >> 2),
            (a = ((3 & t) << 4) | ((i = e.charCodeAt(_++)) >> 4)),
            (o = ((15 & i) << 2) | ((n = e.charCodeAt(_++)) >> 6)),
            (r = 63 & n),
            isNaN(i) ? (o = r = 64) : isNaN(n) && (r = 64),
            E.append(
              NetDania.JsApi.Utilities.keyStr.charAt(s) +
                NetDania.JsApi.Utilities.keyStr.charAt(a) +
                NetDania.JsApi.Utilities.keyStr.charAt(o) +
                NetDania.JsApi.Utilities.keyStr.charAt(r),
            )
        return E.toString()
      }),
      (NetDania.JsApi.mkXHR = function () {
        return new NetDania.JsApi.jXHR()
      }),
      (NetDania.JsApi.getXReqPageSize = function () {
        var e =
            'undefined' != typeof navigator && void 0 !== navigator.userAgent
              ? navigator.userAgent.toLowerCase()
              : 'chrome',
          t = 4
        ;(e.indexOf('chrome') >= 0 || e.indexOf('firefox') >= 0 || e.indexOf('gecko') >= 0) &&
          (t = 20)
        var i = e.indexOf('msie')
        if (i >= 0)
          try {
            parseFloat(e.substring(i + 4)) > 7 && (t = 100)
          } catch (e) {}
        return t
      }),
      (NetDania.JsApi.unpackChartSeries = function (e, t) {
        for (
          var i, n = e.split(','), s = new Array(n.length), a = Math.pow(10, t), o = 0, r = 0;
          r < n.length;
          r++
        )
          (i = parseInt(n[r], 36) + o), (s[r] = i / a), (o = i)
        return (n = a = null), s
      }),
      (NetDania.JsApi.Utilities.GetHost = function () {
        return 'localhost:8080'
      }),
      (NetDania.JsApi.Utilities.GetURL = function () {
        return 'localhost:8080'
      }),
      (NetDania.JsApi.DetectCORSAvailability = function (e) {
        var t = 1
        return (
          'withCredentials' in new XMLHttpRequest()
            ? e && ((NetDania.JsApi.jXHR = XMLHttpRequest), (t = 0))
            : 'undefined' != typeof XDomainRequest &&
              e &&
              ((NetDania.JsApi.jXHR = XDomainRequest), (t = 0)),
          t
        )
      }),
      (NetDania.JsApi.Utilities.ua =
        'undefined' != typeof navigator && void 0 !== navigator.userAgent
          ? navigator.userAgent.toLowerCase()
          : 'chrome'),
      NetDania.JsApi.Utilities.ua.indexOf(' chrome/') >= 0 ||
      NetDania.JsApi.Utilities.ua.indexOf(' firefox/') >= 0 ||
      NetDania.JsApi.Utilities.ua.indexOf(' gecko/') >= 0
        ? (NetDania.JsApi.StringMaker = function () {
            ;(this.str = ''),
              (this.length = 0),
              (this.append = function (e) {
                ;(this.str += e), (this.length += e.length)
              }),
              (this.prepend = function (e) {
                ;(this.str = e + this.str), (this.length += e.length)
              }),
              (this.toString = function () {
                return this.str
              })
          })
        : (NetDania.JsApi.StringMaker = function () {
            ;(this.parts = []),
              (this.length = 0),
              (this.append = function (e) {
                this.parts.push(e), (this.length += e.length)
              }),
              (this.prepend = function (e) {
                this.parts.unshift(e), (this.length += e.length)
              }),
              (this.toString = function () {
                return this.parts.join('')
              })
          })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.Request.getReqObjPrice = function (e, t, i, n) {
        var s = ++NetDania.JsApi.globalCurrentReqId
        return null == n
          ? { t: 1, i: s, m: i ? 1 : 0, s: e, p: t }
          : {
              t: 1,
              i: s,
              m: i ? 1 : 0,
              s: e,
              p: t,
              flt: n,
            }
      }),
      (NetDania.JsApi.Request.getReqObjChart = function (e, t, i, n, s) {
        return {
          t: 2,
          i: ++NetDania.JsApi.globalCurrentReqId,
          m: s ? 1 : 0,
          s: e,
          p: n,
          ts: t,
          pt: i,
        }
      }),
      (NetDania.JsApi.Request.getReqChartHistoryExtended = function (e, t, i, n, s, a, o) {
        return {
          t: 43,
          i: ++NetDania.JsApi.globalCurrentReqId,
          p: n,
          c: { t: 1, s: e, ts: t, pt: i, f: s, i: a, df: o },
        }
      }),
      (NetDania.JsApi.Request.getReqChartHistory = function (e, t, i, n, s, a, o) {
        return {
          t: 12,
          i: ++NetDania.JsApi.globalCurrentReqId,
          m: s ? 1 : 0,
          s: e,
          p: n,
          ts: t,
          pt: i,
          sd: a,
          ed: o,
        }
      }),
      (NetDania.JsApi.Request.getReqObjRemove = function (e) {
        return { t: 5, i: e }
      }),
      (NetDania.JsApi.Request.getReqObjHeadlines = function (e, t, i, n) {
        return { t: 3, i: ++NetDania.JsApi.globalCurrentReqId, m: n ? 1 : 0, s: e, p: i, max: t }
      }),
      (NetDania.JsApi.Request.getReqObjStory = function (e, t) {
        return { t: 4, i: ++NetDania.JsApi.globalCurrentReqId, s: e, p: t }
      }),
      (NetDania.JsApi.Request.getReqObjInstrumentLookup = function (e, t, i, n, s, a, o) {
        return {
          t: 9,
          i: ++NetDania.JsApi.globalCurrentReqId,
          p: o,
          mkt: e,
          fid: t,
          str: i,
          mode: n,
          it: s,
          max: a,
        }
      }),
      (NetDania.JsApi.Request.getReqObjNewsSearch = function (e, t, i, n, s, a, o) {
        return {
          t: 10,
          i: ++NetDania.JsApi.globalCurrentReqId,
          s: e,
          str: t,
          max: i,
          st: n,
          et: s,
          f: a,
          p: o,
        }
      }),
      (NetDania.JsApi.Request.getReqObjAlertAddAlert = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.ADD_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertGetUserActiveAlerts = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_USER_INFORMATION },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertRequestPushDevices = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_PUSH_DEVICES },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertEdit = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.EDIT_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertGet = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_SINGLE_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertDelete = function (e) {
        var t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.DELETE_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertGetDeleted = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_DELETED_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertGetTriggered = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_TRIGGERED_ALERT },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertsGetDeleted = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_DELETED_ALERTS },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertsGetTriggered = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_TRIGGERED_ALERTS },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertMonitorUserActivity = function (e) {
        const t = {
          t: 37,
          m: 1,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.MONITOR_USER_ACTIVITIES },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertDisconnectMonitorUserActivity = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.DISCONNECT_USER_ACTIVITIES },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertMonitorUser = function (e) {
        const t = {
          t: 37,
          m: 1,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.MONITOR_USER },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertDisconnectMonitorUser = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.DISCONNECT_USER },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjAlertGetPushDevices = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.GET_PUSH_DEVICES },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjIPLocation = function () {
        return { t: 38, i: ++NetDania.JsApi.globalCurrentReqId }
      }),
      (NetDania.JsApi.Request.getReqCloseConnection = function () {
        return { t: 39, i: ++NetDania.JsApi.globalCurrentReqId, c: 0 }
      }),
      (NetDania.JsApi.Request.getReqSuspendConnection = function () {
        return { t: 39, i: ++NetDania.JsApi.globalCurrentReqId, c: 1 }
      }),
      (NetDania.JsApi.Request.getReqObjAlertAddUser = function (e) {
        const t = {
          t: 37,
          i: ++NetDania.JsApi.globalCurrentReqId,
          o: { f: [], i: NetDania.JsApi.Alert.Commands.ADD_USER },
        }
        return (t.o.f = NetDania.JsApi.Alert.GetFieldsFromAlertObject(e)), t
      }),
      (NetDania.JsApi.Request.getReqObjWorkspace = function (e, t) {
        return {
          t: 40,
          i: ++NetDania.JsApi.globalCurrentReqId,
          m: t ? 1 : 0,
          rid: e,
          data: !0,
          ims: -1,
        }
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (e.NetDania.JsApi.Alert = e.NetDania.JsApi.Alert || {}),
      (NetDania.JsApi.Alert.AlertObject = function () {
        ;(this.ALERT_ID = -1),
          (this.USER_ID = ''),
          (this.PREVIOUS_OWNER = ''),
          (this.ALERT_CONDITION = ''),
          (this.DAYS_TO_LIVE = ''),
          (this.SMS_PHONE_NUMBER = ''),
          (this.SMS_FROM_NAME = ''),
          (this.SMS_MESSAGE = ''),
          (this.EMAIL_ADDRESS = ''),
          (this.EMAIL_FROM = ''),
          (this.EMAIL_SUBJECT = ''),
          (this.EMAIL_CONTENT = ''),
          (this.YAHOO_ID = ''),
          (this.YAHOO_MESSAGE = ''),
          (this.SKYPE_ID = ''),
          (this.SKYPE_MESSAGE = ''),
          (this.MSN_ID = ''),
          (this.MSN_MESSAGE = ''),
          (this.TRIGGER_DATE = -1),
          (this.ORDER_TYPE = ''),
          (this.PUSH_DEVICES_ID = ''),
          (this.PUSH_MESSAGE = ''),
          (this.IS_ALERT_CENTRAL = ''),
          (this.ALERTS_INCLUDED = ''),
          (this.USER_DETAILS_INCLUDED = ''),
          (this.COOKIE = ''),
          (this.STARTDATE = ''),
          (this.ENDDATE = ''),
          (this.TIMESCALE_SECONDS = 0),
          (this.DELETION_REASON = ''),
          (this.MAX_ALERTS = -1),
          (this.MAX_ALERTS_TEMPLATES = -1)
      }),
      (NetDania.JsApi.Alert.GetFieldsFromAlertObject = function (e) {
        for (
          var t = [], i = Object.keys(new NetDania.JsApi.Alert.AlertObject()), n = 0;
          n < i.length;
          n++
        ) {
          var s = {}
          ;(s.v = [e[i[n]]]),
            '' != s.v &&
              -1 != s.v &&
              0 != s.v &&
              ((s.f = NetDania.JsApi.Alert.Fields[i[n]]),
              (s.t = NetDania.JsApi.Alert.FieldTypes[i[n]]),
              t.push(s))
        }
        return ((s = {}).f = 1), (s.t = 2), (s.v = [NetDania.JsApi.Utilities.GetHost()]), t
      }),
      (NetDania.JsApi.Alert.ErrorCodes = {
        GENERAL_ERROR: 0,
        ADD_ALERT_USER_NOT_FOUND_ERROR: 1,
        ADD_ALERT_INCORRECT_CONDITION_ERROR: 2,
        ADD_ALERT_ENGINE_ADD_ALERT_ERROR: 3,
        ADD_ALERT_MAX_ALERTS_EXCEEDED_ERROR: 4,
        ADD_ALERT_GENERAL_ERROR: 5,
        USER_ADD_GENERAL_ERROR: 6,
        USER_DELETE_GENERAL_ERROR: 7,
        USER_UPDATE_GENERAL_ERROR: 8,
        GET_USER_INFO_USER_NOT_FOUND_ERROR: 9,
        GET_USER_INFO_GENERAL_ERROR: 10,
        GET_TRIGGERED_ALERTS_GENERAL_ERROR: 11,
        GET_DELETED_ALERTS_GENERAL_ERROR: 12,
        GET_SENT_MESSAGES_GENERAL_ERROR: 13,
        DELETE_ALERT_USER_NOT_FOUND_ERROR: 14,
        DELETE_ALERT_ALERT_ID_NOT_FOUND_ERROR: 15,
        DELETE_ALERT_GENERAL_ERROR: 16,
        EDIT_ALERT_NO_NEW_ALERT_ERROR: 17,
        EDIT_ALERT_ALERT_ID_NOT_FOUND_ERROR: 18,
        EDIT_ALERT_USER_NOT_FOUND_ERROR: 19,
        EDIT_ALERT_MAX_ALERTS_VIOLATION_ERROR: 20,
        EDIT_ALERT_ENGINE_ADD_ALERT_ERROR: 21,
        EDIT_ALERT_GENERAL_ERROR: 22,
        GET_USER_GROUP_USERS_GENERAL_ERROR: 23,
        TRIGGER_ALERT_ALERT_ID_NOT_FOUND_ERROR: 24,
        TRIGGER_ALERT_USER_NOT_FOUND_ERROR: 25,
        TRIGGER_ALERT_GENERAL_ERROR: 26,
        GET_SINGLE_ALERT_GENERAL_ERROR: 27,
        GET_SINGLE_ALERT_ID_NOT_FOUND: 28,
        GET_USERGROUP_ALERTS_GENERAL_ERROR: 29,
        MOVE_ALERTS_GENERAL_ERROR: 30,
        MOVE_ALERTS_DESTINATION_USER_ERROR: 31,
        MOVE_ALERTS_INVALID_GROUP_LENGTH_ERROR: 32,
      }),
      (NetDania.JsApi.Alert.Fields = {
        ERROR_CODE: 0,
        USER_GROUP: 1,
        USER_ID: 2,
        STARTDATE: 3,
        ENDDATE: 4,
        ALERT_ID: 5,
        PREVIOUS_OWNER: 6,
        ALERT_CONDITION: 7,
        DAYS_TO_LIVE: 8,
        EXPIRATION_DATE: 9,
        SMS_PHONE_NUMBER: 10,
        SMS_FROM_NAME: 11,
        SMS_MESSAGE: 12,
        EMAIL_ADDRESS: 13,
        EMAIL_FROM: 14,
        EMAIL_SUBJECT: 15,
        EMAIL_CONTENT: 16,
        YAHOO_ID: 17,
        YAHOO_MESSAGE: 18,
        SKYPE_ID: 19,
        SKYPE_MESSAGE: 20,
        MSN_ID: 21,
        MSN_MESSAGE: 22,
        TRIGGER_DATE: 23,
        USER_INFO: 24,
        MAX_ALERTS: 25,
        MAX_ALERTS_TEMPLATES: 26,
        CURRENT_ALERTS_NO: 26,
        DELETION_DATE: 27,
        DELETION_REASON: 28,
        PUSH_DEVICES_ACTION: 29,
        PUSH_DEVICES_TOKEN: 30,
        PUSH_DEVICES_TYPE: 31,
        PUSH_DEVICES_ID: 32,
        PUSH_BADGE_VALUE: 33,
        PUSH_DEVICES_ARRAY: 34,
        PUSH_DEVICES: 35,
        ORDER_TYPE: 36,
        IS_ALERT_CENTRAL: 37,
        ALERTS_INCLUDED: 38,
        ALERTS_HOLDER: 39,
        USER_ALERTS: 40,
        USER_DETAILS_INCLUDED: 41,
        USER_HOLDER: 42,
        PUSH_DEVICES_NAME: 43,
        DATA_HOLDER: 44,
        MONITOR_HOLDER: 45,
        MONITOR_USER: 46,
        MONITOR_USER_ACTIVITIES: 47,
        TIMESTAMP: 48,
        STORY_ID: 49,
        HEADLINE: 50,
        NEWS_HOLDER: 51,
        MONITOR_USERS: 52,
        SOURCE_PROVIDER: 53,
        NEWS_ID: 54,
        MARKED_NEWS_NO: 55,
        PUSH_APP_NAME: 56,
        PUSH_MESSAGE: 57,
        PUSH_MESSAGE_TYPE: 58,
        INSTRUMENT: 59,
        PROVIDER: 60,
        INSTRUMENT_NAME: 61,
        TRIGGER_LEVEL: 62,
        OPERATOR: 63,
        ALERT_LEVEL: 64,
        NEWS_INCLUDED: 65,
        MARKED_ALERT_NO: 66,
        REAL_USER_GROUP: 67,
        PUSH_DEVICE_STATE: 68,
        DELETE_BIND: 69,
        REQUEST_ID: 70,
        COMPRESSION: 71,
        MONITOR: 72,
        NOTIFICATION_TYPE: 73,
        NEW_CONTACTS: 74,
        MOVE_SOURCE_DETAILS: 75,
        CONTACTS: 76,
        MOVED_ALERT_IDS: 77,
        NEWS_FIELD: 78,
        TRIGGER_VALUE: 79,
        SENT_DATE: 80,
        MAIL_HOLDER: 81,
        SMS_HOLDER: 82,
        DESTINATION_ID: 83,
        MESSAGE: 84,
        MESSAGE_HOLDER: 85,
        COOKIE: 86,
        HEARTBEAT_COUNTER: 87,
        ALIAS: 88,
        ACCOUNT_ID: 89,
        TRADING_EVENT_SUBSCRIPTION_ID: 90,
        TOKEN_VERSION: 91,
        TRADING_EVENTS_SUBSCRIBE: 92,
        PUSH_LAST_ACTION_TIMESTAMP: 93,
        PUSH_SOURCES: 94,
        START_INDEX_USER: 95,
        NO_OF_ROWS_USER: 96,
        START_INDEX_ALERT: 5,
        NO_OF_ROWS_ALERT: 6,
        PUSH_DEVICENAME: 97,
        DELETE_DEVICES: 98,
        PUSH_COUNTRY: 99,
        TRADE_AMOUNT: 100,
        TRADE_LEVEL: 101,
        TRADE_STATUS: 102,
        TRADE_INCLUDED: 103,
        TRADES_HOLDER: 104,
        TIMESCALE_SECONDS: 105,
      }),
      (NetDania.JsApi.Alert.Fields.Error = {
        ERROR_CODE: 0,
        ERROR_CODE_DESCRIPTION: 1,
        ERROR_DETAILS: 2,
      }),
      (NetDania.JsApi.Alert.FieldTypes = {
        ALERT_ID: 8,
        USER_ID: 2,
        PREVIOUS_OWNER: 2,
        ALERT_CONDITION: 2,
        DAYS_TO_LIVE: 7,
        SMS_PHONE_NUMBER: 2,
        SMS_FROM_NAME: 2,
        SMS_MESSAGE: 2,
        EMAIL_ADDRESS: 2,
        EMAIL_FROM: 2,
        EMAIL_SUBJECT: 2,
        EMAIL_CONTENT: 2,
        YAHOO_ID: 2,
        YAHOO_MESSAGE: 2,
        SKYPE_ID: 2,
        SKYPE_MESSAGE: 2,
        MSN_ID: 2,
        MSN_MESSAGE: 2,
        TRIGGER_DATE: 8,
        ORDER_TYPE: 2,
        NO_OF_ROWS_ALERT: 7,
        START_INDEX_ALERT: 7,
        NO_OF_ROWS_USER: 7,
        START_INDEX_USER: 7,
        PUSH_DEVICES: 2,
        PUSH_DEVICES_ID: 2,
        PUSH_MESSAGE: 2,
        DELETION_REASON: 2,
        MAX_ALERTS: 7,
        MAX_ALERTS_TEMPLATES: 7,
        COOKIE: 2,
        TIMESCALE_SECONDS: 3,
      }),
      (NetDania.JsApi.Alert.NotificationTypes = {
        ALERT_ADDED: 1,
        ALERT_DELETED: 2,
        ALERT_EDITED: 3,
        TRIGGERED_NEWS_ALERT: 4,
        TRIGGERED_PRICE_ALERT: 5,
        ALERT_MOVED_FROM: 6,
        ALERT_MOVED_TO: 7,
        ALERT_USER_DELETED: 8,
        ALERT_USER_ADDED: 9,
        PUSH_DEVICES_CHANGED: 10,
      }),
      (NetDania.JsApi.Alert.ObjectType = {
        TYPE_OBJECT_END: 0,
        TYPE_OBJECT: 1,
        _TYPE_STRING: 2,
        TYPE_BOOLEAN: 3,
        TYPE_BYTE: 4,
        TYPE_SHORT: 5,
        TYPE_CHAR: 6,
        TYPE_INT: 7,
        TYPE_LONG: 8,
        TYPE_FLOAT: 9,
        TYPE_DOUBLE: 10,
      }),
      (NetDania.JsApi.Alert.Commands = {
        BIND_PUSH_DEVICE: 1,
        UNBIND_PUSH_DEVICE: 2,
        GET_PUSH_DEVICES: 3,
        GET_PUSH_BINDINGS: 4,
        SET_PUSH_BADGE: 5,
        ADD_ALERT: 6,
        GET_USER_INFORMATION: 7,
        USER_DETAILS: 8,
        ALERT: 9,
        USER_ALERTS: 10,
        GET_SINGLE_ALERT: 11,
        GET_TRIGGERED_ALERTS: 12,
        GET_DELETED_ALERTS: 13,
        GET_TRIGGERED_ALERT: 61,
        GET_DELETED_ALERT: 62,
        EDIT_ALERT: 14,
        MONITOR_USER: 15,
        NEWS: 16,
        GET_UNREAD_NEWS: 17,
        MONITOR_USER_GROUP: 18,
        MARK_UNREAD_NEWS: 19,
        SEND_PUSH_MESSAGE: 20,
        MARK_UNREAD_PUSH_ALERTS: 21,
        GET_PUSH_ALERT_INFO: 22,
        SEND_NEWS_FLASH: 23,
        ADD_USER: 24,
        NOTIFICATION: 25,
        MONITOR_USER_ACTIVITIES: 26,
        DISCONNECT_USER_ACTIVITIES: 27,
        DELETE_USER: 28,
        DELETE_ALERT: 29,
        GET_USERGROUP_USERS: 30,
        DELETE_ALERT_LIST: 31,
        MOVE_ALERTS: 32,
        UPDATE_USER: 33,
        DISCONNECT_USER: 34,
        GET_SENT_MESSAGES: 35,
        ERROR: 255,
        OK: 0,
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.Response.MonitorChartResponse = function (e, t, i) {
        return {
          type: t,
          id: i,
          data: e,
          get: function (t) {
            if (null != e) for (const i = 0; i < e.length; i++) if (e[i].f == t) return e[i].v
            return null
          },
          getDecimals: function (t) {
            if (null != e) for (const i = 0; i < e.length; i++) if (e[i].f == t) return e[i].d
            return 0
          },
        }
      }),
      (NetDania.JsApi.Response.HistoricalChartResponse = function (e, t, i) {
        return {
          type: t,
          id: i,
          data: e,
          get(t) {
            if (null != e) for (var i = 0; i < e.length; i++) if (e[i].f == t) return e[i].v
            return null
          },
          getDecimals(t) {
            if (null != e) for (var i = 0; i < e.length; i++) if (e[i].f == t) return e[i].d
            return 0
          },
        }
      }),
      (NetDania.JsApi.Response.ChartUpdateResponse = function (e, t, i, n) {
        const s = {
          type: t,
          id: i,
          data: e,
          ts: n,
          getClose() {
            if (null !== e)
              for (const t = 0; t < e.length; t++)
                if (e[t].f == NetDania.JsApi.Fields.CHART_CLOSE) return e[t].v
            return 'N/A'
          },
          getVolume() {
            if (null !== e)
              for (var t = 0; t < e.length; t++)
                if (e[t].f == NetDania.JsApi.Fields.CHART_VOLUME) return e[t].v
            return 'N/A'
          },
        }
        return (s.close = s.getClose()), (s.volume = s.getVolume()), s
      }),
      (NetDania.JsApi.Response.AlertAddedResponse = function (e, t, i) {
        return {
          type: t,
          id: i,
          data: e,
          get: function (t) {
            for (var i = 0; i < e.length; i++) if (e[i].f == t) return e[i].v
            return null
          },
        }
      }),
      (NetDania.JsApi.Response.AlertActive = function (e, t, i) {
        return {
          type: t,
          id: i,
          data: e,
          get(t) {
            for (var i = 0; i < e.length; i++) if (e[i].f == t) return e[i].v
            return null
          },
        }
      }),
      (NetDania.JsApi.Response.MonitorPriceResponse = function (e, t, i) {
        var n = e && e.f ? e.f : null,
          s = {
            type: t,
            id: i,
            data: n,
            modifiedFids: [],
            getFIDs: function () {
              var e = []
              if (null !== n) for (var t = 0; t < n.length; t++) e.push(n[t].f)
              return e
            },
            get: function (e) {
              if (null === n || !NetDania.ArrayUtils.arrayContains(this.getFIDs(n), e)) return 'N/A'
              for (var t = 0; t < n.length; t++) if (n[t].f === e) return n[t].v
            },
          }
        return (s.modifiedFids = s.getFIDs()), s
      }),
      (NetDania.JsApi.Response.NewsHistoryResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.LookupResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.MonitorNewsResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.NewsStoryResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.NewsSearchResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.IPLocationResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.GeneralMonitorResponse = function (e, t, i) {
        return { type: t, id: i, data: e }
      }),
      (NetDania.JsApi.Response.ErrorResponse = function (e, t, i) {
        return { type: t, id: i, code: e }
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.Events = {
        ONCONNECTED: 'OnConnected',
        ONUPDATE: 'OnUpdate',
        ONRAWUPDATE: 'OnRawUpdate',
        ONDISCONNECTED: 'OnDisconnected',
        ONINIT: 'OnInit',
        ONRECONNECTED: 'OnReconnect',
        ONPRICEUPDATE: 'OnPriceUpdate',
        ONCHARTUPDATE: 'OnChartUpdate',
        ONHISTORICALDATA: 'OnHistoricalData',
        ONERROR: 'OnError',
        ONINFO: 'OnInfo',
        ONLOOKUP: 'OnLookup',
        ONHISTORICALHEADLINES: 'OnHistHeadlines',
        ONHEADLINEUPDATE: 'OnHeadlineUpdate',
        ONNEWSSTORY: 'OnNewsHist',
        ONNEWSSEARCH: 'OnNewsSearch',
        ONALERTADDED: 'OnAlertAdded',
        ONALERTDELETE: 'OnAlertDelete',
        ONALERTDISCONNECTMONITORUSER: 'OnAlertDisconnectMonitorUser',
        ONALERTDISCONNECTMONITORUSERACTIVITY: 'OnAlertDisconnectMonitorUserActivity',
        ONALERTEDIT: 'OnAlertEdit',
        ONALERTGET: 'OnAlertGet',
        ONALERTGETDELETED: 'OnAlertGetDeleted',
        ONALERTGETTRIGGERED: 'OnAlertGetTriggered',
        ONALERTSGETDELETED: 'OnAlertsGetDeleted',
        ONALERTSGETTRIGGERED: 'OnAlertsGetTriggered',
        ONALERTGETACTIVE: 'OnAlertGetActive',
        ONALERTMONITORUSER: 'OnAlertMonitorUser',
        ONALERTMONITORUSERACTIVITY: 'OnAlertMonitorUserActivity',
        ONALERTGETPUSHDEVICES: 'OnAlertGetPushDevices',
        ONALERTUSERADDED: 'OnAlertUserAdded',
        ONIPLOCATIONRESPONSE: 'OnIPLocationResponse',
        ONWORKSPACEDATA: 'OnWorkspaceData',
        ONHISTORICALCHARTDATA: 'OnHistoricalChartData',
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.Messages = {
        DISCONNECT_MSG: 'Disconnected from server',
        HISTORICAL_DATA_MSG: 'historical data...',
        HISTORICAL_CHART_MSG: 'historical CHART data...',
        CONNECTING_MSG: 'connecting...',
        RECONNECTING_MSG: 'reconnecting...',
        RESUME_SUSPENDED_MSG: 'resume...',
        PRICE_UPDATE_MSG: 'price update...',
        CHART_UPDATE_MSG: 'chart update...',
        HISTORICAL_HEADLINES_MSG: 'historical headlines...',
        HEADLINE_UPDATE_MSG: 'headline update...',
        HEADLINE_STORY_MSG: 'headline update...',
        HEADLINE_SEARCH_MSG: 'headline update...',
        LOOKUP_MSG: 'headline update...',
        INVALID_HOST_ERR_MSG: 'Error: Invalid host',
        INSTRUMENT_ALREADY_ADDED_ERR_MSG: 'Error: instrument already added.',
        ALERT_ADDED: 'Alert added.',
        ALERT_DELETED: 'Alert deleted.',
        ALERT_DISCONNECTED_MONITORUSER: 'Alert monitor user disconnected.',
        ALERT_DISCONNECTED_MONITORUSER_ACTIVITY: 'Alert monitor user activity disconnected.',
        ALERT_EDIT: 'Alert edited.',
        ALERT_GET: 'Alert get.',
        ALERTS_GET_DELETED: 'Alerts get deleted.',
        ALERTS_GET_TRIGGERED: 'Alerts get triggered.',
        ALERT_GET_DELETED: 'Alert get deleted.',
        ALERT_GET_TRIGGERED: 'Alert get triggered.',
        ALERT_GET_ACTIVE: 'Alert get active received.',
        ALERT_MONITORUSER: 'Alert monitor user.',
        ALERT_MONITORUSER_ACTIVITY: 'Alert monitor user activity',
        ALERT_GET_PUSH_DEVICES: 'Alert push devices received',
        IP_LOCATION: 'IP Location received',
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.ConnectionStatus = {
        LOGIN_OK: { code: 0, message: 'LOGIN_OK' },
        LOGIN_ERROR: { code: 1, message: 'LOGIN_ERROR' },
        LOGIN_ERROR_INVALID_USERGROUP: { code: 3, message: 'LOGIN_ERROR_INVALID_USERGROUP' },
        LOGIN_ERROR_SERVICE_NOT_ALLOWED: { code: 4, message: 'LOGIN_ERROR_SERVICE_NOT_ALLOWED' },
      }),
      (NetDania.JsApi.ConnectionType = {
        AUTO: '0',
        STREAMING: '1',
        POLLING: '2',
        LONGPOLLING: '3',
      }),
      (NetDania.JsApi.PoolingInterval = { AUTO: '0' }),
      (NetDania.JsApi.Connections = []),
      (NetDania.JsApi.TryCreateConnection = function (e, t) {
        var i
        if (void 0 !== NetDania.JsApi.Connections && null != NetDania.JsApi.Connections)
          for (var n = 0; n < NetDania.JsApi.Connections.length; n++)
            if (
              ((i = NetDania.JsApi.Connections[n]),
              void 0 !== t.behavior &&
                (i.behavior == t.behavior || t.behavior == NetDania.JsApi.ConnectionType.AUTO) &&
                void 0 !== t.host &&
                i.host == t.host &&
                (void 0 === t.token || (void 0 !== t.token && i.token == t.token)) &&
                void 0 !== t.v &&
                i.v == t.v &&
                ((void 0 !== t.appId &&
                  i._appId == t.appId &&
                  ((void 0 !== t.force && 1 == t.force) || void 0 === t.force)) ||
                  void 0 === t.appId ||
                  (void 0 !== t.appId &&
                    i._appId != t.appId &&
                    (void 0 === t.force || 0 == t.force))))
            )
              return (
                void 0 !== t.pollingInterval &&
                  t.pollingInterval != NetDania.JsApi.PoolingInterval.AUTO &&
                  t.pollingInterval < i.interval &&
                  (i.instance.setPollingInterval(t.pollingInterval),
                  (i.interval = t.pollingInterval)),
                { c: i, n: !1 }
              )
        return (
          t.behavior == NetDania.JsApi.ConnectionType.AUTO &&
            (t.behavior = NetDania.JsApi.ConnectionType.POLLING),
          t.pollingInterval == NetDania.JsApi.PoolingInterval.AUTO &&
            (t.behavior == NetDania.JsApi.ConnectionType.LONGPOLLING
              ? (t.pollingInterval = 0)
              : (t.pollingInterval = 1e3)),
          (null != t.pollingInterval && null != t.pollingInterval) ||
            t.behavior != NetDania.JsApi.ConnectionType.LONGPOLLING ||
            (t.pollingInterval = 0),
          (i = {
            v: t.v,
            host: t.host,
            behavior: t.behavior,
            instance: e,
            interval: t.pollingInterval,
            failoverHosts: t.failoverHosts,
            _appId: t.appId,
            token: t.token,
          }),
          (NetDania.JsApi.Connections = NetDania.JsApi.Connections || []),
          NetDania.JsApi.Connections.push(i),
          { c: i, n: !0 }
        )
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.globalCurrentReqId = 0)
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection = function (e) {
        e.v || (e.v = 5),
          void 0 === e.proxy && (e.proxy = !1),
          (void 0 !== e.host && null !== e.host && '' !== e.host) ||
            (e.host = 'http://balancer.netdania.com/StreamingServer/StreamingServer')
        var t = this
        ;(this.config = e),
          (this.STREAM_STARTED_INTERVAL = 3e4),
          (this.FAILOVER_RECOVERY_INTERVAL = 3e4),
          (this.STREAMMING_UP_CHECK_NTERVAL = 15e3),
          (this.HEARTBEAT_INTERVAL = 18e4),
          (this.SUSPEND_CONNECTION_WAIT_INTERVAL = 15e3),
          (this.POLLING_TIMEOUT =
            e.behavior == NetDania.JsApi.ConnectionType.LONGPOLLING ? 3e4 : 2e4),
          (this.REQUEST_INSTRUMENT_TIMEOUT = 1e4),
          (this.STREAMMING_MAX_BUFFER =
            null !== e.maxBuffer && void 0 !== e.maxBuffer && '' !== e.maxBuffer
              ? e.maxBuffer
              : 1e4)
        var i,
          n = NetDania.JsApi.TryCreateConnection(this, e)
        if (!n.n) return n.c.instance
        if (
          ((this._defaultAppId = 'NodeJSAPIv1.5.2'),
          e.appId && !this._appId
            ? (this._appId = e.appId)
            : this._appId || (this._appId = this._defaultAppId),
          (this.Observer = new NetDania.UpdatesObserver()),
          (this._pollingInterval = 1e3),
          (this._xreqPageSize = NetDania.JsApi.getXReqPageSize()),
          null !== e.pollingInterval &&
            void 0 !== e.pollingInterval &&
            '' !== e.pollingInterval &&
            ((this._pollingInterval = parseInt(e.pollingInterval, 10)),
            e.behavior != NetDania.JsApi.ConnectionType.LONGPOLLING
              ? this._pollingInterval < 1e3
                ? (this._pollingInterval = 1e3)
                : this._pollingInterval > 2e4 && (this._pollingInterval = 2e4)
              : 0 != this._pollingInterval &&
                this._pollingInterval > 2e4 &&
                (this._pollingInterval = 2e4)),
          null !== e.token && void 0 !== e.token && '' !== e.token && (this._token = e.token),
          (this.debugLevel = void 0 !== e.debugLevel && null !== e.debugLevel ? e.debugLevel : 5),
          (this._byteConnBehavior = e.behavior),
          (this._byteDeliveryType = 1),
          (this._sessionId = null),
          (this._useCors = !this.config.proxy),
          void 0 !== this.config.tryReconnect && null !== this.config.tryReconnect
            ? (this._tryReconnect = this.config.tryReconnect)
            : (this._tryReconnect = !0),
          (this._byteDeliveryType = NetDania.JsApi.DetectCORSAvailability(this._useCors)),
          (this._isSuspending = !1),
          (this._isSuspended = !1),
          (this._isConnected = !1),
          (this._isDisconnected = !1),
          (this._requestList = []),
          (this._requestQueue = []),
          (this._isFlushed = !1),
          (this._pollingFunction = null),
          (this._bufferPosition = 0),
          (this._handshakeMade = !1),
          (this._connectStartTime = +new Date()),
          (this._username = null),
          (this._usergroup = null),
          (this._password = null),
          void 0 !== e.password && null !== e.password)
        ) {
          if (!('string' == typeof e.password || e.password instanceof String))
            throw new Error('Password should be a string value')
          if ('' === e.password) throw new Error('Password should not be empty')
          if (e.password.length < 2)
            throw new Error('Password length should be greater than or equal to 2')
          this._password = e.password
        }
        if (void 0 !== e.usergroup && null !== e.usergroup) {
          if (!('string' == typeof e.usergroup || e.usergroup instanceof String))
            throw new Error('Usergroup should be a string value')
          if ('' === e.usergroup) throw new Error('Usergroup value should not be empty')
          if (e.usergroup.length < 2)
            throw new Error('Usergroup length should be greater than or equal to 2')
          this._usergroup = e.usergroup
        }
        if (void 0 !== e.username && null !== e.username) {
          if (!('string' == typeof e.username || e.username instanceof String))
            throw new Error('Username should be a string value')
          if ('' === e.username) throw new Error('Username value should not be empty')
          if (e.username.length < 2)
            throw new Error('Username length should be greater than or equal to 2')
          this._usergroup = e.username
        }
        if (null === this._usergroup && (null === this._token || void 0 === this._token)) {
          var s = NetDania.JsApi.Utilities.GetHost()
          if ('' === s || null == s) throw new Error(NetDania.JsApi.Messages.INVALID_HOST_ERR_MSG)
          this._usergroup = s
        }
        if (
          !(
            (null !== this._usergroup && void 0 !== this._usergroup) ||
            (null !== this._token && void 0 !== this._token)
          )
        )
          throw new Error('Please provide an usergroup/password or token')
        ;(this._xreq = null),
          (this._pending = !1),
          (this._pollingParams = null),
          (this.doPollingFunction =
            ((i = this),
            function () {
              i.doPolling()
            })),
          (this._onInfoFunction = function (e, i, n = 4) {
            t.debugLevel <= n && t.fireEvent(NetDania.JsApi.Events.ONINFO, [e, i])
          }),
          (this._onTimeoutFunction = function (e, i) {
            t._onConnectionErrorFunction(e, i)
          }),
          (this._onErrorFunction = function (e, i, n = 4) {
            t.debugLevel <= n && t.fireEvent(NetDania.JsApi.Events.ONERROR, [e, i])
          }),
          (this._onConnectionErrorFunctionApendRequest = function (e) {
            t._onConnectionErrorFunction('Append request error connection', e)
          }),
          (this._onConnectionErrorFunction = function (e, i) {
            var n = null != e ? e : 'error connection'
            t._onErrorFunction(n, i, 4),
              t.fireEvent(NetDania.JsApi.Events.ONDISCONNECTED, [n, i]),
              (t._pending = !1),
              (t._isConnected = !1),
              (t._handshakeMade = !1),
              (t._bufferPosition = 0),
              (t._isSuspended = !1),
              (t._isSuspending = !1),
              void 0 !== t.config.failoverHosts &&
                null !== t.config.failoverHosts &&
                t.config.failoverHosts.length > 0 &&
                (t._isFailoverActive
                  ? ((t._currentFailover += 1),
                    t._currentFailover >= t.config.failoverHosts.length &&
                      ((t._currentFailover = 0), (t._isFailoverActive = !1)))
                  : ((t._isFailoverActive = !0), (t._currentFailover = 0)),
                t.ensureFailoverRecoveryTimerStarted(),
                t.ensureHeartBeatTimerStarted()),
              t.reconnect()
          }),
          NetDania.Events.enable.call(this)
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection.prototype.Connect = function (e) {
        var t = this
        if (
          (!(this._isConnected || (this._xreq && this._pending)) || this._isSuspended) &&
          ((this._requestQueue.length > 0 && this._isFlushed) || e || this._isSuspended)
        ) {
          ;(this._xreq = NetDania.JsApi.mkXHR()),
            (this._pending = !0),
            (this._isDisconnected = !1),
            !1 !== e && (this._handshakeMade = !1),
            this._isSuspended
              ? this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                  NetDania.JsApi.Messages.RESUME_SUSPENDED_MSG,
                ])
              : this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                  NetDania.JsApi.Messages.CONNECTING_MSG,
                ])
          var i = {
            g: this._usergroup,
            ai: this._appId,
            pr: this._byteConnBehavior,
            au: NetDania.JsApi.Utilities.GetURL(),
            qup: 1,
            t: this._token,
          }
          null !== this._password && (i.p = this._password),
            null !== this._username && (i.u = this._username)
          var n,
            s,
            a = NetDania.JsApi.encode64(JSON.stringify(i))
          if (
            (this._requestQueue.length > 0 && this._isFlushed) ||
            (e && this._requestList.length > 0)
          ) {
            e &&
              this._requestList.length > 0 &&
              ((this._requestQueue = this._requestList), (this._isFlushed = !0))
            var o = ''
            if (this._requestQueue.length > 0) {
              var r = this._requestQueue.slice(0, this._xreqPageSize)
              ;(this._requestQueue = this._requestQueue.slice(
                this._xreqPageSize,
                this._requestQueue.length,
              )),
                (o = NetDania.JsApi.encode64(JSON.stringify(r))),
                0 == this._requestQueue.length && (this._isFlushed = !1)
            }
          }
          this._isSuspended
            ? ((this._isFlushed = !0),
              (s =
                '?dt=' +
                this._byteDeliveryType +
                '&sessid=' +
                this._sessionId +
                '&cb=?&xresume&ts=' +
                +new Date()))
            : (s =
                '?xstream=1&v=' +
                this.config.v +
                '&dt=' +
                this._byteDeliveryType +
                '&h=' +
                a +
                '&xcmd=' +
                o +
                '&cb=?&ts=' +
                +new Date()),
            this.config.proxy,
            this._isFailoverActive
              ? ((this.m_host = this.config.failoverHosts[this._currentFailover]),
                (n = this.m_host + s))
              : ((this.m_host = this.config.host), (n = this.m_host + s)),
            this._onInfoFunction('Connecting:', n, 0),
            (this._streamStartFuncTimer = function () {
              if (
                t._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING &&
                null !== t._connectStartTime
              ) {
                if (+new Date() - t._connectStartTime >= 2e4) {
                  var e = t._xreq ? t._xreq.responseURL : ''
                  return (
                    t._onConnectionErrorFunction('Too much time to connect', e),
                    (t._isDisconnected = !0),
                    t._xreq && t._xreq.abort && t._xreq.abort(),
                    void (t._connectStartTime = null)
                  )
                }
                t._connectStartTime = null
              }
            }),
            (this.streammingUpTask = function () {
              if (
                (clearTimeout(t.streammingUpTimer),
                (t.streammingUpTimer = null),
                t._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING &&
                  null !== t._streammingCheckTime)
              ) {
                if (+new Date() - t._streammingCheckTime >= t.STREAMMING_UP_CHECK_NTERVAL)
                  return (
                    t._onConnectionErrorFunction('Streamming connection timeout', n),
                    (t._isDisconnected = !0),
                    t._xreq && t._xreq.abort && t._xreq.abort(),
                    void (t._streammingCheckTime = null)
                  )
                t._ensureStreammingUpTimerStarted()
              }
            }),
            (this._ensureStreammingUpTimerStarted = function () {
              t._byteConnBehavior != NetDania.JsApi.ConnectionType.STREAMING ||
                null != t.streammingUpTimer ||
                t._isDisconnected ||
                (t.streammingUpTimer = setTimeout(
                  t.streammingUpTask.bind(t),
                  t.STREAMMING_UP_CHECK_NTERVAL,
                ))
            }),
            (this._destroyStreammingUpTimer = function () {
              null != t.streammingUpTimer &&
                (clearTimeout(t.streammingUpTimer), (t.streammingUpTimer = null))
            }),
            window.XDomainRequest
              ? (this._xreq.open('GET', n, !0),
                (this._xreq.onload = function (e) {
                  var i, s
                  if (404 !== this.status)
                    if (408 !== this.status)
                      if (void 0 === this.readyState && void 0 === this.status) {
                        if ((t._chunkHandler(this.responseText), !t._xhr)) return
                        ;(t._xhr.onreadystatechange = {}),
                          t._xhr.ontimeout && (t._xhr.ontimeout = null),
                          (t._xhr = null)
                      } else
                        switch (
                          (t._streamStartFuncTimer(),
                          (t._streammingCheckTime = +new Date()),
                          t._ensureStreammingUpTimerStarted(),
                          this.readyState)
                        ) {
                          case 3:
                            try {
                              ;(i = this.status), (s = this.responseText)
                            } catch (e) {}
                            if (
                              (1223 === i && (i = 204),
                              t._isSuspended && ((t._isSuspended = !1), (t._bufferPosition = 0)),
                              200 === i && s && s.length > 0)
                            ) {
                              var a = s.length / 1024
                              t._byteDeliveryType ? t._chunkHandler(e) : t._chunkHandler(s),
                                a > t.STREAMMING_MAX_BUFFER &&
                                  (t._isSuspending ||
                                    t._isSuspended ||
                                    (t._onInfoFunction('Suspending connection. Buffer:' + a, n, 0),
                                    new Promise(() => t.suspendConnection()).then((e) => {})))
                            }
                            break
                          case 4:
                            if (
                              (1223 === (i = this.status) && (i = 204),
                              (12005 !== i && 12029 !== i) || (i = 0),
                              t._byteDeliveryType
                                ? t._messageHandler(e)
                                : ((s = this.responseText), t._chunkHandler(s)),
                              200 === i &&
                                !t._isDisconnected &&
                                t._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING &&
                                !t._byteDeliveryType)
                            )
                              return void new Promise(() =>
                                t._onConnectionErrorFunction('404 error', n),
                              ).then((e) => {})
                            if (!t._xhr) return
                            ;(t._xhr.onreadystatechange = {}),
                              t._xhr.ontimeout && (t._xhr.ontimeout = null),
                              (t._xhr = null)
                        }
                    else
                      new Promise(() => t._onTimeoutFunction('Request Timeout', n)).then((e) => {})
                  else
                    new Promise(() => t._onConnectionErrorFunction('404 error', n)).then((e) => {})
                }),
                (this._xreq.onprogress = function () {
                  var e = this.responseText
                  t._isSuspended && ((t._isSuspended = !1), (t._bufferPosition = 0)),
                    e &&
                      e.length > 0 &&
                      (e.length / 1024 > 500 &&
                        (t._isSuspending ||
                          t._isSuspended ||
                          new Promise(() => t.suspendConnection()).then((e) => {})),
                      t._byteDeliveryType ? t._chunkHandler(data) : t._chunkHandler(e))
                }),
                (this._xreq.ontimeout = function (e) {
                  t._onConnectionErrorFunction('Connect request timeout', n)
                }),
                (this._xreq.onerror = function (e) {
                  t._onConnectionErrorFunction('Connect request error', n)
                }),
                t._onInfoFunction('Connect() send XDomainRequest ', n, 0),
                new Promise(() => this._xreq.send()).then((e) => {}))
              : ((this._xreq.ontimeout = function (e) {
                  t._onConnectionErrorFunction('Connect request timeout', n)
                }),
                (this._xreq.onerror = function (e) {
                  t._onConnectionErrorFunction('Connect request error', n)
                }),
                (this._xreq.onload = function (e) {
                  var i, s
                  if (400 !== this.status)
                    if (404 !== this.status)
                      if (401 !== this.status)
                        if (403 !== this.status)
                          if (408 !== this.status)
                            if (500 !== this.status)
                              if (502 !== this.status)
                                if (503 !== this.status)
                                  if (504 !== this.status)
                                    if (void 0 === this.readyState && void 0 === this.status) {
                                      if ((t._chunkHandler(this.responseText), !t._xhr)) return
                                      ;(t._xhr.onreadystatechange = {}),
                                        t._xhr.ontimeout && (t._xhr.ontimeout = null),
                                        (t._xhr = null)
                                    } else
                                      switch (
                                        (t._streamStartFuncTimer(),
                                        (t._streammingCheckTime = +new Date()),
                                        t._ensureStreammingUpTimerStarted(),
                                        this.readyState)
                                      ) {
                                        case 3:
                                          try {
                                            ;(i = this.status), (s = this.responseText)
                                          } catch (e) {}
                                          if (
                                            (1223 === i && (i = 204),
                                            t._isSuspended &&
                                              ((t._isSuspended = !1), (t._bufferPosition = 0)),
                                            200 === i && s && s.length > 0)
                                          ) {
                                            t._byteDeliveryType
                                              ? t._chunkHandler(e)
                                              : t._chunkHandler(s)
                                            var a = s.length / 1024
                                            a > t.STREAMMING_MAX_BUFFER &&
                                              (t._isSuspending ||
                                                t._isSuspended ||
                                                (t._onInfoFunction(
                                                  'Suspending connection. Buffer:' + a,
                                                  n,
                                                  0,
                                                ),
                                                new Promise(() => t.suspendConnection()).then(
                                                  (e) => {},
                                                )))
                                          }
                                          break
                                        case 4:
                                          if (
                                            (1223 === (i = this.status) && (i = 204),
                                            (12005 !== i && 12029 !== i) || (i = 0),
                                            t._byteDeliveryType
                                              ? t._messageHandler(e)
                                              : ((s = this.responseText), t._chunkHandler(s)),
                                            404 === i &&
                                              !t._isDisconnected &&
                                              t._byteConnBehavior ==
                                                NetDania.JsApi.ConnectionType.STREAMING &&
                                              !t._byteDeliveryType)
                                          )
                                            return void new Promise(() =>
                                              t._onConnectionErrorFunction('404 error', n),
                                            ).then((e) => {})
                                          if (!t._xhr) return
                                          ;(t._xhr.onreadystatechange = {}),
                                            t._xhr.ontimeout && (t._xhr.ontimeout = null),
                                            (t._xhr = null)
                                      }
                                  else
                                    new Promise(() =>
                                      t._onConnectionErrorFunction('504 Gateway Timeout', n),
                                    ).then((e) => {})
                                else
                                  new Promise(() =>
                                    t._onConnectionErrorFunction('503 Service Unavailable', n),
                                  ).then((e) => {})
                              else
                                new Promise(() =>
                                  t._onConnectionErrorFunction('502 Bad Gateway', n),
                                ).then((e) => {})
                            else
                              new Promise(() =>
                                t._onConnectionErrorFunction('500 Internal Server Error', n),
                              ).then((e) => {})
                          else
                            new Promise(() => t._onTimeoutFunction('Request Timeout', n)).then(
                              (e) => {},
                            )
                        else
                          new Promise(() => t._onConnectionErrorFunction('403 Forbidden', n)).then(
                            (e) => {},
                          )
                      else
                        new Promise(() => t._onConnectionErrorFunction('401 Unauthorized', n)).then(
                          (e) => {},
                        )
                    else
                      new Promise(() => t._onConnectionErrorFunction('404 error', n)).then(
                        (e) => {},
                      )
                  else
                    new Promise(() => t._onConnectionErrorFunction('400 Bad Request', n)).then(
                      (e) => {},
                    )
                }),
                this._xreq.open('GET', n, !0),
                0 === this._byteDeliveryType && (this._xreq.withCredentials = !0),
                (this._xreq.onreadystatechange = this._xreq.onload),
                this._xreq.send()),
            this.ensureFailoverRecoveryTimerStarted(),
            this.ensureHeartBeatTimerStarted(),
            setTimeout(this._streamStartFuncTimer, this.STREAM_STARTED_INTERVAL)
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype.reconnect = function () {
        var e = this
        this._tryReconnect &&
          setTimeout(function () {
            e.fireEvent(NetDania.JsApi.Events.ONINFO, [NetDania.JsApi.Messages.RECONNECTING_MSG]),
              !1 !== e._pending ||
                e._isConnected ||
                (e._xreq && e._xreq.abort && e._xreq.abort(), (e._xreq = null), e.Connect(!0))
          }, 2e3)
      }),
      (NetDania.JsApi.JSONConnection.prototype.reconnectSuspended = function () {
        this._onInfoFunction('Reconnect suspended started ', null, 0), this.Connect(!1)
      }),
      (NetDania.JsApi.JSONConnection.prototype.doPolling = function (e = 3, t = 1e3) {
        var i = this
        if ((clearTimeout(this._pollingFunction), this._isConnected)) {
          if (!1 === this._pending && void 0 !== this._pollingParams && !this._isDisconnected) {
            var n = NetDania.JsApi.mkXHR()
            this._pending = !0
            var s,
              a = this._pollingParams + '&ts=' + +new Date()
            this.config.proxy,
              this._isFailoverActive
                ? ((this.m_host = this.config.failoverHosts[this._currentFailover]),
                  (s = this.m_host + a))
                : ((this.m_host = this.config.host), (s = this.m_host + a)),
              (this._pendingRequest = !1),
              (function a(o) {
                if (!i._pendingRequest) {
                  var r

                  function E() {
                    n.abort(),
                      (n.onreadystatechange = null),
                      (n.onerror = null),
                      (n.ontimeout = null),
                      (n.onload = null),
                      (n = null)
                  }

                  function _() {
                    null != r && clearTimeout(r),
                      (r = setTimeout(function () {
                        n.ontimeout()
                      }, i.POLLING_TIMEOUT))
                  }
                  ;(i._pendingRequest = !0),
                    (n = NetDania.JsApi.mkXHR()).open('GET', s, !0),
                    _(),
                    (n.onprogress = function (e) {
                      _()
                    }),
                    (n.onerror = function (_) {
                      clearTimeout(r), (i._pendingRequest = !1)
                      var A =
                        null !== n.responseText && void 0 !== n.responseText
                          ? n.responseText
                          : void 0
                      E(),
                        (i._pendingRequest = !1),
                        o < e
                          ? (i._onErrorFunction(
                              `Pooling request error on attempt ${o}. Response text: ${A}. Retrying request...`,
                              s,
                              1,
                            ),
                            setTimeout(() => a(o + 1), t))
                          : new Promise(() =>
                              i._onConnectionErrorFunction('Pooling request error', s, 4),
                            ).then((e) => {})
                    }),
                    (n.ontimeout = function (n) {
                      clearTimeout(r),
                        (i._pendingRequest = !1),
                        E(),
                        (i._pendingRequest = !1),
                        o < e
                          ? (i._onErrorFunction(
                              `Pooling request timeout on attempt ${o}. Retrying request...`,
                              s,
                              1,
                            ),
                            setTimeout(() => a(o + 1), t))
                          : new Promise(() =>
                              i._onConnectionErrorFunction('Pooling request timeout', s, 4),
                            ).then((e) => {})
                    }),
                    (n.onload = function (n) {
                      clearTimeout(r), (i._pendingRequest = !1)
                      var _ = !0,
                        A = ''
                      switch (this.status) {
                        case 400:
                          A = 'Pooling 400 Bad Request status'
                          break
                        case 401:
                          A = 'Pooling 401 Unauthorized status'
                          break
                        case 403:
                          A = 'Pooling 403 Forbidden status'
                          break
                        case 404:
                          A = 'Pooling 404 Not Found status'
                          break
                        case 500:
                          A = 'Pooling 500 Internal Server Error status'
                          break
                        case 502:
                          A = 'Pooling 502 Bad Gateway status'
                          break
                        case 503:
                          A = 'Pooling 503 Service Unavailable status'
                          break
                        case 504:
                          A = 'Pooling 504 Gateway Timeout status'
                          break
                        default:
                          _ = !1
                      }
                      if (_)
                        o < e
                          ? (i._onErrorFunction(`${A} on attempt ${o}. Retrying request...`, s, 0),
                            setTimeout(() => a(o + 1), t))
                          : new Promise(() => i._onConnectionErrorFunction(A, s, 4)).then((e) => {})
                      else {
                        if (!i._byteDeliveryType) {
                          if (void 0 === this.responseText) return
                          try {
                            n = JSON.parse(this.responseText)
                          } catch (e) {
                            i._pending = !1
                          }
                        }
                        ;(void 0 !== this.readyState && 4 !== this.readyState) ||
                          ((i._pending = !1),
                          i._onMessage(n),
                          clearTimeout(i._pollingFunction),
                          i._isDisconnected ||
                            (i._pollingFunction = setTimeout(
                              i.doPollingFunction,
                              i._pollingInterval,
                            )),
                          (n = null)),
                          E()
                      }
                    }),
                    i._onInfoFunction(`Sending pooling request attempt ${o}`, s, 0)
                  try {
                    n.send()
                  } catch (n) {
                    E(),
                      (i._pendingRequest = !1),
                      o < e
                        ? (i._onErrorFunction(
                            `Pooling request exception on attempt ${o}. Retrying request...`,
                            s,
                            1,
                          ),
                          setTimeout(() => a(o + 1), t))
                        : i._onConnectionErrorFunction('Pooling request exception', s, 4)
                  }
                }
              })(0)
          }
        } else this.reconnect()
      }),
      (NetDania.JsApi.JSONConnection.prototype.suspendConnection = function () {
        if (this._isConnected) {
          var e = NetDania.JsApi.Request.getReqSuspendConnection()
          ;(this._isSuspending = !0),
            this.ensureSuspendConnectionTimerStarted(),
            this._onInfoFunction('Requesting suspend connection', null, 0),
            this.requestInstrumentAdd([e], !1)
        } else
          this._onInfoFunction(
            'Requesting suspend connection cannot be done, not connected',
            null,
            0,
          )
      }),
      (NetDania.JsApi.JSONConnection.prototype.ensureSuspendConnectionTimerStarted = function () {
        null == this.suspendConnectionTimer &&
          this._isSuspending &&
          !this._isDisconnected &&
          (this.suspendConnectionTimer = setTimeout(
            this.suspendConnectionTask.bind(this),
            this.SUSPEND_CONNECTION_WAIT_INTERVAL,
          ))
      }),
      (NetDania.JsApi.JSONConnection.prototype.suspendConnectionTask = function () {
        clearTimeout(this.suspendConnectionTimer),
          (this.suspendConnectionTimer = null),
          (this.m_isDisconnected || !0 === this._isSuspending) && (this._isSuspending = !1)
      }),
      (NetDania.JsApi.JSONConnection.prototype.isConnected = function () {
        return this._isConnected
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection.prototype.destroyFailoverRecoveryTimer = function () {
        null != this.failoverRecoveryTimer &&
          (clearTimeout(this.failoverRecoveryTimer), (this.failoverRecoveryTimer = null))
      }),
      (NetDania.JsApi.JSONConnection.prototype.useMainHost = function () {
        ;(this._pending = !1),
          (this._isConnected = !1),
          (this._handshakeMade = !1),
          (this._bufferPosition = 0),
          (this._isSuspended = !1),
          (this._isSuspending = !1),
          (this._currentFailover = 0),
          (this._isFailoverActive = !1),
          (this._isDisconnected = !0),
          this._xreq && this._xreq.abort && this._xreq.abort(),
          this.reconnect()
      }),
      (NetDania.JsApi.JSONConnection.prototype.ensureFailoverRecoveryTimerStarted = function () {
        null == this.failoverRecoveryTimer &&
          this._isFailoverActive &&
          !this._isDisconnected &&
          (this.failoverRecoveryTimer = setTimeout(
            this.failoverRecoveryTask.bind(this),
            this.FAILOVER_RECOVERY_INTERVAL,
          ))
      }),
      (NetDania.JsApi.JSONConnection.prototype.failoverRecoveryTask = function () {
        if (
          (clearTimeout(this.failoverRecoveryTimer),
          (this.failoverRecoveryTimer = null),
          this._isFailoverActive && !this.m_isDisconnected)
        ) {
          NetDania.JsApi.DetectCORSAvailability(!0)
          var e = NetDania.JsApi.mkXHR(),
            t = this.config.host + '?xinfo=1&group=' + this._usergroup + '&app=' + this._appId,
            i = this
          ;(e.onerror = function () {}),
            (e.ontimeout = function () {}),
            (e.onprogress = function () {}),
            (e.onload = function () {
              var t = this.responseText,
                n = []
              try {
                for (var s = t.split('\n'), a = 0, o = s.length; a < o; a++) {
                  if (void 0 !== s[a] && null !== s[a] && '' !== s[a]) {
                    var r = s[a].split(':')
                    if (void 0 !== r[1] && null !== r[1] && '' !== r[1]) {
                      n[a] = r[1]
                      continue
                    }
                  }
                  n[a] = null
                }
                null != n && n.length > 0 && (i.useMainHost(), i.destroyFailoverRecoveryTimer())
              } catch (e) {}
              ;(null != n && null != n) || (n = []),
                (e.onerror = null),
                (e.ontimeout = null),
                (e.onprogress = null),
                (e.ontimeout = null),
                'undefined' == typeof XDomainRequest && (e.onreadystatechange = null),
                (e = null)
            })
          try {
            e.open('GET', t),
              'undefined' == typeof XDomainRequest &&
                e.setRequestHeader('Content-type', 'text/plain; charset=UTF-8'),
              e.send()
          } catch (t) {
            e &&
              ((e.onerror = null),
              (e.ontimeout = null),
              (e.onprogress = null),
              (e.ontimeout = null),
              'undefined' == typeof XDomainRequest && (e.onreadystatechange = null)),
              (e = null)
          }
        }
        this.ensureFailoverRecoveryTimerStarted()
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection.prototype.ensureHeartBeatTimerStarted = function () {
        null != this.heartBeatTimer ||
          this._isDisconnected ||
          (this.heartBeatTimer = setTimeout(this.heartBeatTask.bind(this), this.HEARTBEAT_INTERVAL))
      }),
      (NetDania.JsApi.JSONConnection.prototype.heartBeatTask = function () {
        if (
          (clearTimeout(this.heartBeatTimer), (this.heartBeatTimer = null), this.m_isDisconnected)
        )
          this.ensureHeartBeatTimerStarted()
        else {
          if (null !== this._sessionId) {
            NetDania.JsApi.DetectCORSAvailability(!0)
            var e = NetDania.JsApi.mkXHR(),
              t = this.m_host + '?sessid=' + this._sessionId + '&xcmd=',
              i = this
            ;(e.onerror = function () {}),
              (e.ontimeout = function () {}),
              (e.onprogress = function () {}),
              (e.onload = function () {
                this.responseText,
                  i.ensureHeartBeatTimerStarted(),
                  (e.onerror = null),
                  (e.ontimeout = null),
                  (e.onprogress = null),
                  (e.ontimeout = null),
                  'undefined' == typeof XDomainRequest && (e.onreadystatechange = null),
                  (e = null)
              })
            try {
              e.open('GET', t),
                'undefined' == typeof XDomainRequest &&
                  e.setRequestHeader('Content-type', 'text/plain; charset=UTF-8'),
                e.send()
            } catch (t) {
              e &&
                ((e.onerror = null),
                (e.ontimeout = null),
                (e.onprogress = null),
                (e.ontimeout = null),
                'undefined' == typeof XDomainRequest && (e.onreadystatechange = null)),
                (e = null)
            }
          }
          this.ensureHeartBeatTimerStarted()
        }
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection.prototype.appendRequests = function (e) {
        if (
          ((this._isFlushed = !0),
          (this._isSuspended || this._isSuspending) && (this._isFlushed = !1),
          !this._isConnected || this._isSuspended || this._isSuspending)
        )
          if (0 === this._requestQueue.length)
            (this._requestQueue = this._requestQueue.concat(e)),
              (this._requestList = this._requestList.concat(e)),
              (this._requestList = this.cleanArray(this._requestList))
          else {
            for (var t = [], i = 0; i < e.length; i++)
              this.checkIfIntrumentIsAlreadyAdded(this._requestQueue, e[i]) || t.push(e[i])
            ;(this._requestQueue = this._requestQueue.concat(t)),
              (this._requestList = this._requestList.concat(t)),
              (this._requestList = this.cleanArray(this._requestList))
          }
        else void 0 !== e && 0 !== e.length && this.requestInstrumentAdd(e)
      }),
      (NetDania.JsApi.JSONConnection.prototype.getFieldValueFromSource = function (e, t) {
        for (var i = 0; i < e.length; i++) if (e[i].f == t) return e[i].v
        return null
      }),
      (NetDania.JsApi.JSONConnection.prototype.removeRequestsFromQueue = function (e, t, i) {
        var n,
          s = !1
        if (5 == i.t) {
          for (n = 0; n < e.length; n++)
            if (e[n].i === i.i && 5 != e[n].t) {
              e.splice(n, 1), (s = !0)
              break
            }
          for (n = 0; n < t.length; n++)
            if (t[n].i === i.i) {
              t.splice(n, 1), 0 == e.length && (s = !0)
              break
            }
          return s
        }
        return !1
      }),
      (NetDania.JsApi.JSONConnection.prototype.checkIfIntrumentIsAlreadyAdded = function (e, t) {
        for (var i = 0; i < e.length; i++) if (e[i].i === t.i) return !0
        return !1
      }),
      (NetDania.JsApi.JSONConnection.prototype.Flush = function () {
        if (((this._isFlushed = !0), !this._isConnected))
          return this.addRequests(this._requestQueue), void this.Connect()
        this.addRequests(this._requestQueue),
          this._isSuspended || this._isSuspending || (this._requestQueue = [])
      }),
      (NetDania.JsApi.JSONConnection.prototype.GetRequestList = function () {
        return this._requestList
      }),
      (NetDania.JsApi.JSONConnection.prototype.SetPendingRequest = function (e) {
        this._pending = e
      }),
      (NetDania.JsApi.JSONConnection.prototype.cleanArray = function (e) {
        for (var t = [], i = 0; i < e.length; i++) 5 == e[i].t && t.push(e[i].i)
        var n = []
        if (t.length > 0) {
          for (i = 0; i < e.length; i++) -1 == t.indexOf(e[i].i) && n.push(e[i])
          e = n
        }
        return e
      }),
      (NetDania.JsApi.JSONConnection.prototype.requestInstrumentAdd = function (e, t) {
        var i = this

        function n(e) {
          var t = []
          i._requestIntrumentQueue[e].forEach((e) => {
            t = t.concat(e)
          }),
            (i._requestIntrumentQueue[e] = []),
            i.requestInstrument(t, 'true' === e)
        }

        this._requestIntrumentQueue || (this._requestIntrumentQueue = { true: [], false: [] }),
          this._timer || (this._timer = null),
          null == t && (t = !0),
          this._requestIntrumentQueue[t ? 'true' : 'false'].push(e),
          this._timer ||
            (this._timer = setTimeout(function () {
              i._requestIntrumentQueue.true.length > 0 && n('true'),
                i._requestIntrumentQueue.false.length > 0 && n('false'),
                (i._timer = null)
            }, 200))
      }),
      (NetDania.JsApi.JSONConnection.prototype.requestInstrument = function (e, t) {
        this._pending = !0
        var i = this
        if (e.length > 0 && this._isConnected) {
          var n = NetDania.JsApi.mkXHR(),
            s = e.slice(0, this._xreqPageSize)
          e = e.slice(this._xreqPageSize, e.length)
          var a = NetDania.JsApi.encode64(JSON.stringify(s))
          if (null == t || 1 == t) {
            for (var o = [], r = 0; r < s.length; r++)
              this.removeRequestsFromQueue([], this._requestList, s[r]) ||
                this.checkIfIntrumentIsAlreadyAdded(this._requestList, s[r]) ||
                o.push(s[r])
            ;(this._requestList = this._requestList.concat(o)),
              (this._requestList = this.cleanArray(this._requestList))
          }
          var E,
            _ =
              '?dt=' +
              this._byteDeliveryType +
              '&sessid=' +
              this._sessionId +
              '&xcmd=' +
              a +
              '&cb=?&ts=' +
              +new Date()
          this.config.proxy,
            this._isFailoverActive
              ? ((this.m_host = this.config.failoverHosts[this._currentFailover]),
                (E = this.m_host + _))
              : ((this.m_host = this.config.host), (E = this.m_host + _)),
            this._onInfoFunction('Request Instrument', E, 0),
            window.XDomainRequest
              ? (n.open('GET', E, !0),
                (n.onload = function (e) {
                  if (404 !== this.status) {
                    if (!i._byteDeliveryType) {
                      if (void 0 === this.responseText) return
                      e = JSON.parse(this.responseText)
                    }
                    ;(void 0 !== this.readyState && 4 !== this.readyState) || i._onMessage(e),
                      i._pollingFunction ||
                        i._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING ||
                        (i._pollingFunction = setTimeout(i.doPollingFunction, i._pollingInterval))
                  } else
                    new Promise(() => i._onConnectionErrorFunction('404 error', E)).then((e) => {})
                }),
                (n.onprogress = function () {}),
                (n.ontimeout = this._onTimeoutFunction),
                (n.onerror = this._onConnectionErrorFunctionApendRequest.bind(this, E)),
                new Promise(() => n.send()).then((e) => {}))
              : ((this._pendingRequestInstrument = !1),
                (function e(t) {
                  i._pendingRequestInstrument ||
                    (((n = NetDania.JsApi.mkXHR()).timeout = i.REQUEST_INSTRUMENT_TIMEOUT),
                    (n.ontimeout = function (n, s) {
                      i._sessionId === n &&
                        ((i._pendingRequestInstrument = !1),
                        t < 3
                          ? (i._onErrorFunction(
                              `Request instrument timout on attempt ${t}. Retrying request...`,
                              E,
                              1,
                            ),
                            setTimeout(() => e(t + 1), 100))
                          : i._onTimeoutFunction('Request instruments timeout connection', E))
                    }.bind(null, i._sessionId)),
                    (n.onerror = function (s, a) {
                      if (i._sessionId !== s) return
                      i._pendingRequestInstrument = !1
                      const o = n.status,
                        r = n.statusText,
                        _ = {
                          status: o,
                          detailedStatusText: 'object' == typeof r ? JSON.stringify(r) : r,
                          responseHeaders: n.getAllResponseHeaders(),
                        }
                      t < 3
                        ? (i._onErrorFunction(
                            `Request instrument error on attempt ${t}. ${JSON.stringify(
                              _,
                            )} Retrying request...`,
                            E,
                            1,
                          ),
                          setTimeout(() => e(t + 1), 100))
                        : i._onConnectionErrorFunction(
                            `Request instruments error connection. ${JSON.stringify(_)} `,
                            E,
                          )
                    }.bind(this, i._sessionId)),
                    (n.onload = function (n) {
                      if (((i._pendingRequestInstrument = !1), 404 === this.status)) {
                        if (!(t < 3))
                          return void setTimeout(function () {
                            i._onConnectionErrorFunction('404 error', E)
                          }, 0)
                        i._onErrorFunction(
                          `Request instruments timout on attempt ${t}. Retrying request...`,
                          E,
                          1,
                        ),
                          setTimeout(() => e(t + 1), 100)
                      }
                      if (!i._byteDeliveryType) {
                        if (void 0 === this.responseText) return
                        try {
                          n = JSON.parse(this.responseText)
                        } catch (e) {
                          return void i._onErrorFunction(
                            `Failed to parse JSON: ${this.responseText} Exception: ${e.message}`,
                            E,
                            1,
                          )
                        }
                      }
                      ;(void 0 !== this.readyState && 4 !== this.readyState) || i._onMessage(n),
                        i._pollingFunction ||
                          i._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING ||
                          (i._pollingFunction = setTimeout(i.doPollingFunction, i._pollingInterval))
                    }),
                    (n.onloadend = function () {
                      const { status: e, statusText: t } = n
                      let s = ''
                      0 === e
                        ? (s =
                            'Request instruments onloadend - Network error or CORS issue occurred.')
                        : e >= 400 &&
                          (s = `Request instruments onloadend - Request failed with status ${e} ${t}`),
                        s && i._onErrorFunction(s, E, 1),
                        n.abort(),
                        (n.onreadystatechange = null),
                        (n.onerror = null),
                        (n.ontimeout = null),
                        (n.onload = null),
                        (n.onloadend = null),
                        (n = null)
                    }),
                    n.open('GET', E, !0),
                    n.send())
                })(0)),
            (i._pending = !1),
            (s = null)
        }
        e.length > 0 &&
          setTimeout(function () {
            i.requestInstrument(e, t)
          }, 200),
          (i._pending = !1)
      }),
      (NetDania.JsApi.JSONConnection.prototype._chunkHandler = function (e) {
        var t, i
        if (this._byteDeliveryType) this._messageHandler(e)
        else if (this._byteConnBehavior == NetDania.JsApi.ConnectionType.STREAMING)
          for (
            var n = -1;
            -1 !== (n = e.indexOf('\n', this._bufferPosition));
            this._bufferPosition = n + 1
          ) {
            if (((t = e.slice(this._bufferPosition, n)), !(i = this.getDataFromJson(t)))) return
            this._messageHandler(i)
          }
        else {
          if (!(i = this.getDataFromJson(e))) return
          this._messageHandler(i)
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype.isJSON = function (e) {
        try {
          return 'object' == typeof JSON.parse(e)
        } catch (e) {
          return !1
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype.getDataFromJson = function (e) {
        return this.isJSON(e)
          ? JSON.parse(e)
          : this.isJSON('{"a":' + e + '}')
          ? JSON.parse('{"a":' + e + '}').a
          : null
      }),
      (NetDania.JsApi.JSONConnection.prototype._messageHandler = function (e) {
        if (this._handshakeMade)
          this._requestQueue.length > 0 &&
            this._isFlushed &&
            (this.addRequests(this._requestQueue),
            (this._requestQueue = []),
            (this._isFlushed = !1)),
            this._onMessage(e)
        else {
          var t = e[1] ? e[1].s : null
          if (null == t) return
          if (t !== NetDania.JsApi.ConnectionStatus.LOGIN_OK.code) {
            var i = e[1] ? e[1].m : ''
            return (
              this.fireEvent(NetDania.JsApi.Events.ONERROR, [i]),
              this.fireEvent(NetDania.JsApi.Events.ONDISCONNECTED, [
                NetDania.JsApi.Messages.DISCONNECT_MSG,
              ]),
              this.removeRequests(this._requestList),
              (this._isConnected = !1),
              (this._requestQueue = []),
              (this._requestList = []),
              void (this._isDisconnected = !0)
            )
          }
          ;(this._sessionId = e[1].m),
            (this._isConnected = !0),
            this.fireEvent(NetDania.JsApi.Events.ONCONNECTED, [this._sessionId]),
            (this._pending = !1),
            (this._sessionId = e[1].m),
            (this._pollingParams =
              '?dt=' + this._byteDeliveryType + '&sessid=' + this._sessionId + '&cb=?&xpoll'),
            e[2] && this._onMessage(e),
            this._requestQueue.length > 0 &&
              this._isFlushed &&
              (this.addRequests(this._requestQueue),
              (this._requestQueue = []),
              (this._isFlushed = !1)),
            this._byteConnBehavior != NetDania.JsApi.ConnectionType.STREAMING &&
              (null !== this._xreq &&
                void 0 !== this._xreq &&
                ((this._xreq.onreadystatechange = null), (this._xreq.onload = null)),
              (this._pollingFunction = setTimeout(this.doPollingFunction, 50)),
              (this._pollingFunction = null)),
            (this._handshakeMade = !0)
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype._onMessage = function (e) {
        var t = null,
          i = null
        if ('' !== e && void 0 !== e) {
          if (
            2 === this.config.v ||
            3 === this.config.v ||
            4 === this.config.v ||
            5 === this.config.v
          )
            for (var n = 0; n < e.length; n++)
              if (2 === e[n].t) {
                for (var s = [], a = 0; a < e[n].f.length; a++) {
                  var o = {}
                  ;(o.f = e[n].f[a]), (o.v = e[n].v[a]), s.push(o)
                }
                e[n].f = s
              }
          for (this.fireEvent(NetDania.JsApi.Events.ONRAWUPDATE, [e]), n = 0; n < e.length; n++)
            switch (e[n].t) {
              case 4:
                for (t = e[n].f, a = 0; a < t.length; a++)
                  switch (t[a].f) {
                    case 107:
                    case 108:
                      break
                    default:
                      t[a].v = NetDania.JsApi.unpackChartSeries(t[a].v, t[a].d)
                  }
                var r = NetDania.JsApi.Response.MonitorChartResponse(t, e[n].t, e[n].i)
                this.Observer.init(t, e[n].i),
                  this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                  this.fireEvent(NetDania.JsApi.Events.ONHISTORICALDATA, [r]),
                  this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                    NetDania.JsApi.Messages.HISTORICAL_DATA_MSG,
                  ]),
                  (t = null)
                break
              case 2:
                try {
                  ;((t = {}).f = e[n].f), (t.v = e[n].v)
                  var E = NetDania.JsApi.Response.MonitorPriceResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONPRICEUPDATE, [E]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.PRICE_UPDATE_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 18:
                try {
                  ;(t = e[n].f), (i = e[n].rt)
                  var _ = NetDania.JsApi.Response.ChartUpdateResponse(t, e[n].t, e[n].i, i)
                  this.Observer.update(t, i, e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, i, e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONCHARTUPDATE, [_]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.CHART_UPDATE_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 6:
                try {
                  t = e[n].h
                  var A = NetDania.JsApi.Response.NewsHistoryResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONHISTORICALHEADLINES, [A]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.HISTORICAL_HEADLINES_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 19:
                try {
                  t = e[n].h
                  var u = NetDania.JsApi.Response.MonitorNewsResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONHEADLINEUPDATE, [u]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.HEADLINE_UPDATE_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 8:
                try {
                  ;(t = e[n].s), (i = e[n].rt)
                  var l = NetDania.JsApi.Response.NewsStoryResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, i, e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, i, e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONNEWSSTORY, [l]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.NEWS_STORY_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 15:
                try {
                  t = e[n].h
                  var N = NetDania.JsApi.Response.NewsSearchResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, e[n].t, e[n].i),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONNEWSSEARCH, [N]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.NEWS_SEARCH_MSG,
                    ]),
                    (t = null),
                    (i = null)
                } catch (e) {}
                break
              case 13:
                try {
                  t = e[n].a
                  var p = NetDania.JsApi.Response.LookupResponse(t, e[n].t, e[n].i)
                  this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONLOOKUP, [p]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.LOOKUP_MSG,
                    ]),
                    (t = null)
                } catch (e) {}
                break
              case 34:
                switch ((O = (t = e[n].o).i)) {
                  case NetDania.JsApi.Alert.Commands.ADD_ALERT:
                    var T = NetDania.JsApi.Response.AlertAddedResponse(t, O, e[n].i)
                    this.fireEvent(NetDania.JsApi.Events.ONALERTADDED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_ADDED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.DELETE_ALERT:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDELETE, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_DELETED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.DISCONNECT_USER:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDISCONNECTMONITORUSER, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_DISCONNECTED_MONITORUSER,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.DISCONNECT_USER_ACTIVITIES:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDISCONNECTMONITORUSERACTIVITY, [
                        T,
                      ]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_DISCONNECTED_MONITORUSER_ACTIVITY,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.EDIT_ALERT:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTEDIT, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_EDIT,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_SINGLE_ALERT:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTGET, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_GET,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_DELETED_ALERTS:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTSGETDELETED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERTS_GET_DELETED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_TRIGGERED_ALERTS:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTSGETTRIGGERED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERTS_GET_TRIGGERED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_DELETED_ALERT:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTGETDELETED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_GET_DELETED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_TRIGGERED_ALERT:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTGETTRIGGERED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_GET_TRIGGERED,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_USER_INFORMATION:
                    ;(T = NetDania.JsApi.Response.AlertActive(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTGETACTIVE, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_GET_ACTIVE,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.MONITOR_USER:
                    ;(T = NetDania.JsApi.Response.AlertActive(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTMONITORUSER, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_MONITORUSER,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.MONITOR_USER_ACTIVITIES:
                    ;(T = NetDania.JsApi.Response.AlertActive(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDISCONNECTMONITORUSERACTIVITY, [
                        T,
                      ]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_MONITORUSER_ACTIVITY,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.GET_PUSH_DEVICES:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTGETPUSHDEVICES, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                        NetDania.JsApi.Messages.ALERT_GET_PUSH_DEVICES,
                      ])
                    break
                  case NetDania.JsApi.Alert.Commands.NOTIFICATION:
                    switch (
                      ((T = NetDania.JsApi.Response.AlertAddedResponse(t, O, e[n].i)),
                      this.getFieldValueFromSource(
                        T.data.f,
                        NetDania.JsApi.Alert.Fields.NOTIFICATION_TYPE,
                      )[0])
                    ) {
                      case NetDania.JsApi.Alert.NotificationTypes.TRIGGERED_PRICE_ALERT:
                        this.fireEvent(NetDania.JsApi.Events.ONALERTMONITORUSER, [T])
                        break
                      case NetDania.JsApi.Alert.NotificationTypes.ALERT_EDITED:
                      case NetDania.JsApi.Alert.NotificationTypes.ALERT_ADDED:
                      case NetDania.JsApi.Alert.NotificationTypes.ALERT_DELETED:
                      case NetDania.JsApi.Alert.NotificationTypes.PUSH_DEVICES_CHANGED:
                        this.fireEvent(NetDania.JsApi.Events.ONALERTMONITORUSERACTIVITY, [T])
                    }
                    break
                  case NetDania.JsApi.Alert.Commands.OK:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDELETE, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTEDIT, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTUSERADDED, [T])
                    break
                  case NetDania.JsApi.Alert.Commands.ERROR:
                    ;(T = NetDania.JsApi.Response.GeneralMonitorResponse(t, O, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONERROR, [T])
                }
                this.Observer.update(t, '', e[n].i, e[n].t),
                  this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                  (t = null)
                break
              case 20:
                try {
                  if (
                    ((t = null),
                    e[n].c == NetDania.JsApi.Application.DataResponse.GENERAL_CODE_UNAVAILABLE ||
                      e[n].c == NetDania.JsApi.Application.DataResponse.GENERAL_CODE_NOT_ALLOWED)
                  ) {
                    var R = NetDania.JsApi.Response.ErrorResponse(e[n].c, e[n].t, e[n].i)
                    this.fireEvent(NetDania.JsApi.Events.ONERROR, [R])
                  } else {
                    e[n].c,
                      this.Observer.update(t, '', e[n].i, e[n].t),
                      this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                      (r = NetDania.JsApi.Response.MonitorChartResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONHISTORICALDATA, [r])
                    var D = NetDania.JsApi.Response.HistoricalChartResponse(t, e[n].t, e[n].i)
                    this.fireEvent(NetDania.JsApi.Events.ONHISTORICALCHARTDATA, [D]),
                      (E = NetDania.JsApi.Response.MonitorPriceResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONPRICEUPDATE, [E]),
                      (_ = NetDania.JsApi.Response.ChartUpdateResponse(t, e[n].t, e[n].i, 0)),
                      this.fireEvent(NetDania.JsApi.Events.ONCHARTUPDATE, [_]),
                      (A = NetDania.JsApi.Response.NewsHistoryResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONHISTORICALHEADLINES, [A]),
                      (u = NetDania.JsApi.Response.MonitorNewsResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONHEADLINEUPDATE, [u]),
                      (l = NetDania.JsApi.Response.NewsStoryResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONNEWSSTORY, [l]),
                      (N = NetDania.JsApi.Response.NewsSearchResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONNEWSSEARCH, [N]),
                      (p = NetDania.JsApi.Response.LookupResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONLOOKUP, [p])
                    var h = NetDania.JsApi.Response.IPLocationResponse(t, e[n].t, e[n].i)
                    this.fireEvent(NetDania.JsApi.Events.ONIPLOCATIONRESPONSE, [h]),
                      (T = NetDania.JsApi.Response.GeneralMonitorResponse(t, e[n].t, e[n].i)),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTADDED, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTDELETE, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTEDIT, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTMONITORUSER, [T]),
                      this.fireEvent(NetDania.JsApi.Events.ONALERTMONITORUSERACTIVITY, [T]),
                      (t = null),
                      (i = null)
                  }
                } catch (e) {}
                break
              case 35:
                try {
                  ;(t = {
                    country_code: e[n].cc,
                    country_name: e[n].cn,
                    region: e[n].rg,
                    city: e[n].ct,
                    ip: '',
                  }),
                    (h = NetDania.JsApi.Response.IPLocationResponse(t, e[n].t, e[n].i)),
                    this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                    this.fireEvent(NetDania.JsApi.Events.ONIPLOCATIONRESPONSE, [h]),
                    this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                      NetDania.JsApi.Messages.IP_LOCATION,
                    ]),
                    (t = null)
                } catch (e) {}
                break
              case 36:
                2 == e[n].c
                  ? ((this._bufferPosition = 0),
                    (this._xreq.onreadystatechange = {}),
                    (this._xreq.onload = null),
                    (this._xreq = null),
                    (this._isSuspended = !0),
                    (this._isSuspending = !1),
                    clearTimeout(this._pollingFunction),
                    (this._pollingFunction = null),
                    this._destroyStreammingUpTimer(),
                    new Promise(() => this.reconnectSuspended()).then((e) => {}))
                  : ((this._isConnected = !1),
                    (this._requestQueue = []),
                    (this._requestList = []),
                    (this._pending = !1),
                    (this._isDisconnected = !0),
                    (this._handshakeMade = !1),
                    (this._bufferPosition = 0),
                    (this._sessionId = null),
                    (this._xreq.onreadystatechange = {}),
                    (this._xreq.onload = null),
                    (this._xreq = null),
                    this.fireEvent(NetDania.JsApi.Events.ONDISCONNECTED, [
                      NetDania.JsApi.Messages.DISCONNECT_MSG,
                    ]),
                    clearTimeout(this._pollingFunction),
                    (this._pollingFunction = null))
                break
              case 41:
                try {
                  ;((t = {}).c = e[n].c),
                    (t.data = e[n].data),
                    (t.lm = e[n].lm),
                    this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t])
                  var c = NetDania.JsApi.Response.GeneralMonitorResponse(t, e[n].t, e[n].i)
                  this.fireEvent(NetDania.JsApi.Events.ONWORKSPACEDATA, [c]), (t = null)
                } catch (e) {}
                break
              case 42:
                try {
                  var O
                  switch ((O = (t = {}).a)) {
                    case NetDania.JsApi.Application.Commands.CREATED:
                    case NetDania.JsApi.Application.Commands.UPDATED:
                    case NetDania.JsApi.Alert.Commands.DELETED:
                  }
                  this.Observer.update(t, '', e[n].i, e[n].t),
                    this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t])
                } catch (e) {}
                break
              case 44:
                for (t = e[n].f, a = 0; a < t.length; a++)
                  switch (t[a].f) {
                    case 107:
                    case 108:
                      break
                    default:
                      t[a].v = NetDania.JsApi.unpackChartSeries(t[a].v, t[a].d)
                  }
                ;(D = NetDania.JsApi.Response.HistoricalChartResponse(t, e[n].t, e[n].i)),
                  this.Observer.init(t, e[n].i),
                  this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, '', e[n].i, e[n].t]),
                  this.fireEvent(NetDania.JsApi.Events.ONHISTORICALCHARTDATA, [D]),
                  this.fireEvent(NetDania.JsApi.Events.ONINFO, [
                    NetDania.JsApi.Messages.HISTORICAL_CHART_MSG,
                  ]),
                  (t = null)
                break
              default:
                ;(t = e[n].f || e[n].h || e[n].s || e[n].a || e[n].o),
                  (i = e[n].rt),
                  NetDania.JsApi.Response.GeneralMonitorResponse(t, e[n].t, e[n].i),
                  this.Observer.update(t, i, e[n].i, e[n].t),
                  this.fireEvent(NetDania.JsApi.Events.ONUPDATE, [t, i, e[n].i, e[n].t]),
                  (t = null),
                  (i = null)
            }
        }
        ;(t = null), (i = null), (e = null), (this._pending = !1)
      }),
      (NetDania.UpdatesObserver = function () {
        this.components = []
      }),
      (NetDania.UpdatesObserver.prototype = {
        subscribe: function (e) {
          this.components.push(e)
        },
        unsubscribe: function (e) {
          this.components = this.components.filter(function (t) {
            if (t !== e) return t
          })
        },
        update: function (e, t, i, _n) {
          this.components.forEach(function (n) {
            n.ids.indexOf(i) > -1 && n.update(e, t, i)
          })
        },
        init: function (e, t) {
          this.components.forEach(function (component) {
            component.ids.indexOf(t) > -1 && component.init(e, t)
          })
        },
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (NetDania.JsApi.JSONConnection.prototype.getAppId = function () {
        return this._appId
      }),
      (NetDania.JsApi.JSONConnection.prototype.setPollingInterval = function (e) {
        this._pollingInterval = e
      }),
      (NetDania.JsApi.JSONConnection.prototype.removeRequest = function (e) {
        this.RemoveRequests([e])
      }),
      (NetDania.JsApi.JSONConnection.prototype.removeRequests = function (e) {
        this.RemoveRequests(e)
      }),
      (NetDania.JsApi.JSONConnection.prototype.RemoveRequests = function (e) {
        if (void 0 !== e) {
          for (var t = [], i = 0; i < e.length; i++)
            t.push(NetDania.JsApi.Request.getReqObjRemove(e[i]))
          this.addRequests(t), (t = null)
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype.AddRequest = function (e) {
        this.checkIfIntrumentIsAlreadyAdded(this._requestQueue, e) ||
          (this._requestQueue.push(e), this._requestList.push(e))
      }),
      (NetDania.JsApi.JSONConnection.prototype.addRequests = function (e) {
        if (
          ((this._isSuspended || this._isSuspending) && (this._isFlushed = !1),
          !this._isConnected || this._isSuspended || this._isSuspending)
        )
          if (0 === this._requestQueue.length)
            (this._requestQueue = e),
              (this._requestList = this._requestList.concat(e)),
              this.cleanArray(this._requestList)
          else {
            for (var t = [], i = 0; i < e.length; i++)
              this.removeRequestsFromQueue(this._requestQueue, this._requestList, e[i]) ||
                this.checkIfIntrumentIsAlreadyAdded(this._requestQueue, e[i]) ||
                t.push(e[i])
            ;(this._requestQueue = this._requestQueue.concat(t)),
              (this._requestList = this._requestList.concat(t))
          }
        else void 0 !== e && 0 !== e.length && this.requestInstrumentAdd(e)
      }),
      (NetDania.JsApi.JSONConnection.prototype.disconnect = function () {
        const e = NetDania.JsApi.Request.getReqCloseConnection()
        this.removeRequests(this._requestList),
          this.addRequests([e]),
          (this._isConnected = !1),
          (this._requestQueue = []),
          (this._requestList = []),
          (this._isDisconnected = !0),
          (this._handshakeMade = !1),
          (this._bufferPosition = 0)
      }),
      (NetDania.JsApi.JSONConnection.getApplicationInfo = function (t, i, n, s, a) {
        NetDania.JsApi.DetectCORSAvailability(!0)
        let o = NetDania.JsApi.mkXHR(),
          r =
            t +
            '?xinfo=1&group=' +
            (i || e.NetDania.JsApi.Utilities.GetHost()) +
            '&prov=' +
            (n || 'netdania_fxa') +
            '&app=' +
            (s || 'jsApi v1.0'),
          E = a
        ;(o.onerror = function () {}),
          (o.ontimeout = function () {}),
          (o.onprogress = function () {}),
          (o.onload = function () {
            let e = this.responseText,
              t = []
            try {
              for (let i = e.split('\n'), n = 0, s = i.length; n < s; n++) {
                if (void 0 !== i[n] && null !== i[n] && '' !== i[n]) {
                  const a = i[n].split(':')
                  if (void 0 !== a[1] && null !== a[1] && '' !== a[1]) {
                    t[n] = a[1]
                    continue
                  }
                }
                t[n] = null
              }
              ;(t[2] = JSON.parse(t[2])), (t[3] = JSON.parse(t[3]))
            } catch (e) {}
            ;(null != t && null != t) || (t = []),
              (o.onerror = null),
              (o.ontimeout = null),
              (o.onprogress = null),
              (o.ontimeout = null),
              'undefined' == typeof XDomainRequest && (o.onreadystatechange = null),
              (o = null),
              E(t)
          })
        try {
          o.open('GET', r),
            'undefined' == typeof XDomainRequest &&
              o.setRequestHeader('Content-type', 'text/plain; charset=UTF-8'),
            o.send()
        } catch (e) {
          E([])
        }
      }),
      (NetDania.JsApi.JSONConnection.prototype.loadWorkspace = function (e, t) {
        let i,
          n,
          s = NetDania.JsApi.mkXHR()
        ;(n =
          '?xload&group=' +
          this._usergroup +
          '&app=chartstation+3.2&id=' +
          e +
          '&&ts=' +
          +new Date()),
          this.config.proxy,
          this._isFailoverActive
            ? ((this.m_host = this.config.failoverHosts[this._currentFailover]),
              (i = this.m_host + n))
            : ((this.m_host = this.config.host), (i = this.m_host + n)),
          (s.onerror = function (_e, _t) {
            return null
          }),
          (s.onload = function (_e) {
            if (404 === this.status) return null
            if (4 === this.readyState) {
              const i = this.response
              t(i)
            }
          }),
          s.open('GET', i, !0),
          (s.responseType = 'arraybuffer'),
          s.send(null)
      }),
      (NetDania.JsApi.JSONConnection.prototype.saveWorkspace = function (e, t, i, n) {
        let s, a
        const o = ++NetDania.JsApi.globalCurrentReqId,
          r = { i: o },
          E = NetDania.JsApi.mkXHR()
        return (
          (a = '?xsave&group=' + this._usergroup + '&app=' + i + '&id=' + e + '&ts=' + +new Date()),
          this.config.proxy,
          this._isFailoverActive
            ? ((this.m_host = this.config.failoverHosts[this._currentFailover]),
              (s = this.m_host + a))
            : ((this.m_host = this.config.host), (s = this.m_host + a)),
          (E.onerror = function (_e, _t) {
            n(null)
          }),
          (E.onload = function (_e) {
            return 404 === this.status || 500 === this.status
              ? null
              : void (4 === this.readyState && n(!0, o))
          }),
          E.open('POST', s, !0),
          E.send(t),
          r
        )
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (e.NetDania.JsApi.Application = e.NetDania.JsApi.Application || {}),
      (NetDania.JsApi.Fields = {
        ALLOWED_CHART_TIME_SCALES: [0, 1, 5, 10, 15, 30, 60, 120, 240, 480, 1440, 10080, 43200],
        CHART_TIME_STAMP: 100,
        CHART_OPEN: 101,
        CHART_HIGH: 102,
        CHART_LOW: 103,
        CHART_CLOSE: 104,
        CHART_VOLUME: 105,
        CHART_OPEN_INT: 106,
        CHART_BUYER_ID: 107,
        CHART_SELLER_ID: 108,
        TYPE_NUMERIC: 1,
        TYPE_STRING: 2,
        QUOTE_LAST: 6,
        QUOTE_OPEN_INT: 7,
        QUOTE_VOLUME_INC: 8,
        QUOTE_BID: 10,
        QUOTE_TIME_STAMP: 17,
        QUOTE_ASK: 11,
        QUOTE_MID_PRICE: 9,
        QUOTE_HIGH: 2,
        QUOTE_LOW: 3,
        QUOTE_OPEN: 4,
        QUOTE_CLOSE: 1,
        QUOTE_VOLUME: 5,
        QUOTE_CONTRIBUTOR: 23,
        QUOTE_BID_SIZE: 12,
        QUOTE_ASK_SIZE: 13,
        QUOTE_PRV_VOLUME: 18,
        QUOTE_SETTLE_PRICE: 20,
        QUOTE_DIVIDEND: 26,
        QUOTE_NAME: 25,
        QUOTE_AVG_PRICE: 16,
        QUOTE_EARN_PER_SHARE: 24,
        QUOTE_ISIN_CODE: 39,
        QUOTE_EQUITY_PER_SHARE: 40,
        QUOTE_SALES_PER_SHARE: 41,
        QUOTE_TOTAL_SHARES: 42,
        QUOTE_52W_HIGH: 21,
        QUOTE_52W_LOW: 22,
        QUOTE_YEAR_HIGH: 43,
        QUOTE_YEAR_LOW: 44,
        QUOTE_1W_HIGH: 120,
        QUOTE_1W_LOW: 121,
        QUOTE_1MONTH_HIGH: 122,
        QUOTE_1MONTH_LOW: 123,
        QUOTE_3MONTH_HIGH: 124,
        QUOTE_3MONTH_LOW: 125,
        QUOTE_6MONTH_HIGH: 126,
        QUOTE_6MONTH_LOW: 127,
        QUOTE_PRV_YEAR_CLOSE: 19,
        QUOTE_1WEEK_CLOSE: 27,
        QUOTE_1MONTH_CLOSE: 28,
        QUOTE_3MONTH_CLOSE: 29,
        QUOTE_1YEAR_CLOSE: 30,
        QUOTE_6MONTH_CLOSE: 117,
        QUOTE_EARN_PER_SHARE_EST: 97,
        QUOTE_BETA: 98,
        QUOTE_YIELD: 99,
        QUOTE_DEBT_TO_EQUITY: 100,
        QUOTE_INSTRUMENT_TYPE: 107,
        QUOTE_INDUSTRY_CODE: 108,
        QUOTE_INDUSTRY_NAME: 109,
        QUOTE_BUYER_ID: 110,
        QUOTE_SELLER_ID: 111,
        QUOTE_BOARD_LOT: 113,
        QUOTE_MARKET_ID: 115,
        QUOTE_CURRENCY: 116,
        _QUOTE_CHANGE: 14,
        _QUOTE_PERCENT_CHANGE: 15,
        _QUOTE_YEAR_CHANGE: 31,
        _QUOTE_YEAR_PERCENT_CHANGE: 32,
        _QUOTE_1WEEK_CHANGE: 33,
        _QUOTE_1WEEK_PERCENT_CHANGE: 34,
        _QUOTE_1MONTH_CHANGE: 35,
        _QUOTE_1MONTH_PERCENT_CHANGE: 36,
        _QUOTE_1YEAR_CHANGE: 37,
        _QUOTE_1YEAR_PERCENT_CHANGE: 38,
        _QUOTE_3MONTH_CHANGE: 45,
        _QUOTE_3MONTH_PERCENT_CHANGE: 46,
        _QUOTE_6MONTH_CHANGE: 118,
        _QUOTE_6MONTH_PERCENT_CHANGE: 119,
        _QUOTE_PRICE_PER_EARN: 101,
        _QUOTE_PRICE_PER_EARN_EST: 102,
        _QUOTE_EARN_PER_PRICE_EST: 103,
        _QUOTE_AMOUNT_TURNOVR: 104,
        _QUOTE_SYMBOL: 105,
        _QUOTE_LAST_BID_ASK: 106,
        _QUOTE_MARKET_CAP: 112,
        _QUOTE_BOARD_LOT_VALUE: 114,
        QUOTE_BID_ON: 47,
        QUOTE_ASK_ON: 48,
        QUOTE_BID_SN: 49,
        QUOTE_ASK_SN: 50,
        QUOTE_BID_TN: 51,
        QUOTE_ASK_TN: 52,
        QUOTE_BID_1W: 53,
        QUOTE_ASK_1W: 54,
        QUOTE_BID_2W: 55,
        QUOTE_ASK_2W: 56,
        QUOTE_BID_3W: 57,
        QUOTE_ASK_3W: 58,
        QUOTE_BID_1M: 59,
        QUOTE_ASK_1M: 60,
        QUOTE_BID_2M: 61,
        QUOTE_ASK_2M: 62,
        QUOTE_BID_3M: 63,
        QUOTE_ASK_3M: 64,
        QUOTE_BID_4M: 65,
        QUOTE_ASK_4M: 66,
        QUOTE_BID_5M: 67,
        QUOTE_ASK_5M: 68,
        QUOTE_BID_6M: 69,
        QUOTE_ASK_6M: 70,
        QUOTE_BID_7M: 71,
        QUOTE_ASK_7M: 72,
        QUOTE_BID_8M: 73,
        QUOTE_ASK_8M: 74,
        QUOTE_BID_9M: 75,
        QUOTE_ASK_9M: 76,
        QUOTE_BID_10M: 77,
        QUOTE_ASK_10M: 78,
        QUOTE_BID_11M: 79,
        QUOTE_ASK_11M: 80,
        QUOTE_BID_1Y: 81,
        QUOTE_ASK_1Y: 82,
        QUOTE_BID_2Y: 83,
        QUOTE_ASK_2Y: 84,
        QUOTE_BID_3Y: 85,
        QUOTE_ASK_3Y: 86,
        QUOTE_BID_4Y: 87,
        QUOTE_ASK_4Y: 88,
        QUOTE_BID_5Y: 89,
        QUOTE_ASK_5Y: 90,
        QUOTE_BID_6Y: 91,
        QUOTE_ASK_6Y: 92,
        QUOTE_BID_7Y: 93,
        QUOTE_ASK_7Y: 94,
        QUOTE_BID_10Y: 95,
        QUOTE_ASK_10Y: 96,
        QUOTE_DECIMALS: 137,
        QUOTE_UNITS: 138,
        QUOTE_ASK_OPEN: 1020,
        QUOTE_ASK_HIGH: 1021,
        QUOTE_ASK_LOW: 1022,
        QUOTE_ASK_VOLUME: 1023,
        QUOTE_ASK_TIME_STAMP: 1024,
        QUOTE_ASK_CLOSE: 1025,
        QUOTE_BID_OPEN: 1010,
        QUOTE_BID_HIGH: 1011,
        QUOTE_BID_LOW: 1012,
        QUOTE_BID_VOLUME: 1013,
        QUOTE_BID_TIME_STAMP: 1014,
        QUOTE_BID_CLOSE: 1015,
        QUOTE_SECURITY_TYPE: 1029,
        QUOTE_MIC: 247,
        QUOTE_BASE_CURRENCY: 1533,
        QUOTE_COUNTER_CURRENCY: 1534,
        QUOTE_COUNTER: 1534,
        QUOTE_VOLUME_DECIMALS: 1602,
        QUOTE_TIME_ZONE: 1531,
        QUOTE_ADDITIONAL_TIME_ZONES: 1532,
        QUOTE_FULL_NAME: 2998,
        QUOTE_STATISTIC_DAY: 1002,
        MARKET_CAP_USD: 1603,
        TOTAL_SUPPLY: 1604,
        MAX_SUPPLY: 1605,
        AVAIL_SUPPLY: 1606,
        QUOTE_TICKER: 147,
        QUOTE_RIC: 150,
        QUOTE_MIC: 247,
        MARKET_DEPTH_QUOTE_BOOK_DEPTH: 2999,
        MARKET_DEPTH_BID_PRICE_START: 3100,
        MARKET_DEPTH_BID_PRICE_END: 3199,
        MARKET_DEPTH_BID_VOLUME_START: 3200,
        MARKET_DEPTH_BID_VOLUME_END: 3299,
        MARKET_DEPTH_BID_TIME_START: 3300,
        MARKET_DEPTH_BID_TIME_END: 3399,
        MARKET_DEPTH_BID_CONTRIBUTOR_START: 3400,
        MARKET_DEPTH_BID_CONTRIBUTOR_END: 3499,
        MARKET_DEPTH_BID_CUMMULATED_PRICES_COUNT_START: 3500,
        MARKET_DEPTH_BID_CUMMULATED_PRICES_COUNT_END: 3599,
        MARKET_DEPTH_ASK_PRICE_START: 4100,
        MARKET_DEPTH_ASK_PRICE_END: 4199,
        MARKET_DEPTH_ASK_VOLUME_START: 4200,
        MARKET_DEPTH_ASK_VOLUME_END: 4299,
        MARKET_DEPTH_ASK_TIME_START: 4300,
        MARKET_DEPTH_ASK_TIME_END: 4399,
        MARKET_DEPTH_ASK_CONTRIBUTOR_START: 4400,
        MARKET_DEPTH_ASK_CONTRIBUTOR_END: 4499,
        MARKET_DEPTH_ASK_CUMMULATED_PRICES_COUNT_START: 4500,
        MARKET_DEPTH_ASK_CUMMULATED_PRICES_COUNT_END: 4599,
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.JsApi = e.NetDania.JsApi || {}),
      (e.NetDania.JsApi.Application = e.NetDania.JsApi.Application || {}),
      (NetDania.JsApi.Application.Commands = { CREATED: 0, UPDATED: 1, DELETED: 2 }),
      (NetDania.JsApi.Application.Response = {
        RESPONSE_CODE_NOT_FOUND: 0,
        RESPONSE_CODE_FOUND: 1,
        RESPONSE_CODE_FOUND_DATA_EXCLUDED: 2,
        RESPONSE_CODE_FOUND_NOT_MODIFIED: 3,
      }),
      (NetDania.JsApi.Application.DataResponse = {
        GENERAL_CODE_UNAVAILABLE: -128,
        GENERAL_CODE_NOT_ALLOWED: -127,
      })
  })(void 0 !== window ? window : global),
  (function (e) {
    'use strict'
    ;(e.NetDania = e.NetDania || {}),
      (e.NetDania.ArrayUtils = e.NetDania.ArrayUtils || {}),
      (NetDania.ArrayUtils.arrayContains = function (e, t) {
        for (let i = e.length; i--; ) if (e[i] === t) return !0
        return !1
      })
  })(void 0 !== window ? window : global)
