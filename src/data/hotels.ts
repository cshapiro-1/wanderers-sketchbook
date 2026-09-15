import type { HotelStop } from '@/types';

export const hotelStops: HotelStop[] = [
  { name: "Hyatt Regency Kyoto",        city: "Kyoto",  nights: 4, checkIn: "May 28", checkOut: "Jun 1",  perNight: 430, note: "FREE — 100k pts from 155k wedding block (Higashiyama luxury, RIRAKU Spa)", onPoints: true },
  { name: "Conrad Osaka",               city: "Osaka",  nights: 4, checkIn: "Jun 1",  checkOut: "Jun 5",  perNight: 380, note: "Cash / Hilton — 58th floor river confluence panorama", onPoints: false },
  { name: "Gora Kadan",                 city: "Hakone", nights: 2, checkIn: "Jun 5",  checkOut: "Jun 7",  perNight: 1200, note: "Includes in-room kaiseki, private onsen & in-room Shiatsu · Relais & Châteaux", onPoints: false },
  { name: "Hyatt Centric Ginza Tokyo",  city: "Tokyo",  nights: 8, checkIn: "Jun 7",  checkOut: "Jun 15", perNight: 420, note: "FREE / Subsidized — 55k wedding points + Chase UR (8 nights in Ginza)", onPoints: true },
];
