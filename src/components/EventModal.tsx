import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import { Lunar } from 'lunar-typescript';
import { api, eventPayload } from '../api/client';
import type { EventItem, Recurrence, Reminder } from '../types';

const REMINDER_OPTIONS = [
  { offset_minutes: 20160, label: '提前 2 周' },
  { offset_minutes: 10080, label: '提前 1 周' },
  { offset_minutes: 1440, label: '提前 1 天' },
  { offset_minutes: 60, label: '提前 1 小时' },
  { offset_minutes: 30, label: '提前 30 分钟' },
  { offset_minutes: 10, label: '提前 10 分钟' },
  { offset_minutes: 5, label: '提前 5 分钟' },
  { offset_minutes: 0, label: '事件开始时' },
];

function sortReminders(reminders: Reminder[] = []) {
  const unique = new Map<number, Reminder>();
  reminders.forEach(reminder => {
    if (Number.isFinite(reminder.offset_minutes)) unique.set(reminder.offset_minutes, { offset_minutes: reminder.offset_minutes, method: reminder.method || 'push' });
  });
  return [...unique.values()].sort((a, b) => b.offset_minutes - a.offset_minutes);
}

function ReminderSelect({ value, disabledValues, onChange }: { value: number; disabledValues: Set<number>; onChange: (value: number) => void }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = REMINDER_OPTIONS.find(option => option.offset_minutes === value) || { offset_minutes: value, label: `提前 ${value} 分钟` };

  useEffect(() => {
    if (!open) return;
    const closeWhenOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', closeWhenOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  return <div className="custom-select" ref={containerRef}>
    <button type="button" className="custom-select-trigger" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen(current => !current)}>
      <span>{selected.label}</span>
      <ChevronDown size={15} className={open ? 'rotated' : ''} />
    </button>
    {open && <div className="custom-select-menu" role="listbox" aria-label="提醒时间">
      {REMINDER_OPTIONS.map(option => {
        const isSelected = option.offset_minutes === value;
        const disabled = disabledValues.has(option.offset_minutes) && !isSelected;
        return <button
          type="button"
          role="option"
          aria-selected={isSelected}
          className={`custom-select-option${isSelected ? ' selected' : ''}`}
          disabled={disabled}
          key={option.offset_minutes}
          onClick={() => {
            if (disabled) return;
            onChange(option.offset_minutes);
            setOpen(false);
          }}
        >{option.label}</button>;
      })}
    </div>}
  </div>;
}

const initial = (date = new Date()) => ({ title: '', start: format(date, 'yyyy-MM-dd'), end: format(date, 'yyyy-MM-dd'), allDay: true, location: '', description: '', mode: 'none' as 'none' | 'solar' | 'lunar', freq: 'yearly', interval: 1, lunarMonth: 1, lunarDay: 1, leapPolicy: 'ignore' as 'ignore' | 'include', reminders: [] as Reminder[] });

export function EventModal({ calendarId, event, defaultDate, onClose, onSaved }: { calendarId: number; event?: EventItem; defaultDate?: Date; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState(initial(defaultDate));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      const recurrence = event.recurrence || {};
      setForm({ ...initial(new Date(event.start_at)), title: event.title, start: event.start_at.slice(0, 10), end: event.end_at.slice(0, 10), allDay: event.is_all_day, location: event.location, description: event.description, mode: event.recurrence_mode, freq: recurrence.freq || 'yearly', interval: recurrence.interval || 1, lunarMonth: recurrence.lunar_month || 1, lunarDay: recurrence.lunar_day || 1, leapPolicy: recurrence.leap_policy || 'ignore', reminders: sortReminders(event.reminders) });
    }
  }, [event]);

  const recurrence: Recurrence | null = useMemo(() => {
    if (form.mode === 'none') return null;
    if (form.mode === 'lunar') return { lunar_month: form.lunarMonth, lunar_day: form.lunarDay, leap_policy: form.leapPolicy, interval: form.interval, span_years: 20, anchor_year: Number(form.start.slice(0, 4)), freq: 'yearly' };
    return { freq: form.freq, interval: form.interval };
  }, [form]);

  const update = (key: string, value: unknown) => setForm(current => ({ ...current, [key]: value }));

  const selectMode = (mode: 'none' | 'solar' | 'lunar') => {
    if (mode === 'lunar' && form.mode !== 'lunar') {
      const baseDate = event ? new Date(`${form.start}T00:00:00`) : new Date();
      const baseDateText = format(baseDate, 'yyyy-MM-dd');
      const lunar = Lunar.fromDate(new Date(`${baseDateText}T00:00:00`));
      setForm(current => ({
        ...current,
        mode,
        ...(event ? {} : { start: baseDateText, end: baseDateText }),
        lunarMonth: Math.abs(lunar.getMonth()),
        lunarDay: lunar.getDay(),
      }));
      return;
    }
    update('mode', mode);
  };

  const addReminder = () => {
    const used = new Set(form.reminders.map(reminder => reminder.offset_minutes));
    const option = REMINDER_OPTIONS.find(item => !used.has(item.offset_minutes));
    if (!option || form.reminders.length >= 8) return;
    setForm(current => ({ ...current, reminders: sortReminders([...current.reminders, { offset_minutes: option.offset_minutes, method: 'push' }]) }));
  };

  const updateReminder = (index: number, offsetMinutes: number) => {
    if (form.reminders.some((reminder, reminderIndex) => reminderIndex !== index && reminder.offset_minutes === offsetMinutes)) return;
    setForm(current => ({ ...current, reminders: sortReminders(current.reminders.map((reminder, reminderIndex) => reminderIndex === index ? { ...reminder, offset_minutes: offsetMinutes } : reminder)) }));
  };

  const removeReminder = (index: number) => setForm(current => ({ ...current, reminders: current.reminders.filter((_, reminderIndex) => reminderIndex !== index) }));

  const save = async () => {
    if (!form.title.trim()) { setError('请填写事件标题'); return; }
    setSaving(true);
    setError('');
    try {
      const body = eventPayload({ title: form.title, start: form.start, end: form.end, allDay: form.allDay, location: form.location, description: form.description, mode: form.mode, recurrence, reminders: sortReminders(form.reminders) });
      if (event) await api.updateEvent(event.id, body); else await api.createEvent(calendarId, body);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal event-modal"><div className="modal-header"><div><span className="eyebrow">{event ? '编辑事件' : '添加事件'}</span><h2>{event ? '更新日程安排' : '安排一件新事情'}</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button></div><div className="form-grid"><label className="field wide"><span>事件标题 <b>*</b></span><input autoFocus value={form.title} onChange={event => update('title', event.target.value)} placeholder="例如：奶奶生日" /></label><label className="field"><span>开始日期</span><input type="date" value={form.start} onChange={event => update('start', event.target.value)} /></label><label className="field"><span>结束日期</span><input type="date" value={form.end} onChange={event => update('end', event.target.value)} /></label><label className="check-field wide"><input type="checkbox" checked={form.allDay} onChange={event => update('allDay', event.target.checked)} /><span>全天事件</span><small>事件将在日历中以日期展示</small></label><label className="field wide"><span>地点</span><input value={form.location} onChange={event => update('location', event.target.value)} placeholder="可选" /></label><div className="field wide reminder-field"><div className="reminder-heading"><span>提醒</span><button type="button" className="reminder-add" onClick={addReminder} disabled={form.reminders.length >= 8 || form.reminders.length >= REMINDER_OPTIONS.length}><Plus size={14} /> 添加提醒</button></div>{form.reminders.length === 0 ? <div className="reminder-empty">暂未设置提醒</div> : <div className="reminder-list">{form.reminders.map((reminder, index) => <div className="reminder-row" key={`${reminder.offset_minutes}-${index}`}><span className="reminder-order">提醒 {index + 1}</span><ReminderSelect value={reminder.offset_minutes} disabledValues={new Set(form.reminders.filter((_, itemIndex) => itemIndex !== index).map(item => item.offset_minutes))} onChange={value => updateReminder(index, value)} /><button type="button" className="reminder-remove" onClick={() => removeReminder(index)} aria-label={`删除提醒 ${index + 1}`}><Trash2 size={15} /></button></div>)}</div>}<small className="reminder-help">最多添加 8 个提醒，按提前时间从远到近排列</small></div><div className="field wide"><span>重复规则</span><div className="segmented"><button type="button" className={form.mode === 'none' ? 'active' : ''} onClick={() => selectMode('none')}>不重复</button><button type="button" className={form.mode === 'solar' ? 'active' : ''} onClick={() => selectMode('solar')}>公历循环</button><button type="button" className={form.mode === 'lunar' ? 'active' : ''} onClick={() => selectMode('lunar')}>农历循环</button></div></div>{form.mode !== 'none' && <div className="recurrence-panel wide">{form.mode === 'solar' ? <><label className="inline-field">每 <input type="number" min="1" max="50" value={form.interval} onChange={event => update('interval', Number(event.target.value))} /> {form.freq === 'daily' ? '天' : form.freq === 'weekly' ? '周' : form.freq === 'monthly' ? '月' : '年'}</label><select value={form.freq} onChange={event => update('freq', event.target.value)}><option value="daily">每天</option><option value="weekly">每周</option><option value="monthly">每月</option><option value="yearly">每年</option></select></> : <><div className="lunar-rule-title"><span className="lunar-badge">农</span>每年农历 <select value={form.lunarMonth} onChange={event => update('lunarMonth', Number(event.target.value))}>{['正','二','三','四','五','六','七','八','九','十','冬','腊'].map((name, index) => <option key={index + 1} value={index + 1}>{name}月</option>)}</select><select value={form.lunarDay} onChange={event => update('lunarDay', Number(event.target.value))}>{Array.from({ length: 30 }, (_, index) => <option key={index + 1} value={index + 1}>初{index + 1}</option>)}</select></div><div className="lunar-options"><label><input type="checkbox" checked={form.leapPolicy === 'include'} onChange={event => update('leapPolicy', event.target.checked ? 'include' : 'ignore')} /> 出现闰月时额外提醒</label><span className="lunar-span-fixed">自动展开 20 年</span></div></>}</div>}<label className="field wide"><span>备注</span><textarea rows={3} value={form.description} onChange={event => update('description', event.target.value)} placeholder="写下更多细节…" /></label></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="button ghost" onClick={onClose}>取消</button><button className="button primary" disabled={saving} onClick={save}>{saving ? '保存中…' : '保存事件'}</button></div></section></div>;
}
