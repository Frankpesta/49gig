/**
 * Untyped Convex `api` object for client code.
 * Importing `{ api }` from `@/convex/_generated/api` forces TypeScript to expand the full
 * `FilterApi` type and can hit TS2589 (type instantiation excessively deep).
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports -- avoid typed `api` import
export const convexApiAny = require("../convex/_generated/api.js").api as any;
