/**
 * disable-undici.js
 * ------------------
 * Node 18 ships with a built‑in Undici-powered fetch().
 * Undici crashes on Node 18 because global.File is not defined.
 *
 * This shim disables Node’s built‑in fetch + Web APIs so that
 * Baby Node uses ONLY our safe dynamic-import node-fetch shim.
 */

global.fetch = undefined;
global.Headers = undefined;
global.Request = undefined;
global.Response = undefined;
global.FormData = undefined;
global.Blob = undefined;
global.File = undefined;
