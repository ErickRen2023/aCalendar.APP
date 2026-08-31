export type ViewMode = 'month' | 'list' | 'year';
export type RecurrenceMode = 'none' | 'solar' | 'lunar';

export interface CalendarItem { id: number; name: string; description: string; color: string; is_archived: boolean; sort_order: number; event_count: number; }
export interface Recurrence { freq?: string; interval?: number; by_month?: number; by_month_day?: number; by_day?: string[]; until?: string; count?: number; ends?: 'never' | 'count' | 'until'; lunar_month?: number; lunar_day?: number; leap_policy?: 'ignore' | 'include'; span_years?: number; anchor_year?: number; }
export interface Reminder { offset_minutes: number; method: 'push' | 'email'; }
export interface EventItem { id: number; calendar_id: number; title: string; description: string; location: string; is_all_day: boolean; timezone: string; start_at: string; end_at: string; recurrence_mode: RecurrenceMode; recurrence: Recurrence | null; reminders?: Reminder[]; external_uid?: string | null; }
export interface Occurrence { event_id: number; calendar_id: number; title: string; description: string; location: string; is_all_day: boolean; start_at: string; end_at: string; is_leap?: boolean; color: string; }
export interface ApiResponse<T> { code: number; message: string; data: T; }

export const COLORS = ['#2E7CF6', '#7C5CFC', '#11A36A', '#F59E0B', '#E85D75', '#12A6B5'];
