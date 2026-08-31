import { create } from 'zustand';
import type { ViewMode } from './types';

interface UiState { selectedCalendarId: number | null; viewMode: ViewMode; cursor: Date; editingEventId: number | null; modalOpen: boolean; setSelectedCalendarId: (id: number | null) => void; setViewMode: (mode: ViewMode) => void; setCursor: (date: Date) => void; openEvent: (id?: number) => void; closeEvent: () => void; }
export const useUiStore = create<UiState>((set) => ({ selectedCalendarId: null, viewMode: 'month', cursor: new Date(), editingEventId: null, modalOpen: false, setSelectedCalendarId: (id) => set({ selectedCalendarId: id }), setViewMode: (viewMode) => set({ viewMode }), setCursor: (cursor) => set({ cursor }), openEvent: (id) => set({ editingEventId: id ?? null, modalOpen: true }), closeEvent: () => set({ editingEventId: null, modalOpen: false }) }));
