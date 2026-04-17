// File: src/types/backend/common.ts
/**
 * Shared scalar types for backend-aligned contracts.
 * We use string for Java Long and Date-like values to avoid JS precision issues
 * and to keep transport format stable.
 */
export type JavaLong = string;
export type DateTimeString = string;
export type DateString = string;

export type Gender = 0 | 1 | 2;
export type OnlineStatus = 0 | 1 | 2;
