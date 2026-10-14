import { tagTest, testMode } from './tag-test-config.js';
export const testLedgerKey = 'dwf.private-tag-test.' + tagTest.run;
export function readTestLedger(window) {
  try { return window.localStorage.getItem(testLedgerKey); }
  catch { return 'storage-unavailable'; }
}
// Browser-local at-most-once guard; Web Locks also serializes tabs. The human
// ledger is the authority across browsers/profiles. Never automatically retry.
export function createTestOnce({ window, allowed, prepare, send }) {
  let busy = false;
  return async function request() {
    if (!testMode(window.location)) return 'wrong-preview';
    if (busy) return 'busy';
    if (!allowed()) return 'consent-required';
    if (!window.navigator.locks?.request) return 'lock-unavailable';
    busy = true;
    try {
      return await window.navigator.locks.request(testLedgerKey, { mode: 'exclusive', ifAvailable: true }, async lock => {
        if (!lock) return 'busy';
        if (readTestLedger(window)) return 'already-reserved-or-storage-unavailable';
        if (!await prepare()) return 'provider-unavailable';
        if (!allowed() || !testMode(window.location)) return 'consent-required';
        const record = JSON.stringify({ run: tagTest.run, status: 'REQUEST_RESERVED_DELIVERY_UNVERIFIED', at: new Date().toISOString(), page: tagTest.origin + tagTest.path });
        try {
          window.localStorage.setItem(testLedgerKey, record);
          if (window.localStorage.getItem(testLedgerKey) !== record) return 'storage-unavailable';
        } catch { return 'storage-unavailable'; }
        // Reserve before handing off. A transport error still consumes this run.
        try { send(); } catch { return 'reserved-send-failed'; }
        return 'requested-delivery-unverified';
      });
    } catch { return 'unavailable'; }
    finally { busy = false; }
  };
}
