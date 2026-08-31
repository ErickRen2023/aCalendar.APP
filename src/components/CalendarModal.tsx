import { useState } from 'react';
import { X } from 'lucide-react';
import { COLORS, type CalendarItem } from '../types';

interface Props {
  mode: 'create' | 'rename';
  calendar?: CalendarItem;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => Promise<void>;
}

export function CalendarModal({ mode, calendar, onClose, onSave }: Props) {
  const [name, setName] = useState(calendar?.name || '');
  const [color, setColor] = useState(calendar?.color || COLORS[0]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!name.trim()) {
      setError('请输入日历名称');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({ name: name.trim(), color });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className="modal calendar-modal" role="dialog" aria-modal="true" aria-labelledby="calendar-modal-title"><div className="modal-header"><div><span className="eyebrow">{mode === 'create' ? '新建日历' : '编辑日历'}</span><h2 id="calendar-modal-title">{mode === 'create' ? '先创建一个日历' : '调整日历信息'}</h2></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X size={20} /></button></div>{mode === 'create' && <p className="calendar-modal-intro">没有日历时，双击日期会先引导你创建日历。创建后就可以添加公历或农历事件了。</p>}<label className="field"><span>日历名称 <b>*</b></span><input autoFocus value={name} onChange={event => setName(event.target.value)} onKeyDown={event => event.key === 'Enter' && save()} placeholder="例如：家庭、工作、纪念日" maxLength={40} /></label><div className="calendar-color-field"><span>日历颜色</span><div className="calendar-color-options">{COLORS.map(option => <button key={option} type="button" className={`calendar-color-option ${color === option ? 'active' : ''}`} style={{ background: option }} onClick={() => setColor(option)} aria-label={`选择颜色 ${option}`} aria-pressed={color === option} />)}</div></div>{error && <p className="form-error">{error}</p>}<div className="modal-actions"><button className="button ghost" onClick={onClose}>取消</button><button className="button primary" disabled={saving} onClick={save}>{saving ? '保存中…' : mode === 'create' ? '创建日历' : '保存修改'}</button></div></section></div>;
}
