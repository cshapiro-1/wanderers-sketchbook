export type ActivityType = 'hotel' | 'restaurant' | 'museum' | 'shop' | 'transit' | 'nature';
export type Region = 'tokyo' | 'hakone' | 'osaka' | 'kyoto' | 'izu';

export interface Activity {
  lat: number;
  lng: number;
  title: string;
  time: string;
  type: ActivityType;
  desc: string;
  optional?: boolean;
  duration?: string;
}

export interface Meal {
  text: string;
  booked: boolean;
}

export interface DayMeals {
  breakfast: Meal;
  lunch: Meal;
  dinner: Meal;
}

export interface HotelAnchor {
  lat: number;
  lng: number;
  name: string;
  loop: boolean;
}

export interface RestaurantBooking {
  name: string;
  time: string;
  notes: string;
}

export interface Reservation {
  hotelConfirmation?: string;
  hotelCheckIn?: string;
  hotelCheckOut?: string;
  hotelAddress?: string;
  hotelPhone?: string;
  restaurantBookings?: RestaurantBooking[];
  transportRef?: string;
  notes?: string;
}

export interface UserEdits {
  activities: Record<string, { title?: string; description?: string; note?: string }>;
  meals: Record<string, { breakfast?: string; lunch?: string; dinner?: string }>;
}

export interface DocEntry {
  name: string;
  b64: string;
  mime: string;
}

export type BookUrgency = 'now' | 'dec' | 'feb' | 'apr' | 'may' | 'walk';
export type BookCategory = 'restaurant' | 'hotel' | 'experience';

export interface BookItem {
  key: string;
  name: string;
  category: BookCategory;
  dayRef: string;
  bookBy: string;
  urgency: BookUrgency;
  how: string;
  icon: string;
  note?: string;
}

export interface HotelStop {
  name: string;
  city: string;
  nights: number;
  checkIn: string;
  checkOut: string;
  perNight: number;
  note: string;
  onPoints: boolean;
}

export interface Phrase {
  jp: string;
  rom: string;
  en: string;
}

export interface PhraseCategory {
  cat: string;
  items: Phrase[];
}

export interface TransitOption {
  icon: string;
  mode: string;
  time: string;
  note?: string;
}

export interface ReturnTransitData {
  title: string;
  options: TransitOption[];
  warning?: string;
}
