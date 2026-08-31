import { addDays, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from 'date-fns';
import { Lunar } from 'lunar-typescript';
import type { Occurrence } from '../types';

const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
function lunarDateLabel(date: Date) {
  const lunar = Lunar.fromDate(date);
  const month = lunar.getMonthInChinese();
  const day = lunar.getDayInChinese();
  return day === '初一' ? `${month}月${day}` : day;
}

export function MonthView({ cursor, occurrences, onNew, onEdit }: { cursor: Date; occurrences: Occurrence[]; onNew: (date: Date) => void; onEdit: (eventId: number) => void }) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 0 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start, end });
  const today = new Date();
  const weekCount = days.length / 7;
  return <div className="month-grid"><div className="weekday-row">{weekdays.map(day => <div key={day}>{day}</div>)}</div><div className={`day-grid weeks-${weekCount}`}>{days.map(day => { const dayEvents = occurrences.filter(event => isSameDay(new Date(event.start_at), day)); const lunarLabel = lunarDateLabel(day); return <div key={day.toISOString()} className={`day-cell ${!isSameMonth(day, cursor) ? 'muted-day' : ''} ${isSameDay(day, today) ? 'today' : ''}`} onDoubleClick={() => onNew(day)}><div className="day-date"><div className="day-number">{format(day, 'd')}{isSameDay(day, today) && <span>今天</span>}</div><div className="lunar-date" title={`农历${lunarLabel}`}>{lunarLabel}</div></div><div className="day-events">{dayEvents.slice(0, 3).map(event => <button key={`${event.event_id}-${event.start_at}`} className="event-chip" style={{ background: `${event.color}16`, borderLeftColor: event.color }} onClick={(e) => { e.stopPropagation(); onEdit(event.event_id); }}><i style={{ background: event.color }} />{event.title}{event.is_leap && <em>闰</em>}</button>)}{dayEvents.length > 3 && <small className="more-events">+{dayEvents.length - 3} 个</small>}</div></div>})}</div></div>;
}
