"use client";
import { create } from "zustand";
import type { UserEdits, Reservation, DocEntry, Activity } from "@/types";

const EDITS_KEY = "wanderer_edits_v1";
const RESERVATIONS_KEY = "wanderer_reservations_v1";
const AI_KEY = "wanderer_ai_v1";

export interface TravelStore {
  activeDay: number;
  editMode: boolean;
  phrasebookOpen: boolean;
  docsPageOpen: boolean;
  hotelsOpen: boolean;
  flightOpen: boolean;
  restaurantsOpen: boolean;
  activitiesOpen: boolean;
  bookingOpen: boolean;
  currencyOpen: boolean;
  takkyubinOpen: boolean;
  rainMode: boolean;
  jpyRate: number;
  storyDay: number | null;
  storyStep: number;
  openStory: (day: number) => void;
  closeStory: () => void;
  setStoryStep: (step: number) => void;
  aiPlannerOpen: boolean;
  aiSuggestions: Record<number, Activity[]>;
  toggleAIPlanner: () => void;
  toggleRainMode: () => void;
  toggleCurrency: () => void;
  toggleTakkyubin: () => void;
  setJpyRate: (rate: number) => void;
  addAiSuggestion: (day: number, act: Activity) => void;
  removeAiSuggestion: (day: number, idx: number) => void;
  clearAiSuggestions: (day: number) => void;
  userEdits: UserEdits;
  reservations: Record<number, Reservation>;
  documents: Record<number, DocEntry[]>;
  selectedActivity: { key: string; lat: number; lng: number } | null;
  hoveredActivityKey: string | null;
  doneActivities: Record<string, boolean>;
  setActiveDay: (day: number) => void;
  toggleEditMode: () => void;
  togglePhrasebook: () => void;
  toggleDocsPage: () => void;
  toggleHotels: () => void;
  toggleFlight: () => void;
  toggleRestaurants: () => void;
  toggleActivities: () => void;
  toggleBooking: () => void;
  updateActivityEdit: (dayId: number, actIndex: number, field: "title" | "description", val: string) => void;
  updateNoteEdit: (dayId: number, actIndex: number, val: string) => void;
  updateMealEdit: (dayId: number, mealType: "breakfast" | "lunch" | "dinner", val: string) => void;
  updateReservation: (dayId: number, fields: Partial<Reservation>) => void;
  selectActivity: (key: string, lat: number, lng: number) => void;
  hoverActivity: (key: string | null) => void;
  toggleDone: (key: string) => void;
  addDocument: (dayId: number, entry: DocEntry) => void;
  removeDocument: (dayId: number, idx: number) => void;
}

function getLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}

