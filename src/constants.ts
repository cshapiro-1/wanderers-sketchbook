import type { Region, HotelAnchor, ActivityType } from '@/types';

export const regionColors: Record<string, string> = {
  tokyo:  '#c87e18',
  izu:    '#4a7848',
  hakone: '#5878a0',
  osaka:  '#b84428',
  kyoto:  '#7a4a88',
};

export const regionMap: Record<number, Region> = {
  1:'kyoto', 2:'kyoto', 3:'kyoto', 4:'kyoto',
  5:'osaka', 6:'osaka', 7:'osaka', 8:'osaka',
  9:'hakone', 10:'hakone',
  11:'tokyo', 12:'tokyo', 13:'tokyo', 14:'tokyo', 15:'tokyo', 16:'tokyo', 17:'tokyo', 18:'tokyo', 19:'tokyo',
};

export const hotelAnchors: Record<number, HotelAnchor | null> = {
  1:  null,
  2:  { lat:34.9875, lng:135.7726, name:'Hyatt Regency Kyoto',    loop:true },
  3:  { lat:34.9875, lng:135.7726, name:'Hyatt Regency Kyoto',    loop:true },
  4:  { lat:34.9875, lng:135.7726, name:'Hyatt Regency Kyoto',    loop:false },
  5:  { lat:34.7042, lng:135.4960, name:'Conrad Osaka',           loop:true },
  6:  { lat:34.7042, lng:135.4960, name:'Conrad Osaka',           loop:true },
  7:  { lat:34.7042, lng:135.4960, name:'Conrad Osaka',           loop:true },
  8:  { lat:34.7042, lng:135.4960, name:'Conrad Osaka',           loop:false },
  9:  { lat:35.2466, lng:139.0671, name:'Gora Kadan',             loop:true },
  10: { lat:35.2466, lng:139.0671, name:'Gora Kadan',             loop:false },
  11: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  12: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  13: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  14: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  15: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  16: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  17: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  18: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:true },
  19: { lat:35.6717, lng:139.7645, name:'Hyatt Centric Ginza',    loop:false },
};

export const REGION_HEROES: Record<string, { gradient: string; tagline: string }> = {
  tokyo:  { gradient: 'linear-gradient(160deg,#120900 0%,#2a1400 55%,#5a2e08 100%)', tagline: "neon, concrete & perfect ramen at 2am" },
  izu:    { gradient: 'linear-gradient(160deg,#0a180a 0%,#1a3020 55%,#2a4830 100%)', tagline: 'bamboo forests, mountain springs & noh on water' },
  hakone: { gradient: 'linear-gradient(160deg,#0a1520 0%,#1a3040 55%,#2a4860 100%)', tagline: 'mountain mist, hot springs & fuji at dawn' },
  osaka:  { gradient: 'linear-gradient(160deg,#1e0808 0%,#4a1010 55%,#7a2020 100%)', tagline: "eat until you can't, then eat more" },
  kyoto:  { gradient: 'linear-gradient(160deg,#100a1a 0%,#251040 55%,#3a1850 100%)', tagline: 'ancient temples, silk fog & fourteen-course silence' },
};

export const typeIcon: Record<string, string> = {
  restaurant: '🍜',
  museum:     '🏛',
  nature:     '🌿',
  shop:       '🛍',
  transit:    '🚄',
  hotel:      '🏨',
};

export const typeLabel: Record<string, string> = {
  restaurant: 'Dining',
  museum:     'Culture',
  nature:     'Nature',
  shop:       'Shopping',
  transit:    'Transit',
  hotel:      'Hotel',
};

export const regionMap2: Record<number, string> = {
  1:'kyoto', 2:'kyoto', 3:'kyoto', 4:'kyoto',
  5:'osaka', 6:'osaka', 7:'osaka', 8:'osaka',
  9:'hakone', 10:'hakone',
  11:'tokyo', 12:'tokyo', 13:'tokyo', 14:'tokyo', 15:'tokyo', 16:'tokyo', 17:'tokyo', 18:'tokyo', 19:'tokyo',
};

export const regionGroups = [
  { name: 'Kyoto',  color: '#7a4a88', days: [1,2,3,4]                     },
  { name: 'Osaka',  color: '#b84428', days: [5,6,7,8]                     },
  { name: 'Hakone', color: '#5878a0', days: [9,10]                        },
  { name: 'Tokyo',  color: '#c87e18', days: [11,12,13,14,15,16,17,18,19] },
];
