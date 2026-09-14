/**
 * Runtime config for the mobile app.
 *
 * The "Your Rights" guide works fully OFFLINE (bundled, verified data) — no server needed.
 * Live flight search needs the companion API server (the Node `server.js` in this repo, or a
 * deployed copy). Point the app at it by setting EXPO_PUBLIC_API_BASE before `expo start`, e.g.:
 *
 *   EXPO_PUBLIC_API_BASE=http://192.168.1.50:5173 npx expo start
 *
 * Use your computer's LAN IP (not localhost) so a phone on the same Wi-Fi can reach it.
 * When unset, the Find Flights tab explains how to connect a server instead of erroring out.
 */

export const API_BASE = (process.env.EXPO_PUBLIC_API_BASE ?? '').replace(/\/+$/, '');

export const HAS_API = API_BASE.length > 0;

export const ORIGIN = 'HLN'; // Helena, MT — the current single origin (any-airline/any-origin is the roadmap)
