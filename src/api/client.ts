import type { ApiResponse, CalendarItem, EventItem, Occurrence, Recurrence, Reminder } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('acalendar_token');
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { ...options, headers });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.code && body.code !== 0) throw new Error(body.message || '请求失败');
  return body.data as T;
}

async function download(path: string, filename: string): Promise<void> {
  const token = localStorage.getItem('acalendar_token');
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const response = await fetch(`/api${path}`, { headers });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    const detail = Array.isArray(body.detail) ? body.detail[0]?.msg : body.detail;
    throw new Error(detail || body.message || '导出失败');
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const encodedFilename = disposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const plainFilename = disposition.match(/filename="([^"]+)"/i)?.[1];
  let downloadedFilename = filename;
  if (encodedFilename) {
    try { downloadedFilename = decodeURIComponent(encodedFilename); } catch { downloadedFilename = filename; }
  } else if (plainFilename) downloadedFilename = plainFilename;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = downloadedFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export const api = {
  calendars: () => request<CalendarItem[]>('/v1/calendars'),
  createCalendar: (data: { name: string; description?: string; color?: string }) => request<CalendarItem>('/v1/calendars', { method: 'POST', body: JSON.stringify(data) }),
  updateCalendar: (id: number, data: Partial<CalendarItem>) => request<CalendarItem>(`/v1/calendars/${id}/update`, { method: 'POST', body: JSON.stringify(data) }),
  deleteCalendar: (id: number) => request<{ id: number }>(`/v1/calendars/${id}/delete`, { method: 'POST' }),
  events: (calendarId: number) => request<EventItem[]>(`/v1/calendars/${calendarId}/events`),
  createEvent: (calendarId: number, data: Record<string, unknown>) => request<EventItem>(`/v1/calendars/${calendarId}/events`, { method: 'POST', body: JSON.stringify(data) }),
  updateEvent: (id: number, data: Record<string, unknown>) => request<EventItem>(`/v1/events/${id}/update`, { method: 'POST', body: JSON.stringify(data) }),
  deleteEvent: (id: number) => request<{ id: number }>(`/v1/events/${id}/delete`, { method: 'POST' }),
  occurrences: (calendarId: number, from: string, to: string) => request<Occurrence[]>(`/v1/calendars/${calendarId}/occurrences?from=${from}&to=${to}`),
  exportMerge: (calendarIds?: number[]) => download(`/v1/export/merge.ics${calendarIds?.length ? `?calendar_ids=${calendarIds.join(',')}` : ''}`, 'acalendar.ics'),
  me: () => request<{ id: number; display_name: string; email: string }>('/auth/me'),
  ssoResult: () => request<{ status: string; token: string; user_id: number; username?: string; avatar?: string }>('/auth/sso/result'),
};

export function eventPayload(input: { title: string; start: string; end: string; allDay: boolean; location: string; description: string; mode: 'none' | 'solar' | 'lunar'; recurrence: Recurrence | null; reminders: Reminder[] }) {
  return { title: input.title.trim(), start_at: `${input.start}T${input.allDay ? '00:00' : '09:00'}:00`, end_at: `${input.end}T${input.allDay ? '00:00' : '10:00'}:00`, is_all_day: input.allDay, location: input.location, description: input.description, recurrence_mode: input.mode, recurrence: input.recurrence, reminders: input.reminders, timezone: 'Asia/Shanghai' };
}
