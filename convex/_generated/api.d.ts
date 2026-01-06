/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics_queries from "../analytics/queries.js";
import type * as audit_queries from "../audit/queries.js";
import type * as auth from "../auth.js";
import type * as auth_actions from "../auth/actions.js";
import type * as auth_mutations from "../auth/mutations.js";
import type * as auth_oauth from "../auth/oauth.js";
import type * as auth_password from "../auth/password.js";
import type * as auth_queries from "../auth/queries.js";
import type * as auth_rateLimit from "../auth/rateLimit.js";
import type * as auth_sessions from "../auth/sessions.js";
import type * as chat_mutations from "../chat/mutations.js";
import type * as chat_queries from "../chat/queries.js";
import type * as cron_sessions from "../cron/sessions.js";
import type * as disputes_actions from "../disputes/actions.js";
import type * as disputes_mutations from "../disputes/mutations.js";
import type * as disputes_queries from "../disputes/queries.js";
import type * as matching_actions from "../matching/actions.js";
import type * as matching_mutations from "../matching/mutations.js";
import type * as matching_queries from "../matching/queries.js";
import type * as milestones_mutations from "../milestones/mutations.js";
import type * as payments_actions from "../payments/actions.js";
import type * as payments_mutations from "../payments/mutations.js";
import type * as payments_queries from "../payments/queries.js";
import type * as projects_mutations from "../projects/mutations.js";
import type * as projects_queries from "../projects/queries.js";
import type * as sessions from "../sessions.js";
import type * as transactions_queries from "../transactions/queries.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";
import type * as vetting_actions from "../vetting/actions.js";
import type * as vetting_engine from "../vetting/engine.js";
import type * as vetting_mutations from "../vetting/mutations.js";
import type * as vetting_queries from "../vetting/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "analytics/queries": typeof analytics_queries;
  "audit/queries": typeof audit_queries;
  auth: typeof auth;
  "auth/actions": typeof auth_actions;
  "auth/mutations": typeof auth_mutations;
  "auth/oauth": typeof auth_oauth;
  "auth/password": typeof auth_password;
  "auth/queries": typeof auth_queries;
  "auth/rateLimit": typeof auth_rateLimit;
  "auth/sessions": typeof auth_sessions;
  "chat/mutations": typeof chat_mutations;
  "chat/queries": typeof chat_queries;
  "cron/sessions": typeof cron_sessions;
  "disputes/actions": typeof disputes_actions;
  "disputes/mutations": typeof disputes_mutations;
  "disputes/queries": typeof disputes_queries;
  "matching/actions": typeof matching_actions;
  "matching/mutations": typeof matching_mutations;
  "matching/queries": typeof matching_queries;
  "milestones/mutations": typeof milestones_mutations;
  "payments/actions": typeof payments_actions;
  "payments/mutations": typeof payments_mutations;
  "payments/queries": typeof payments_queries;
  "projects/mutations": typeof projects_mutations;
  "projects/queries": typeof projects_queries;
  sessions: typeof sessions;
  "transactions/queries": typeof transactions_queries;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
  "vetting/actions": typeof vetting_actions;
  "vetting/engine": typeof vetting_engine;
  "vetting/mutations": typeof vetting_mutations;
  "vetting/queries": typeof vetting_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