export const useStore = create<TravelStore>((set) => ({
  activeDay: 1,
  editMode: false,
  phrasebookOpen: false,
  docsPageOpen: false,
  hotelsOpen: false,
  flightOpen: false,
  restaurantsOpen: false,
  activitiesOpen: false,
  bookingOpen: false,
  currencyOpen: false,
  takkyubinOpen: false,
  rainMode: false,
  jpyRate: 155,
  storyDay: null,
  storyStep: 0,
  openStory: (day) => set(() => ({ storyDay: day, storyStep: 0 })),
  closeStory: () => set(() => ({ storyDay: null, storyStep: 0 })),
  setStoryStep: (step) => set(() => ({ storyStep: step })),
  userEdits: getLS(EDITS_KEY, { activities: {}, meals: {} }),
  reservations: getLS(RESERVATIONS_KEY, {}),
  documents: getLS("wanderer_docs_v1", {}),
  selectedActivity: null,
  hoveredActivityKey: null,
  doneActivities: getLS("wanderer_done_v1", {}),
  aiPlannerOpen: false,
  aiSuggestions: getLS(AI_KEY, {}),
  toggleAIPlanner: () => set((s) => ({ aiPlannerOpen: !s.aiPlannerOpen })),
  toggleRainMode: () => set((s) => ({ rainMode: !s.rainMode })),
  toggleCurrency: () => set((s) => ({ currencyOpen: !s.currencyOpen })),
  toggleTakkyubin: () => set((s) => ({ takkyubinOpen: !s.takkyubinOpen })),
  setJpyRate: (rate) => set({ jpyRate: rate }),
  addAiSuggestion: (day, act) => set((state) => {
    const next = { ...state.aiSuggestions, [day]: [...(state.aiSuggestions[day] || []), act] };
    if (typeof window !== 'undefined') { try { localStorage.setItem(AI_KEY, JSON.stringify(next)); } catch {} }
    return { aiSuggestions: next };
  }),
  removeAiSuggestion: (day, idx) => set((state) => {
    const next = { ...state.aiSuggestions, [day]: (state.aiSuggestions[day] || []).filter((_, i) => i !== idx) };
    if (typeof window !== 'undefined') { try { localStorage.setItem(AI_KEY, JSON.stringify(next)); } catch {} }
    return { aiSuggestions: next };
  }),
  clearAiSuggestions: (day) => set((state) => {
    const next = { ...state.aiSuggestions }; delete next[day];
    if (typeof window !== 'undefined') { try { localStorage.setItem(AI_KEY, JSON.stringify(next)); } catch {} }
    return { aiSuggestions: next };
  }),
  setActiveDay: (day) => set({ activeDay: day, selectedActivity: null }),
  selectActivity: (key, lat, lng) => set((s) => ({ selectedActivity: s.selectedActivity?.key === key ? null : { key, lat, lng } })),
  hoverActivity: (key) => set({ hoveredActivityKey: key }),
  toggleDone: (key) => set((state) => {
    const next = { ...state.doneActivities, [key]: !state.doneActivities[key] };
    if (typeof window !== 'undefined') { try { localStorage.setItem("wanderer_done_v1", JSON.stringify(next)); } catch {} }
    return { doneActivities: next };
  }),
  addDocument: (dayId, entry) => set((state) => {
    const next = { ...state.documents };
    next[dayId] = [...(next[dayId] || []), entry];
    if (typeof window !== 'undefined') { try { localStorage.setItem("wanderer_docs_v1", JSON.stringify(next)); } catch {} }
    return { documents: next };
  }),
  removeDocument: (dayId, idx) => set((state) => {
    const next = { ...state.documents };
    next[dayId] = (next[dayId] || []).filter((_, i) => i !== idx);
    if (typeof window !== 'undefined') { try { localStorage.setItem("wanderer_docs_v1", JSON.stringify(next)); } catch {} }
    return { documents: next };
  }),
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),
  togglePhrasebook: () => set((s) => ({ phrasebookOpen: !s.phrasebookOpen })),
  toggleDocsPage: () => set((s) => ({ docsPageOpen: !s.docsPageOpen })),
  toggleHotels: () => set((s) => ({ hotelsOpen: !s.hotelsOpen })),
  toggleFlight: () => set((s) => ({ flightOpen: !s.flightOpen })),
  toggleRestaurants: () => set((s) => ({ restaurantsOpen: !s.restaurantsOpen })),
  toggleActivities: () => set((s) => ({ activitiesOpen: !s.activitiesOpen })),
  toggleBooking: () => set((s) => ({ bookingOpen: !s.bookingOpen })),
  updateActivityEdit: (dayId, actIndex, field, val) => set((state) => {
    const nextEdits = { ...state.userEdits };
    const key = `${dayId}_${actIndex}`;
    if (!nextEdits.activities[key]) nextEdits.activities[key] = {};
    nextEdits.activities[key][field] = val;
    if (typeof window !== 'undefined') { try { localStorage.setItem(EDITS_KEY, JSON.stringify(nextEdits)); } catch {} }
    return { userEdits: nextEdits };
  }),
  updateNoteEdit: (dayId, actIndex, val) => set((state) => {
    const key = `${dayId}_${actIndex}`;
    const prev = state.userEdits.activities[key] || {};
    return { userEdits: { ...state.userEdits, activities: { ...state.userEdits.activities, [key]: { ...prev, note: val } } } };
  }),
  updateMealEdit: (dayId, mealType, val) => set((state) => {
    const nextEdits = { ...state.userEdits };
    const key = String(dayId);
    if (!nextEdits.meals[key]) nextEdits.meals[key] = {};
    nextEdits.meals[key][mealType] = val;
    if (typeof window !== 'undefined') { try { localStorage.setItem(EDITS_KEY, JSON.stringify(nextEdits)); } catch {} }
    return { userEdits: nextEdits };
  }),
  updateReservation: (dayId, fields) => set((state) => {
    const nextReservations = { ...state.reservations };
    nextReservations[dayId] = { ...nextReservations[dayId], ...fields };
    if (typeof window !== 'undefined') { try { localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(nextReservations)); } catch {} }
    return { reservations: nextReservations };
  }),
}));
