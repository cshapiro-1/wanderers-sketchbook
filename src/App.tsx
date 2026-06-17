import React, { useEffect, useState, useRef } from 'react';
import { create } from 'zustand';
import { APIProvider, Map, useMap, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
import { Plus, Trash, BookOpen, ChevronDown, ChevronUp, Edit3, Check } from 'lucide-react';

// --- TS INTERFACES ---
export interface Activity {
  lat: number;
  lng: number;
  title: string;
  time: string;
  type: 'hotel' | 'restaurant' | 'museum' | 'shop' | 'transit' | 'nature';
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
  activities: Record<string, { title?: string; description?: string }>;
  meals: Record<string, { breakfast?: string; lunch?: string; dinner?: string }>;
}

interface TravelStore {
  activeDay: number;
  editMode: boolean;
  userEdits: UserEdits;
  reservations: Record<number, Reservation>;
  setActiveDay: (day: number) => void;
  toggleEditMode: () => void;
  updateActivityEdit: (dayId: number, actIndex: number, field: 'title' | 'description', val: string) => void;
  updateMealEdit: (dayId: number, mealType: 'breakfast' | 'lunch' | 'dinner', val: string) => void;
  updateReservation: (dayId: number, fields: Partial<Reservation>) => void;
}

const EDITS_KEY = 'wanderer_edits_v1';
const RESERVATIONS_KEY = 'wanderer_reservations_v1';

const useStore = create<TravelStore>((set) => ({
  activeDay: 1,
  editMode: false,
  userEdits: JSON.parse(localStorage.getItem(EDITS_KEY) || '{"activities":{},"meals":{}}'),
  reservations: JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '{}'),

  setActiveDay: (day) => set({ activeDay: day }),
  toggleEditMode: () => set((state) => ({ editMode: !state.editMode })),

  updateActivityEdit: (dayId, actIndex, field, val) => set((state) => {
    const nextEdits = { ...state.userEdits };
    const key = `${dayId}_${actIndex}`;
    if (!nextEdits.activities[key]) nextEdits.activities[key] = {};
    nextEdits.activities[key][field] = val;
    localStorage.setItem(EDITS_KEY, JSON.stringify(nextEdits));
    return { userEdits: nextEdits };
  }),

  updateMealEdit: (dayId, mealType, val) => set((state) => {
    const nextEdits = { ...state.userEdits };
    const key = String(dayId);
    if (!nextEdits.meals[key]) nextEdits.meals[key] = {};
    nextEdits.meals[key][mealType] = val;
    localStorage.setItem(EDITS_KEY, JSON.stringify(nextEdits));
    return { userEdits: nextEdits };
  }),

  updateReservation: (dayId, fields) => set((state) => {
    const nextReservations = { ...state.reservations };
    nextReservations[dayId] = { ...nextReservations[dayId], ...fields };
    localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(nextReservations));
    return { reservations: nextReservations };
  }),
}));

const regionColors: Record<string, string> = {
  tokyo: '#c87e18', izu: '#4a7848', hakone: '#5878a0', 'lake biwa': '#388888', osaka: '#b84428', kyoto: '#7a4a88'
};

const regionMap: Record<number, 'tokyo' | 'izu' | 'hakone' | 'lake biwa' | 'osaka' | 'kyoto'> = {
  1:'tokyo', 2:'tokyo', 3:'tokyo', 4:'tokyo', 5:'izu', 6:'izu', 7:'hakone', 8:'hakone',
  9:'lake biwa', 10:'osaka', 11:'osaka', 12:'osaka', 13:'kyoto', 14:'kyoto', 15:'kyoto', 16:'kyoto',
  17:'tokyo', 18:'tokyo'
};

const hotelAnchors: Record<number, HotelAnchor | null> = {
  1: null,
  2: { lat:35.6717, lng:139.7645, name:"Hyatt Centric Ginza", loop:true },
  3: { lat:35.6717, lng:139.7645, name:"Hyatt Centric Ginza", loop:true },
  4: { lat:35.6717, lng:139.7645, name:"Hyatt Centric Ginza", loop:true },
  5: { lat:35.6717, lng:139.7645, name:"Hyatt Centric Ginza", loop:false },
  6: { lat:34.9711, lng:139.0911, name:"Asaba Ryokan", loop:true },
  7: { lat:34.9711, lng:139.0911, name:"Asaba Ryokan", loop:false },
  8: { lat:35.2492, lng:139.0441, name:"Gora Kadan", loop:true },
  9: { lat:35.2492, lng:139.0441, name:"Gora Kadan", loop:false },
  10: { lat:35.2711, lng:135.9876, name:"Biwako Ryokisui", loop:false },
  11: { lat:34.7055, lng:135.4949, name:"InterContinental Osaka", loop:true },
  12: { lat:34.7055, lng:135.4949, name:"InterContinental Osaka", loop:true },
  13: { lat:34.7055, lng:135.4949, name:"InterContinental Osaka", loop:false },
  14: { lat:35.0538, lng:135.7319, name:"ROKU KYOTO", loop:true },
  15: { lat:35.0538, lng:135.7319, name:"ROKU KYOTO", loop:true },
  16: { lat:35.0538, lng:135.7319, name:"ROKU KYOTO", loop:true },
  17: { lat:35.0538, lng:135.7319, name:"ROKU KYOTO", loop:false },
  18: { lat:35.6812, lng:139.7671, name:"Tokyo Station Hotel", loop:false }
};

const activities: Record<number, Activity[]> = {
  1: [
    { lat:35.7766, lng:140.3929, title:"Narita International Airport", time:"Afternoon", type:"transit" },
    { lat:35.6717, lng:139.7645, title:"Hyatt Centric Ginza", time:"05:30 PM", type:"hotel" },
    { lat:35.6698, lng:139.7662, title:"Ginza Happo Seafood", time:"07:30 PM", type:"restaurant" }
  ],
  2: [
    { lat:35.6719, lng:139.7032, title:"Meiji Jingu Gyoen", time:"09:00 AM", type:"nature" },
    { lat:35.6621, lng:139.7161, title:"Nezu Museum Gardens", time:"11:30 AM", type:"museum" },
    { lat:35.6705, lng:139.7640, title:"Seiko Museum Ginza", time:"02:30 PM", type:"museum" }
  ],
  3: [
    { lat:35.7164, lng:139.7845, title:"Kappabashi Knife Street", time:"09:30 AM", type:"shop" },
    { lat:35.7096, lng:139.8112, title:"Sumida Park River Bank", time:"01:00 PM", type:"nature" }
  ],
  4: [
    { lat:35.6938, lng:139.7034, title:"Shinjuku Jazz Kissa", time:"04:00 PM", type:"restaurant" },
    { lat:35.6943, lng:139.6991, title:"Omoide Yokocho", time:"07:30 PM", type:"restaurant" }
  ],
  5: [
    { lat:35.6812, lng:139.7671, title:"Tokyo Station Shinkansen", time:"09:00 AM", type:"transit" },
    { lat:34.9711, lng:139.0911, title:"Asaba Ryokan, Shuzenji", time:"03:30 PM", type:"hotel" }
  ],
  6: [
    { lat:34.9723, lng:139.0818, title:"Shuzenji Bamboo Forest", time:"10:00 AM", type:"nature" },
    { lat:34.9711, lng:139.0911, title:"Asaba Kaiseki & Noh Stage", time:"06:00 PM", type:"restaurant" }
  ],
  7: [
    { lat:35.2012, lng:139.0234, title:"Hakone Tozan Railway", time:"11:00 AM", type:"transit" },
    { lat:35.2492, lng:139.0441, title:"Gora Kadan Imperial Onsen", time:"03:30 PM", type:"hotel" }
  ],
  8: [
    { lat:35.2441, lng:139.0325, title:"Hakone Open-Air Museum", time:"09:30 AM", type:"museum" },
    { lat:35.2429, lng:139.0194, title:"Owakudani Ropeway", time:"01:30 PM", type:"nature" }
  ],
  9: [
    { lat:35.3644, lng:136.3636, title:"Biwako Lakeside Express", time:"12:00 PM", type:"transit" },
    { lat:35.2711, lng:135.9876, title:"Lakeside Ryokan", time:"04:00 PM", type:"hotel" }
  ],
  10: [
    { lat:34.8924, lng:135.6742, title:"Suntory Yamazaki Distillery", time:"10:30 AM", type:"museum" },
    { lat:34.7055, lng:135.4949, title:"InterContinental Osaka", time:"04:00 PM", type:"hotel" }
  ],
  11: [
    { lat:34.6687, lng:135.5013, title:"Dotonbori Canal Walk", time:"05:00 PM", type:"nature" },
    { lat:34.6661, lng:135.5058, title:"Kushikatsu Counter", time:"07:30 PM", type:"restaurant" }
  ],
  12: [
    { lat:34.8183, lng:135.5501, title:"Church of the Light, Ibaraki", time:"10:00 AM", type:"museum" },
    { lat:34.7058, lng:135.4901, title:"Umeda Sky Building", time:"02:30 PM", type:"museum" }
  ],
  13: [
    { lat:34.9858, lng:135.7587, title:"Kyoto Station Arrival", time:"11:00 AM", type:"transit" },
    { lat:35.0538, lng:135.7319, title:"ROKU KYOTO Foothills", time:"03:00 PM", type:"hotel" }
  ],
  14: [
    { lat:35.0394, lng:135.7178, title:"Ryoan-ji Zen Garden", time:"08:30 AM", type:"museum" },
    { lat:35.0321, lng:135.7276, title:"Kinkaku-ji Golden Pavilion", time:"11:00 AM", type:"museum" }
  ],
  15: [
    { lat:35.0268, lng:135.7982, title:"Ginkaku-ji Silver Pavilion", time:"09:00 AM", type:"museum" },
    { lat:35.0205, lng:135.7958, title:"Philosopher's Path", time:"10:30 AM", type:"nature" }
  ],
  16: [
    { lat:35.0552, lng:135.7251, title:"Takagamine Tea House", time:"02:00 PM", type:"museum" },
    { lat:35.0538, lng:135.7319, title:"Clay-Pot Crab Dinner, ROKU", time:"06:30 PM", type:"restaurant" }
  ],
  17: [
    { lat:34.9858, lng:135.7587, title:"Kyoto → Nozomi Shinkansen", time:"11:30 AM", type:"transit" },
    { lat:35.6812, lng:139.7671, title:"Tokyo Station Hotel", time:"03:30 PM", type:"hotel" }
  ],
  18: [
    { lat:35.6852, lng:139.7614, title:"Imperial Palace East Gardens", time:"10:00 AM", type:"nature" },
    { lat:35.5494, lng:139.7798, title:"Haneda International Airport", time:"02:00 PM", type:"transit" }
  ]
};

const haikus: Record<number, string[]> = {
  1: ["Wheels touch foreign earth\nneon signs blur into signs\nTokyo begins", "Timber walls breathe warmth\nGinza hums six stories down\ndrop your bag and rest", "The sea arrives raw\nsnow crab glistens under ice\nsalt dissolves the day"],
  2: ["Cedar shadows fall\nKiyomasa's well holds still\nthe forest breathes deep", "Bamboo lines the path\nstone lanterns emerge from leaves\nhidden, always here", "A pendulum swings\neach gear a piece of the year\ntime assembles still"],
  3: ["Cold iron waits here\na blacksmith's year in the blade\nhold it, feel the edge", "Old water meets new\nwhere the river bends, a bridge\nTokyo reflects"],
  4: ["Vinyl turns slowly\namber in a dark corner\nthe trumpet holds on", "Smoke lifts between stalls\nbinchotan chars the long night\nsalt, char, and cold beer"],
  5: ["A white dart southward\ntowers thin to cedar hills\nspeed erases both", "Cross the wooden gate\na Noh stage floats on water\nthe spring breathes below"],
  6: ["Green columns rise straight\nlight dissolves to jade above\nno sound, only stalk", "Dashi, then lacquer\nthe actor's mask holds the lake\ndarkness understands"],
  7: ["The train folds backward\ncedar ravines grip the rail\nthe mountain yields first", "Stone pools, old bloodlines\nthe mineral spring holds time\nbreathe in, then release"],
  8: ["Bronze figures stand still\npeaks do not know their own names\nboth belong to sky", "Sulfur splits the air\nFuji ghosted in the west\nearth is still working"],
  9: ["Japan's oldest lake\nthe old roads still follow it\nstill water, still trade", "Tatami, still lake\nthe shoji glows at twilight\nunpack, then breathe out"],
  10: ["Three rivers converge\noak remembers what spring said\nsip slowly, one dram", "Glass walls, city grid\nthe neon haze pulses far\nOsaka below"],
  11: ["Light floods the canal\nthe crab sign spins above all\nOsaka laughs loud", "Panko hits the oil\none dip, never twice, the rule\ncrisp to the bone, done"],
  12: ["A cross cut in stone\nmorning enters as pure light\nAndo left no more", "Two towers, one void\nglass walks you through the open\nOsaka breathes up"],
  13: ["The north grows older\nwooden eaves on green hillsides\na thousand-year calm", "Mountains at the door\nraked stone, clear stream, cedar shade\narrive, then be still"],
  14: ["Fifteen stones remain\nno one agrees what they mean\nthat is the whole point", "Still water holds gold\nthe pavilion never speaks\nmoss does the talking"],
  15: ["Sand cone waits for moon\nthe pavilion ungilded\nsilver needs no proof", "Stones beside water\ncherry boughs bend to the stream\nwalk slowly, think less"],
  16: ["Bamboo fills the cup\nthe whisk turns froth into art\nquiet follows you", "Snow crab meets the clay\nsteam lifts the lid, rice below\nthis is the whole meal"],
  17: ["Green hills stream backward\nthe coast curves east, then the grid\nTokyo grows back", "Old red bricks enclose\na room inside the great clock\nsleep in the station"],
  18: ["Black pine, granite moat\nwalls cut by ten thousand hands\none last morning walk", "The gate opens last\nTokyo dims through the glass\ncarry what you learned"]
};

const meals: Record<number, DayMeals> = {
  1:  { breakfast: { text: "In transit — long-haul flight, arrive Narita past noon", booked: false }, lunch: { text: "Narita Airport ramen hall · a grounding bowl of shoyu or tonkotsu, the first Japanese mouthful", booked: false }, dinner: { text: "Ginza Happo · raw oysters on ice and snow crab legs, first maritime meal of the journey", booked: true  } },
  2:  { breakfast: { text: "Kimuraya Honten Ginza · Japan's oldest bakery (est. 1869), fresh anpan straight from the oven on Chuo-dori", booked: false }, lunch: { text: "Maisen Tonkatsu Aoyama · legendary crispy pork cutlet set in a converted Meiji-era public bathhouse", booked: false }, dinner: { text: "Sushi Yoshitake or Ginza Sushi Iwa · intimate omakase nigiri at the counter, seasonal selections", booked: false } },
  3:  { breakfast: { text: "Shiseido Parlour Ginza · seventh-floor café above the historic cosmetics flagship, eggs and coffee over the rooftops", booked: false }, lunch: { text: "Sometaro Asakusa · monjayaki griddle cakes and cold Sapporo in the old shitamachi quarter", booked: false }, dinner: { text: "Otafuku Asakusa (est. 1945) · oden simmered in clear dashi, a beloved winter ritual in the old neighbourhood", booked: false } },
  4:  { breakfast: { text: "Shinjuku Isetan B2 food hall · melon pan and seasonal fruit from Japan's most celebrated basement market", booked: false }, lunch: { text: "Fuunji Shinjuku · thick wavy tsukemen with a richly complex dipping broth, a Shinjuku cult institution", booked: false }, dinner: { text: "Omoide Yokocho · binchotan yakitori in the smoky lantern-lit alley, cold draft beer, Shinjuku night", booked: true  } },
  5:  { breakfast: { text: "Standing soba at Iwa near Shinbashi · a quick pre-shinkansen bowl of cold seiro soba, classic Tokyo fuel", booked: false }, lunch: { text: "Ekiben on the Shinkansen · wappa meshi bento box, cold green tea, watching the coast dissolve into green hills", booked: false }, dinner: { text: "Asaba Ryokan kaiseki · mountain vegetables, clear dashi, perfect local sake — first night deep in the Izu forest", booked: false } },
  6:  { breakfast: { text: "Morning walk to Shuzenji town · fresh warabi mochi and matcha at Toko-an sweet shop by the ancient spring", booked: false }, lunch: { text: "Shuzenji Agetofu · freshly deep-fried local tofu near the bamboo shrine, cold matcha alongside", booked: false }, dinner: { text: "Asaba multi-course kaiseki · sixteen lacquered courses, the floating Noh stage lit against the still water", booked: true  } },
  7:  { breakfast: { text: "Oraga Soba Shuzenji · handmade buckwheat noodles at a riverside local, a final taste of Izu before the mountain transit", booked: false }, lunch: { text: "Yuba tofu café in Hakone · silken tofu skin drawn fresh from soy milk, ponzu, mountain quietude", booked: false }, dinner: { text: "Gyoza Center Hakone Yumoto · no-frills gyoza and ramen beloved by the mountain-town locals, comfort after the switchback climb", booked: false } },
  8:  { breakfast: { text: "Amazake Chaya (甘酒茶屋) · a tea house in continuous operation since 1618 on the old Tokaido road, sweet fermented amazake and grilled mochi", booked: false }, lunch: { text: "Owakudani kuro-tamago · sulfur-blackened eggs boiled in volcanic spring water, eaten hot on the ridge", booked: false }, dinner: { text: "Kasho Gyoshin near Hakone · local kaiseki dinner away from the hotel, mountain forage and delicate plating", booked: false } },
  9:  { breakfast: { text: "Bakery & Table Hakone Yumoto · lakeside morning toast and coffee at the wooden terrace before the long westward transit", booked: false }, lunch: { text: "En route stop · Omi beef yakiniku at a Shiga roadside restaurant — the prefecture's quietly famous hidden gem", booked: false }, dinner: { text: "Shatei Hamasho Otsu · freshwater eel (unagi) and funa-zushi (fermented crucian carp) at a local lakeside restaurant, Shiga's most ancient flavour", booked: false } },
  10: { breakfast: { text: "Otsu morning market · freshly caught lake fish, pickled vegetables, and miso from the waterside market stalls", booked: false }, lunch: { text: "Near Yamazaki Distillery · whisky-paired small plates and Kyoto vegetable dishes at a riverside restaurant", booked: false }, dinner: { text: "Endo Sushi near Osaka Fish Market · the legendary market sushi counter open since the wholesale market days, fish so fresh it needs nothing", booked: false } },
  11: { breakfast: { text: "Ichiwa mochi-ya · grilled mochi with sweet red bean paste at a shop that has stood near Imamiya Shrine since the year 1000", booked: false }, lunch: { text: "Mizuno Okonomiyaki · Dotonbori's 1945 original, mountain-yam batter griddled tableside to a golden crust", booked: false }, dinner: { text: "Daruma Kushikatsu · the original 1929 panko-skewer counter — crispy, golden, strict no-double-dipping rule enforced", booked: true  } },
  12: { breakfast: { text: "Café Absinthe Nakazakicho · creative all-day brunch in Osaka's most charming vintage neighbourhood, vintage tiles and morning coffee", booked: false }, lunch: { text: "Tsuruhashi yakiniku · tabletop wagyu and kimchi in Osaka's Korean quarter, the oldest and most fragrant covered market", booked: false }, dinner: { text: "Namba takoyaki crawl · five different stands along the Golden Street, comparing batter, char, and bonito flake technique", booked: false } },
  13: { breakfast: { text: "Chibo Namba · one final Osaka okonomiyaki before the train north — the city's unofficial farewell dish, griddle-crisped at the table", booked: false }, lunch: { text: "Nishiki Market, Kyoto · Kyoto's ancient kitchen — tamagoyaki skewers, fresh tsukemono, tofu, warm soy milk from the stalls", booked: false }, dinner: { text: "Kikunoi Roan · the warm branch of 3-Michelin-star Kikunoi, Kyoto kaiseki in the stone-lantern-lined Maruyama hills", booked: false } },
  14: { breakfast: { text: "Inoda Coffee Honten · the Kyoto kissaten institution since 1940, European-style breakfast in a beloved old shophouse near Sanjo", booked: false }, lunch: { text: "Shoraian Yudofu near Kinkaku-ji · silken tofu simmered slowly in spring-clear dashi in an old garden setting", booked: false }, dinner: { text: "Kichisen Kyoto · Japan's most revered kaiseki table — tea-ceremony cuisine at its very peak, book months ahead", booked: false } },
  15: { breakfast: { text: "Sarasa Nishijin · morning coffee and toast in a converted 1920s public bathhouse, azulejo-tiled walls and slow light", booked: false }, lunch: { text: "Canal-side café on the Philosopher's Path · tofu dengaku and cold barley tea, a wooden bench above the stone waterway", booked: false }, dinner: { text: "Hyotei Kyoto · one of the oldest kaiseki restaurants in the world, serving the morning tea-ceremony meal since the 1600s", booked: false } },
  16: { breakfast: { text: "Café Bibliotic Hello! · morning pour-over in a converted Kyoto machiya townhouse, textured plaster walls and quiet shelves", booked: false }, lunch: { text: "Takagamine Tea House Estate · wagashi sweets and whisked matcha, deep tatami silence in the northern hills", booked: true  }, dinner: { text: "ROKU KYOTO Clay-Pot Crab Rice · sweet snow crab steamed over heirloom rice, intimate donabe at the foothills", booked: true  } },
  17: { breakfast: { text: "Tousuiro near Kyoto Station · a tofu kaiseki morning set — silken, clear-dashi richness, the definitive final Kyoto meal", booked: false }, lunch: { text: "Tokyo Station Ramen Street · eight premier ramen shops beneath the historic brick vault, choose your broth", booked: false }, dinner: { text: "Sushi Kanesaka Ginza · an elegant omakase counter a short walk from the station, a refined return to the capital", booked: false } },
  18: { breakfast: { text: "Le Bretagne Yurakucho · Breton buckwheat galettes and café crème across from Hibiya Park, a beloved Tokyo morning institution since 1994", booked: false }, lunch: { text: "Marunouchi sushi · a final counter omakase — close the loop on the journey in the shadow of the old brick station", booked: false }, dinner: { text: "Haneda international lounge · a quiet pre-flight meal before the long arc home", booked: false } }
};

const dayMeta: Record<number, { title: string; lodging: string }> = {
  1:  { title: "Day 1: Arrival into Neon Mist", lodging: "Hyatt Centric Ginza" },
  2:  { title: "Day 2: Secret Gardens & Mechanical Masters", lodging: "Hyatt Centric Ginza" },
  3:  { title: "Day 3: Shokunin Crafts & Sumida Reflections", lodging: "Hyatt Centric Ginza" },
  4:  { title: "Day 4: Mid-Century Vinyl & Izakaya Alleyways", lodging: "Hyatt Centric Ginza" },
  5:  { title: "Day 5: Coastal Pathways into the Izu Peninsula", lodging: "Asaba Ryokan" },
  6:  { title: "Day 6: Deep Bamboo Groves & Floating Noh Stages", lodging: "Asaba Ryokan" },
  7:  { title: "Day 7: Through Cloud Passes to Hakone Caldera", lodging: "Gora Kadan" },
  8:  { title: "Day 8: Open-Air Sculpture & Volcanic Vents", lodging: "Gora Kadan" },
  9:  { title: "Day 9: Lake Biwa Rail Cruising", lodging: "Biwako Ryokisui" },
  10: { title: "Day 10: Distilleries of the Yamazaki Glen", lodging: "InterContinental Osaka" },
  11: { title: "Day 11: Osaka Neon Valleys & Street Gastronomy", lodging: "InterContinental Osaka" },
  12: { title: "Day 12: Architectural Concrete & Tadao Ando", lodging: "InterContinental Osaka" },
  13: { title: "Day 13: Entry into the Thousand-Year Capital", lodging: "Roku Kyoto" },
  14: { title: "Day 14: Zen Rocks & Moss Courtyards", lodging: "Roku Kyoto" },
  15: { title: "Day 15: Silver Pavilions & Philosopher Pathways", lodging: "Roku Kyoto" },
  16: { title: "Day 16: Hidden Foothill Tea Shrines", lodging: "Roku Kyoto" },
  17: { title: "Day 17: Return Flight Line to the Capital Grid", lodging: "Tokyo Station Hotel" },
  18: { title: "Day 18: Final Reflections Over the Moat Walls", lodging: "Departure Outbound" }
};

const vignettePlacement: Record<number, number | null> = {
  1: 2, 2: null, 3: 1, 4: null, 5: 1, 6: null, 7: 1, 8: null, 9: 1, 10: null, 11: 1, 12: null, 13: 1, 14: null, 15: 1, 16: null, 17: 1, 18: null
};

const vignetteStyle: Record<number, string> = {
  1:  "float:right;width:192px;height:118px;margin:4px 0 8px 12px;transform:rotate(2deg)",
  2:  "float:right;width:165px;height:165px;margin:4px 0 8px 12px;transform:rotate(-2.5deg)",
  3:  "float:right;width:210px;height:95px;margin:4px 0 8px 12px;transform:rotate(1.5deg)",
  4:  "float:right;width:168px;height:168px;margin:4px 0 8px 12px;transform:rotate(4deg)",
  5:  "float:right;width:200px;height:118px;margin:4px 0 8px 12px;transform:rotate(-1deg)",
  6:  "float:right;width:108px;height:195px;margin:4px 0 8px 12px;transform:rotate(-2deg)",
  7:  "float:right;width:198px;height:112px;margin:4px 0 8px 12px;transform:rotate(1deg)",
  8:  "float:right;width:188px;height:112px;margin:4px 0 8px 12px;transform:rotate(-3deg)",
  9:  "float:right;width:196px;height:118px;margin:4px 0 8px 12px;transform:rotate(1.5deg)",
  10: "float:right;width:172px;height:162px;margin:4px 0 8px 12px;transform:rotate(2.5deg)",
  11: "float:right;width:178px;height:145px;margin:4px 0 8px 12px;transform:rotate(-3.5deg)",
  12: "float:right;width:168px;height:158px;margin:4px 0 8px 12px;transform:rotate(-1.5deg)",
  13: "float:right;width:168px;height:102px;margin:4px 0 8px 12px;transform:rotate(2deg)",
  14: "float:right;width:200px;height:120px;margin:4px 0 8px 12px;transform:rotate(-2deg)",
  15: "float:right;width:196px;height:118px;margin:4px 0 8px 12px;transform:rotate(1deg)",
  16: "float:right;width:168px;height:152px;margin:4px 0 8px 12px;transform:rotate(3deg)",
  17: "float:right;width:196px;height:118px;margin:4px 0 8px 12px;transform:rotate(-2deg)",
  18: "float:right;width:200px;height:118px;margin:4px 0 8px 12px;transform:rotate(1.5deg)"
};

// --- SUB-COMPONENTS ---

const AmbientLayer: React.FC = () => {
  const [fireflies, setFireflies] = useState<any[]>([]);
  const [soots, setSoots] = useState<any[]>([]);

  useEffect(() => {
    const fInterval = setInterval(() => {
      setFireflies((prev) => {
        const next = [...prev, {
          id: Math.random(),
          left: `${Math.random() * 95}vw`,
          top: `${40 + Math.random() * 50}vh`,
          size: `${3 + Math.random() * 4}px`,
          duration: `${5 + Math.random() * 7}s`,
        }];
        if (next.length > 12) next.shift();
        return next;
      });
    }, 2500);

    const sInterval = setInterval(() => {
      if (Math.random() < 0.3) {
        setSoots((prev) => {
          const next = [...prev, {
            id: Math.random(),
            left: `${Math.random() * 90}vw`,
            duration: `${8 + Math.random() * 6}s`,
          }];
          if (next.length > 5) next.shift();
          return next;
        });
      }
    }, 3500);

    return () => {
      clearInterval(fInterval);
      clearInterval(sInterval);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute top-10 w-44 h-16 opacity-30 bg-[#ede6d8] rounded-full filter blur-xl" style={{ animation: 'cloudDrift 80s linear infinite' }} />
      <div className="absolute top-44 w-60 h-20 opacity-20 bg-[#ede6d8] rounded-full filter blur-xl" style={{ animation: 'cloudDrift 110s linear infinite', animationDelay: '-30s' }} />
      {fireflies.map((f) => (
        <div key={f.id} className="absolute rounded-full bg-[#e8a830] opacity-0 shadow-[0_0_8px_#e8a830]" style={{ left: f.left, top: f.top, width: f.size, height: f.size, animation: `fireflyFloat ${f.duration} ease-in-out infinite` }} />
      ))}
      {soots.map((s) => (
        <div key={s.id} className="absolute w-3 h-3 bg-[#1e1208] rounded-full opacity-0 flex items-center justify-center" style={{ left: s.left, top: '-20px', animation: `sootFall ${s.duration} linear forwards` }}>
          <div className="absolute w-[3px] h-[3px] bg-white rounded-full left-[2px] top-[4px] flex items-center justify-center"><div className="w-[1.2px] h-[1.2px] bg-black rounded-full" /></div>
          <div className="absolute w-[3px] h-[3px] bg-white rounded-full right-[2px] top-[4px] flex items-center justify-center"><div className="w-[1.2px] h-[1.2px] bg-black rounded-full" /></div>
          <div className="absolute inset-0 border border-dashed border-[#1e1208] rounded-full scale-110" />
        </div>
      ))}
    </div>
  );
};

const Header: React.FC = () => (
  <header className="app-header">
    <div className="header-left">
      <h1>The Wanderer's Sketchbook</h1>
      <p>An 18-Day Journey Through Landscapes, Flavors, and Hidden Valleys</p>
    </div>
    <svg width="84" height="84" style={{ position: 'absolute', right: '32px', top: '12px', opacity: 0.07, color: '#1e1208', pointerEvents: 'none' }} viewBox="0 0 100 100">
      <ellipse cx="50" cy="55" rx="32" ry="26" fill="currentColor" />
      <ellipse cx="40" cy="24" rx="5" ry="12" fill="currentColor" transform="rotate(-15 40 24)" />
      <ellipse cx="60" cy="24" rx="5" ry="12" fill="currentColor" transform="rotate(15 60 24)" />
      <circle cx="38" cy="48" r="4" fill="currentColor" />
      <circle cx="62" cy="48" r="4" fill="currentColor" />
      <path d="M 32 55 Q 50 68 68 55" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="26" y1="48" x2="12" y2="46" stroke="currentColor" strokeWidth="1.5" />
      <line x1="26" y1="52" x2="10" y2="52" stroke="currentColor" strokeWidth="1.5" />
      <line x1="74" y1="48" x2="88" y2="46" stroke="currentColor" strokeWidth="1.5" />
      <line x1="74" y1="52" x2="90" y2="52" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  </header>
);

const DayNav: React.FC = () => {
  const { activeDay, setActiveDay } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeEl = containerRef.current?.querySelector(`[data-day="${activeDay}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeDay]);

  return (
    <div className="nav-container">
      <div ref={containerRef} className="day-nav">
        {Array.from({ length: 18 }, (_, i) => {
          const day = i + 1;
          const reg = regionMap[day];
          const color = regionColors[reg];
          const isActive = activeDay === day;
          return (
            <button key={day} data-day={day} onClick={() => setActiveDay(day)} className={`nav-btn ${isActive ? 'active' : ''}`}>
              <div className="nav-btn-color-bar" style={{ backgroundColor: color }} />
              DAY {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};

const RegionLegend: React.FC = () => (
  <div className="region-legend">
    {Object.entries(regionColors).map(([name, color]) => (
      <div key={name} className="legend-item">
        <span className="legend-dot" style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }} />
        {name}
      </div>
    ))}
  </div>
);

const _vbMap: Record<number,string> = {
  1:"0 0 200 120",2:"0 0 200 200",3:"0 0 240 90",4:"0 0 200 200",
  5:"0 0 200 120",6:"0 0 130 220",7:"0 0 200 120",8:"0 0 200 120",
  9:"0 0 200 120",10:"0 0 200 160",11:"0 0 200 140",12:"0 0 200 160",
  13:"0 0 200 120",14:"0 0 200 120",15:"0 0 200 120",16:"0 0 200 160",
  17:"0 0 200 120",18:"0 0 200 120",
};
const ArtVignette: React.FC<{ day: number }> = ({ day }) => {
  const renderSVGContent = () => {
    switch (day) {
      case 1: // 0 0 200 120
        return (
          <>
<path d="M0 90 L15 90 L15 65 L25 65 L25 55 L40 55 L40 68 L55 68 L55 48 L68 48 L68 65 L82 65 L82 42 L94 42 L94 68 L108 68 L108 52 L120 52 L120 72 L135 72 L135 58 L148 58 L148 82 L162 82 L162 62 L175 62 L175 90 L200 90" stroke="#c8bfa0" strokeWidth="1" fill="none" opacity="0.35"/>
                        <ellipse cx="100" cy="115" rx="52" ry="7" fill="#c8bfa0" opacity="0.25"/>
                        <path d="M42 78 C42 105 158 105 158 78 L152 68 C134 88 66 88 48 68 Z" fill="#e8dfc8" stroke="#9c8340" strokeWidth="1.8"/>
                        <ellipse cx="100" cy="68" rx="52" ry="13" fill="#ddd4bc" stroke="#9c8340" strokeWidth="1.8"/>
                        <ellipse cx="100" cy="66" rx="46" ry="10" fill="#c87e18" fillOpacity="0.22"/>
                        <path d="M68 63 Q 80 57, 95 62 T 118 59" stroke="#e0d4bc" strokeWidth="1.8" fill="none"/>
                        <path d="M70 68 Q 85 62, 100 67 T 128 64" stroke="#e0d4bc" strokeWidth="1.5" fill="none"/>
                        <circle cx="84" cy="62" r="9" fill="#f5edd8" stroke="#9c8340" strokeWidth="1.2"/>
                        <circle cx="84" cy="62" r="5" fill="#c87e18" fillOpacity="0.7"/>
                        <rect x="108" y="55" width="10" height="18" rx="1" fill="#3a5c32" fillOpacity="0.75" transform="rotate(-8 113 64)"/>
                        <circle cx="119" cy="70" r="2.2" fill="#5c8050"/><circle cx="124" cy="67" r="1.8" fill="#5c8050"/><circle cx="115" cy="67" r="1.8" fill="#5c8050"/>
                        <line x1="55" y1="30" x2="96" y2="72" stroke="#9c6c30" strokeWidth="2.5" strokeLinecap="round"/>
                        <line x1="65" y1="27" x2="104" y2="68" stroke="#9c6c30" strokeWidth="2.5" strokeLinecap="round"/>
                        <path className="steam-line"        d="M78 54 Q 73 41 80 30 T 74 18" stroke="#a8b8a0" strokeWidth="1.8" fill="none"/>
                        <path className="steam-line steam-2" d="M100 52 Q 95 39 102 28 T 96 15" stroke="#a8b8a0" strokeWidth="1.8" fill="none"/>
                        <path className="steam-line steam-3" d="M120 54 Q 115 41 122 30 T 116 18" stroke="#a8b8a0" strokeWidth="1.5" fill="none"/>
          </>
        );
      case 2: // 0 0 200 200
        return (
          <>
<ellipse cx="100" cy="192" rx="48" ry="6" fill="#c8bfa0" opacity="0.25"/>
                        <path d="M100 22 Q 116 10 122 5" stroke="#c4a878" strokeWidth="2.5" fill="none"/>
                        <circle cx="122" cy="5" r="4" fill="none" stroke="#c4a878" strokeWidth="1.8"/>
                        <circle cx="100" cy="108" r="78" fill="#e8dfc8" fillOpacity="0.45" stroke="#9c8340" strokeWidth="2.5"/>
                        <circle cx="100" cy="108" r="70" fill="none" stroke="#c4a878" strokeWidth="1.2"/>
                        <circle cx="100" cy="108" r="64" fill="#f5edd8" fillOpacity="0.92" stroke="#c4a878" strokeWidth="0.8"/>
                        <line x1="100" y1="46" x2="100" y2="56" stroke="#5c4228" strokeWidth="3"/>
                        <line x1="100" y1="160" x2="100" y2="170" stroke="#5c4228" strokeWidth="3"/>
                        <line x1="38" y1="108" x2="48" y2="108" stroke="#5c4228" strokeWidth="3"/>
                        <line x1="152" y1="108" x2="162" y2="108" stroke="#5c4228" strokeWidth="3"/>
                        <line x1="55" y1="63" x2="62" y2="70" stroke="#9c8340" strokeWidth="2"/>
                        <line x1="145" y1="63" x2="138" y2="70" stroke="#9c8340" strokeWidth="2"/>
                        <line x1="55" y1="153" x2="62" y2="146" stroke="#9c8340" strokeWidth="2"/>
                        <line x1="145" y1="153" x2="138" y2="146" stroke="#9c8340" strokeWidth="2"/>
                        <line x1="164" y1="75" x2="156" y2="81" stroke="#c4a878" strokeWidth="1.5"/>
                        <line x1="164" y1="141" x2="156" y2="135" stroke="#c4a878" strokeWidth="1.5"/>
                        <line x1="36" y1="75" x2="44" y2="81" stroke="#c4a878" strokeWidth="1.5"/>
                        <line x1="36" y1="141" x2="44" y2="135" stroke="#c4a878" strokeWidth="1.5"/>
                        <circle cx="100" cy="140" r="14" fill="none" stroke="#c4a878" strokeWidth="1.2"/>
                        <line x1="100" y1="129" x2="100" y2="151" stroke="#c4a878" strokeWidth="0.8"/>
                        <line x1="89"  y1="140" x2="111" y2="140" stroke="#c4a878" strokeWidth="0.8"/>
                        <text x="100" y="102" textAnchor="middle" fontSize="12" fill="#9c8340" fontStyle="italic" font-family="serif">精工</text>
                        <line x1="100" y1="108" x2="100" y2="72" stroke="#1e1208" strokeWidth="4" strokeLinecap="round"/>
                        <line x1="100" y1="108" x2="130" y2="120" stroke="#1e1208" strokeWidth="3" strokeLinecap="round"/>
                        <line x1="100" y1="108" x2="88" y2="148" stroke="#b83020" strokeWidth="1.5" strokeLinecap="round"/>
                        <circle cx="100" cy="108" r="5" fill="#b83020"/>
                        <circle cx="100" cy="108" r="2" fill="#f2e8d0"/>
          </>
        );
      case 3: // 0 0 240 90
        return (
          <>
<ellipse cx="120" cy="86" rx="100" ry="5" fill="#c8bfa0" opacity="0.2"/>
                        <path d="M12 40 L165 30 L186 40 L165 50 L12 51 Z" fill="#dde8e4" stroke="#9c8340" strokeWidth="1.5"/>
                        <path d="M12 40 L165 30 L186 40" stroke="white" strokeWidth="0.8" fill="none" opacity="0.7"/>
                        <path d="M25 38 L162 32" stroke="#c8d4d0" strokeWidth="0.8" fill="none"/>
                        <path d="M25 43 L162 37" stroke="#c8d4d0" strokeWidth="0.6" fill="none" opacity="0.7"/>
                        <path d="M18 43 Q 70 40, 120 43 T 165 42" stroke="#f0ece4" strokeWidth="1.2" fill="none" strokeDasharray="5 2"/>
                        <circle cx="138" cy="40" r="8" fill="none" stroke="#9c8340" strokeWidth="0.8" opacity="0.6"/>
                        <text x="138" y="43" textAnchor="middle" fontSize="7" fill="#9c8340" font-family="serif">匠</text>
                        <path d="M165 30 L172 25 L178 30 L172 35 Z" fill="#c8d4d0" stroke="#9c8340" strokeWidth="1"/>
                        <rect x="178" y="26" width="10" height="28" rx="2" fill="#c4a878" stroke="#9c8340" strokeWidth="1.8"/>
                        <rect x="188" y="28" width="34" height="24" rx="4" fill="#8c5c28" stroke="#6b4010" strokeWidth="1.8"/>
                        <line x1="195" y1="28" x2="195" y2="52" stroke="#6b4010" strokeWidth="1.2" opacity="0.55"/>
                        <line x1="203" y1="28" x2="203" y2="52" stroke="#6b4010" strokeWidth="1.2" opacity="0.55"/>
                        <line x1="211" y1="28" x2="211" y2="52" stroke="#6b4010" strokeWidth="1.2" opacity="0.55"/>
                        <circle cx="199" cy="40" r="3" fill="#c4a878" stroke="#9c8340" strokeWidth="0.8"/>
                        <circle cx="213" cy="40" r="3" fill="#c4a878" stroke="#9c8340" strokeWidth="0.8"/>
                        <path className="float-item" d="M5 25 L11 18 L9 27 Z" fill="#c87e18" opacity="0.85"/>
                        <path className="float-item" style={{animationDelay: '0.7s'}} d="M2 36 L8 30 L6 38 Z" fill="#e8a830" opacity="0.6"/>
                        <path className="float-item" style={{animationDelay: '1.4s'}} d="M10 30 L15 24 L13 31 Z" fill="#c87e18" opacity="0.5"/>
          </>
        );
      case 4: // 0 0 200 200
        return (
          <>
<ellipse cx="80" cy="194" rx="58" ry="7" fill="#c8bfa0" opacity="0.3"/>
                        <circle cx="80" cy="105" r="88" fill="#1e1208"/>
                        <circle cx="80" cy="105" r="83" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="75" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="67" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="59" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="51" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="43" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="35" fill="none" stroke="#2a2010" strokeWidth="0.8"/>
                        <circle cx="80" cy="105" r="30" fill="#c87e18" fillOpacity="0.88"/>
                        <circle cx="80" cy="105" r="27" fill="none" stroke="#e8a830" strokeWidth="1"/>
                        <text x="80" y="98"  textAnchor="middle" fontSize="8"   fill="#f5edd8" font-family="serif" fontStyle="italic">Jazz Kissa</text>
                        <text x="80" y="108" textAnchor="middle" fontSize="6.5" fill="#f5edd8" font-family="serif">新宿</text>
                        <text x="80" y="118" textAnchor="middle" fontSize="6"   fill="#f5edd8" font-family="serif" opacity="0.8">Side A · 33⅓ rpm</text>
                        <circle cx="80" cy="105" r="5" fill="#1e1208"/>
                        <line x1="188" y1="18" x2="115" y2="88" stroke="#9c8340" strokeWidth="3" strokeLinecap="round"/>
                        <circle cx="188" cy="18" r="10" fill="none" stroke="#9c8340" strokeWidth="2"/>
                        <circle cx="188" cy="18" r="4"  fill="#c4a878"/>
                        <path d="M112 91 L107 97 L115 100 L118 93 Z" fill="#9c8340" stroke="#6b4010" strokeWidth="1"/>
                        <line x1="111" y1="95" x2="108" y2="102" stroke="#5c4228" strokeWidth="2"/>
          </>
        );
      case 5: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 75 L0 75 Z" fill="#e8dfc8" fillOpacity="0.28"/>
                        <circle cx="158" cy="36" r="20" fill="#e8a830" fillOpacity="0.28"/>
                        <circle cx="158" cy="36" r="13" fill="#e8a830" fillOpacity="0.22"/>
                        <path d="M143 72 Q 158 66, 173 72" stroke="#e8a830" strokeWidth="4" fill="none" opacity="0.38" strokeLinecap="round"/>
                        <path d="M147 80 Q 158 75, 169 80" stroke="#e8a830" strokeWidth="2.5" fill="none" opacity="0.28" strokeLinecap="round"/>
                        <path d="M0 75 Q 50 66, 100 73 T 200 70 L200 120 L0 120 Z" fill="#7aafcc" fillOpacity="0.28"/>
                        <path d="M0 70 Q 30 63, 60 70 T 120 68 T 200 70" stroke="#7aafcc" strokeWidth="1.8" fill="none"/>
                        <path d="M0 80 Q 28 74, 56 80 T 112 78 T 175 80 T 200 78" stroke="#7aafcc" strokeWidth="2.2" fill="none"/>
                        <path d="M8 78 Q 20 73, 32 78" stroke="white" strokeWidth="2.2" fill="none" strokeLinecap="round"/>
                        <path d="M82 76 Q 96 71, 110 76" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"/>
                        <path d="M148 78 Q 162 73, 176 78" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
                        <path d="M0 100 L10 84 L22 92 L38 76 L54 88 L72 78 L88 90 L108 80 L200 82 L200 120 L0 120 Z" fill="#8c7050" fillOpacity="0.42" stroke="#9c8340" strokeWidth="1.2"/>
                        <path d="M0 80 L20 62 L40 72 L62 56 L84 66" stroke="#7a9e70" strokeWidth="1.8" fill="none" opacity="0.48"/>
                        <path className="float-item" d="M98 26 Q 107 20, 116 26 Q 107 31, 98 26 Z" fill="#5c4228" opacity="0.5"/>
                        <path className="float-item" style={{animationDelay: '1.2s'}} d="M124 18 Q 131 13, 138 18 Q 131 23, 124 18 Z" fill="#5c4228" opacity="0.4"/>
                        <path d="M58 70 L63 55 L68 70 Z" fill="#3a5c32" opacity="0.65"/>
                        <path d="M61 64 L66 52 L71 64 Z" fill="#3a5c32" opacity="0.5"/>
          </>
        );
      case 6: // 0 0 130 220
        return (
          <>
<path d="M0 185 Q 65 172, 130 185 L130 220 L0 220 Z" fill="#e8e0d0" fillOpacity="0.55"/>
                        <path d="M0 195 Q 65 182, 130 195" stroke="#c4a878" strokeWidth="1.2" fill="none"/>
                        <line x1="20" y1="0" x2="20" y2="220" stroke="#a8bfaa" strokeWidth="7" opacity="0.28"/>
                        <line x1="108" y1="0" x2="108" y2="220" stroke="#a8bfaa" strokeWidth="6" opacity="0.24"/>
                        <line x1="52" y1="0" x2="52" y2="220" stroke="#7a9e70" strokeWidth="10" opacity="0.58"/>
                        <line x1="88" y1="0" x2="88" y2="220" stroke="#5c8050" strokeWidth="8" opacity="0.52"/>
                        <line x1="14" y1="0" x2="14" y2="220" stroke="#3a5c32" strokeWidth="9"/>
                        <line x1="72" y1="0" x2="72" y2="220" stroke="#4a7040" strokeWidth="12"/>
                        <line x1="116" y1="0" x2="116" y2="220" stroke="#3a5c32" strokeWidth="8"/>
                        <line x1="6"  y1="32"  x2="22" y2="32"  stroke="#c4a878" strokeWidth="3"/>
                        <line x1="6"  y1="80"  x2="22" y2="80"  stroke="#c4a878" strokeWidth="3"/>
                        <line x1="6"  y1="128" x2="22" y2="128" stroke="#c4a878" strokeWidth="3"/>
                        <line x1="6"  y1="175" x2="22" y2="175" stroke="#c4a878" strokeWidth="3"/>
                        <line x1="44" y1="48"  x2="60" y2="48"  stroke="#c4a878" strokeWidth="3.5"/>
                        <line x1="44" y1="100" x2="60" y2="100" stroke="#c4a878" strokeWidth="3.5"/>
                        <line x1="44" y1="152" x2="60" y2="152" stroke="#c4a878" strokeWidth="3.5"/>
                        <line x1="64" y1="28"  x2="80" y2="28"  stroke="#9c8340" strokeWidth="4"/>
                        <line x1="64" y1="72"  x2="80" y2="72"  stroke="#9c8340" strokeWidth="4"/>
                        <line x1="64" y1="116" x2="80" y2="116" stroke="#9c8340" strokeWidth="4"/>
                        <line x1="64" y1="162" x2="80" y2="162" stroke="#9c8340" strokeWidth="4"/>
                        <line x1="80" y1="38"  x2="96" y2="38"  stroke="#c4a878" strokeWidth="3"/>
                        <line x1="80" y1="88"  x2="96" y2="88"  stroke="#c4a878" strokeWidth="3"/>
                        <line x1="80" y1="138" x2="96" y2="138" stroke="#c4a878" strokeWidth="3"/>
                        <path d="M72 62 Q 95 50, 115 56 T 130 48" stroke="#5c8050" strokeWidth="2" fill="none" className="float-item"/>
                        <path d="M72 110 Q 50 98, 33 104 T 5 95"  stroke="#7a9e70" strokeWidth="1.8" fill="none" className="float-item" style={{animationDelay: '1.3s'}}/>
                        <path d="M52 158 Q 72 146, 90 152 T 118 142" stroke="#5c8050" strokeWidth="1.8" fill="none" className="float-item" style={{animationDelay: '2.2s'}}/>
                        <path d="M38 0 L52 90"  stroke="#e8a830" strokeWidth="10" fill="none" opacity="0.055"/>
                        <path d="M78 0 L64 90"  stroke="#e8a830" strokeWidth="7"  fill="none" opacity="0.045"/>
                        <path d="M105 0 L95 90" stroke="#e8a830" strokeWidth="6"  fill="none" opacity="0.04"/>
          </>
        );
      case 7: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 82 L0 82 Z" fill="#e8dfc8" fillOpacity="0.32"/>
                        <circle cx="162" cy="28" r="18" fill="#e8a830" fillOpacity="0.24"/>
                        <circle cx="162" cy="28" r="11" fill="#e8a830" fillOpacity="0.2"/>
                        <path d="M0 82 L28 48 L52 76 L88 32 L128 72 L158 42 L200 68 L200 92 L0 92 Z" fill="#c8bfa0" fillOpacity="0.32"/>
                        <path d="M5 108 L100 14 L195 108 Z" fill="#e8dfc8" fillOpacity="0.72" stroke="#9c8340" strokeWidth="2"/>
                        <path d="M80 36 L100 14 L120 36 Q 110 44, 100 42 T 80 36 Z" fill="white" fillOpacity="0.9"/>
                        <path d="M0 65 Q 40 56, 80 65 T 160 62 T 200 65" stroke="#e8e0d0" strokeWidth="9" fill="none" opacity="0.48"/>
                        <path d="M0 70 Q 40 61, 80 70 T 160 67 T 200 70" stroke="#e8e0d0" strokeWidth="5" fill="none" opacity="0.38"/>
                        <path d="M14 102 L19 86 L24 102 Z" fill="#3a5c32" opacity="0.72"/>
                        <path d="M19 102 L25 84 L31 102 Z" fill="#3a5c32" opacity="0.62"/>
                        <path d="M164 102 L169 85 L174 102 Z" fill="#3a5c32" opacity="0.72"/>
                        <path d="M169 102 L175 83 L181 102 Z" fill="#3a5c32" opacity="0.62"/>
                        <rect x="45" y="87" width="26" height="9" rx="2.5" fill="#b83020" fillOpacity="0.72"/>
                        <rect x="47" y="83" width="20" height="6" rx="1.5" fill="#b83020" fillOpacity="0.62"/>
                        <rect x="50" y="84" width="6" height="4" rx="0.8" fill="#7aafcc" fillOpacity="0.65"/>
                        <rect x="58" y="84" width="6" height="4" rx="0.8" fill="#7aafcc" fillOpacity="0.65"/>
                        <path className="steam-line" d="M48 82 Q 44 75, 48 68" stroke="#e8e0d0" strokeWidth="2" fill="none"/>
                        <path d="M128 97 L132 88 L136 97" stroke="#5c4228" strokeWidth="1.5" fill="none" opacity="0.55"/>
          </>
        );
      case 8: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 50 L0 50 Z" fill="#e8dfc8" fillOpacity="0.28"/>
                        <path d="M0 90 L22 70 L42 82 L68 58 L92 76 L122 52 L152 74 L178 56 L200 70 L200 120 L0 120 Z" fill="#8c7050" fillOpacity="0.48" stroke="#9c8340" strokeWidth="1.2"/>
                        <path className="steam-line"                       d="M58 72 Q 52 56, 58 42" stroke="#e8e0d0" strokeWidth="6" fill="none" opacity="0.65"/>
                        <path className="steam-line steam-2"               d="M78 64 Q 72 48, 78 34" stroke="#e8e0d0" strokeWidth="7" fill="none" opacity="0.58"/>
                        <path className="steam-line steam-3"               d="M100 68 Q 94 52, 100 38" stroke="#e8e0d0" strokeWidth="4.5" fill="none" opacity="0.5"/>
                        <path className="steam-line" style={{animationDelay: '.5s'}} d="M66 70 Q 60 54, 66 40" stroke="#e8e0d0" strokeWidth="4" fill="none" opacity="0.5"/>
                        <line x1="0" y1="30" x2="200" y2="44" stroke="#5c4228" strokeWidth="1.8"/>
                        <line x1="0" y1="33" x2="200" y2="47" stroke="#5c4228" strokeWidth="1.8"/>
                        <rect className="float-item" x="108" y="26" width="32" height="20" rx="5" fill="#c87e18" fillOpacity="0.85" stroke="#9c8340" strokeWidth="1.8"/>
                        <line x1="124" y1="26" x2="124" y2="20" stroke="#5c4228" strokeWidth="2"/>
                        <rect x="112" y="30" width="10" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.62"/>
                        <rect x="125" y="30" width="10" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.62"/>
                        <path d="M143 48 L165 22 L187 48" fill="#e8dfc8" fillOpacity="0.48" stroke="#c8bfa0" strokeWidth="1.2"/>
                        <path d="M156 37 L165 22 L174 37" fill="white" fillOpacity="0.72"/>
                        <path d="M52 84 Q 66 79, 80 83" stroke="#e8a830" strokeWidth="2.8" fill="none" opacity="0.48"/>
                        <path d="M55 90 Q 66 86, 78 90" stroke="#e8a830" strokeWidth="2" fill="none" opacity="0.35"/>
          </>
        );
      case 9: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 58 L0 58 Z" fill="#7aafcc" fillOpacity="0.14"/>
                        <path d="M0 58 L28 38 L52 50 L78 32 L105 46 L138 30 L165 44 L200 35 L200 58 Z" fill="#a8bcaa" fillOpacity="0.42" stroke="#9c8340" strokeWidth="0.8"/>
                        <path d="M0 65 Q 15 68, 30 65 Q 42 70, 55 65 Q 68 68, 80 64 Q 95 70, 110 65 Q 128 68, 140 63 Q 158 70, 168 65 Q 180 68, 200 65" stroke="#a8bcaa" strokeWidth="5" fill="none" opacity="0.32"/>
                        <path d="M0 62 Q 100 56, 200 62 L200 120 L0 120 Z" fill="#7aafcc" fillOpacity="0.22"/>
                        <path d="M0 70 Q 50 65, 100 70 T 200 68" stroke="#7aafcc" strokeWidth="1.2" fill="none"/>
                        <path d="M0 78 Q 50 73, 100 78 T 200 76" stroke="#7aafcc" strokeWidth="0.9" fill="none"/>
                        <path d="M0 88 Q 50 83, 100 88 T 200 86" stroke="#7aafcc" strokeWidth="0.7" fill="none"/>
                        <path d="M38 74 Q 58 69, 78 74" stroke="white" strokeWidth="2.2" fill="none" opacity="0.5" strokeLinecap="round"/>
                        <path d="M118 78 Q 136 73, 152 78" stroke="white" strokeWidth="1.8" fill="none" opacity="0.42" strokeLinecap="round"/>
                        <line x1="17" y1="96" x2="17" y2="60" stroke="#5c8050" strokeWidth="3"/>
                        <line x1="22" y1="93" x2="22" y2="57" stroke="#3a5c32" strokeWidth="2.5"/>
                        <line x1="27" y1="97" x2="27" y2="62" stroke="#5c8050" strokeWidth="2.2"/>
                        <ellipse cx="17" cy="58" rx="4" ry="10" fill="#8c6c30" opacity="0.68"/>
                        <ellipse cx="22" cy="55" rx="3.5" ry="9" fill="#8c6c30" opacity="0.6"/>
                        <ellipse cx="27" cy="60" rx="3" ry="9" fill="#8c6c30" opacity="0.58"/>
                        <line x1="173" y1="96" x2="173" y2="62" stroke="#5c8050" strokeWidth="2.5"/>
                        <line x1="179" y1="91" x2="179" y2="57" stroke="#3a5c32" strokeWidth="3"/>
                        <ellipse cx="173" cy="60" rx="3" ry="9"  fill="#8c6c30" opacity="0.6"/>
                        <ellipse cx="179" cy="55" rx="3.5" ry="10" fill="#8c6c30" opacity="0.68"/>
                        <path d="M92 84 Q 108 82, 124 84 Q 118 91, 98 91 Z" fill="#9c6c30" fillOpacity="0.68" stroke="#6b4010" strokeWidth="1.4"/>
                        <line x1="110" y1="82" x2="110" y2="70" stroke="#6b4010" strokeWidth="1.8"/>
                        <path d="M110 70 L120 74 L110 78 L100 74 Z" fill="#e8a830" fillOpacity="0.58"/>
          </>
        );
      case 10: // 0 0 200 160
        return (
          <>
<rect x="0" y="0" width="200" height="160" fill="#c87e18" fillOpacity="0.04"/>
                        <ellipse cx="158" cy="120" rx="30" ry="20" fill="#8c6c30" fillOpacity="0.48" stroke="#6b4010" strokeWidth="1.8"/>
                        <line x1="128" y1="120" x2="188" y2="120" stroke="#6b4010" strokeWidth="1.8"/>
                        <line x1="130" y1="112" x2="186" y2="112" stroke="#6b4010" strokeWidth="1.2"/>
                        <line x1="130" y1="128" x2="186" y2="128" stroke="#6b4010" strokeWidth="1.2"/>
                        <ellipse cx="188" cy="120" rx="5" ry="20" fill="#9c7038" fillOpacity="0.48"/>
                        <ellipse cx="152" cy="92"  rx="24" ry="16" fill="#9c7038" fillOpacity="0.42" stroke="#6b4010" strokeWidth="1.8"/>
                        <line x1="128" y1="92"  x2="176" y2="92"  stroke="#6b4010" strokeWidth="1.8"/>
                        <line x1="130" y1="85"  x2="174" y2="85"  stroke="#6b4010" strokeWidth="1.2"/>
                        <line x1="130" y1="99"  x2="174" y2="99"  stroke="#6b4010" strokeWidth="1.2"/>
                        <path d="M52 140 L52 88 Q 52 68, 74 62 L86 58 Q 102 52, 102 70 L102 85 Q 102 100, 84 106 L74 110 L74 140 Z" fill="#c87e18" fillOpacity="0.58" stroke="#9c8340" strokeWidth="2.2"/>
                        <path d="M84 58 Q 102 48, 114 38 L126 30" stroke="#c87e18" strokeWidth="6" fill="none" strokeLinecap="round"/>
                        <path d="M126 30 Q 144 26, 148 40 Q 152 54, 134 58 Q 116 62, 118 78 Q 120 92, 136 94" stroke="#c4a878" strokeWidth="3" fill="none"/>
                        <path d="M24 140 L20 96 L46 96 L42 140 Z" fill="#e8a830" fillOpacity="0.38" stroke="#9c8340" strokeWidth="1.8"/>
                        <ellipse cx="33" cy="96" rx="13" ry="3.5" fill="#c87e18" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1.2"/>
                        <rect x="24" y="110" width="18" height="14" rx="2.5" fill="white" fillOpacity="0.45" stroke="#c4a878" strokeWidth="0.8" transform="rotate(-8 33 117)"/>
                        <path className="steam-line"        d="M70 58 Q 65 44, 70 32" stroke="#e8e0d0" strokeWidth="2.5" fill="none"/>
                        <path className="steam-line steam-2" d="M80 56 Q 75 42, 80 28" stroke="#e8e0d0" strokeWidth="2.2" fill="none"/>
          </>
        );
      case 11: // 0 0 200 140
        return (
          <>
<rect x="0" y="0" width="200" height="82" fill="#1e1208" fillOpacity="0.14"/>
                        <rect x="0"   y="18" width="32"  height="90" fill="#2e1f0f" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1"/>
                        <rect x="32"  y="34" width="26"  height="74" fill="#1e1208" fillOpacity="0.4" stroke="#9c8340" strokeWidth="1"/>
                        <rect x="142" y="22" width="30"  height="86" fill="#2e1f0f" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1"/>
                        <rect x="172" y="38" width="28"  height="70" fill="#1e1208" fillOpacity="0.4" stroke="#9c8340" strokeWidth="1"/>
                        <path d="M68 26 L86 20 L108 24 L128 19 L140 26 Q 134 38, 122 44 L100 50 L78 44 Q 68 38, 68 26 Z" fill="#b83020" fillOpacity="0.68" stroke="#b83020" strokeWidth="1.5"/>
                        <path d="M68 32 Q 52 24, 50 17 Q 58 21, 66 28 Z" fill="#b83020" fillOpacity="0.58"/>
                        <path d="M140 32 Q 156 24, 158 17 Q 150 21, 142 28 Z" fill="#b83020" fillOpacity="0.58"/>
                        <text x="104" y="38" textAnchor="middle" fontSize="9" fill="#f5edd8" font-family="serif" opacity="0.8">かに道楽</text>
                        <ellipse cx="50"  cy="62" rx="9"  ry="14" fill="#c87e18" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.2"/>
                        <line x1="50"  y1="48" x2="50"  y2="42" stroke="#9c8340" strokeWidth="1.8"/>
                        <line x1="50"  y1="76" x2="50"  y2="82" stroke="#9c8340" strokeWidth="1.8"/>
                        <ellipse cx="156" cy="56" rx="8"  ry="12" fill="#c87e18" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.2"/>
                        <line x1="156" y1="44" x2="156" y2="38" stroke="#9c8340" strokeWidth="1.8"/>
                        <path d="M0 105 Q 50 98, 100 102 T 200 105 L200 140 L0 140 Z" fill="#7aafcc" fillOpacity="0.24"/>
                        <path d="M72 108 Q 92 103, 112 108" stroke="#b83020" strokeWidth="3" fill="none" opacity="0.42"/>
                        <path d="M40 112 Q 50 108, 60 112" stroke="#c87e18" strokeWidth="2.5" fill="none" opacity="0.38"/>
                        <path d="M146 110 Q 156 106, 166 110" stroke="#c87e18" strokeWidth="2.5" fill="none" opacity="0.35"/>
                        <path d="M15 105 Q 55 84, 100 105 Q 145 84, 185 105" stroke="#5c4228" strokeWidth="3" fill="none"/>
          </>
        );
      case 12: // 0 0 200 160
        return (
          <>
<rect x="0"   y="0" width="88"  height="160" fill="#5c4228" fillOpacity="0.22"/>
                        <rect x="112" y="0" width="88"  height="160" fill="#5c4228" fillOpacity="0.22"/>
                        <rect x="0"   y="0" width="200" height="68"  fill="#5c4228" fillOpacity="0.18"/>
                        <rect x="88"  y="6" width="24"  height="154" fill="#e8a830" fillOpacity="0.28"/>
                        <rect x="0"   y="62" width="200" height="24" fill="#e8a830" fillOpacity="0.22"/>
                        <path d="M100 6 L55 160"  stroke="#e8a830" strokeWidth="16" fill="none" opacity="0.1" strokeLinecap="round"/>
                        <path d="M100 6 L145 160" stroke="#e8a830" strokeWidth="16" fill="none" opacity="0.1" strokeLinecap="round"/>
                        <path d="M100 6 L100 160" stroke="#e8a830" strokeWidth="10" fill="none" opacity="0.08"/>
                        <line x1="0"   y1="35" x2="88"  y2="35" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
                        <line x1="112" y1="35" x2="200" y2="35" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
                        <line x1="0"   y1="98" x2="88"  y2="98" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
                        <line x1="112" y1="98" x2="200" y2="98" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
                        <line x1="0"   y1="130" x2="88"  y2="130" stroke="#c8bfa0" strokeWidth="0.5" opacity="0.35"/>
                        <line x1="112" y1="130" x2="200" y2="130" stroke="#c8bfa0" strokeWidth="0.5" opacity="0.35"/>
                        <rect x="12"  y="118" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <rect x="12"  y="133" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <rect x="12"  y="148" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <rect x="124" y="118" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <rect x="124" y="133" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <rect x="124" y="148" width="64" height="10" rx="2" fill="#2e1f0f" fillOpacity="0.5"/>
                        <path d="M88 155 L100 125 L112 155" fill="#e8a830" fillOpacity="0.18"/>
          </>
        );
      case 13: // 0 0 200 120
        return (
          <>
<path d="M0 0 L22 0 L22 75 L0 75 Z" fill="#3a5c32" fillOpacity="0.28"/>
                        <path d="M178 0 L200 0 L200 75 L178 75 Z" fill="#3a5c32" fillOpacity="0.28"/>
                        <rect x="4"   y="0" width="10" height="75" fill="#5c4228" fillOpacity="0.48"/>
                        <path d="M0 42 L9 15 L18 42 Z" fill="#3a5c32" fillOpacity="0.62"/>
                        <path d="M0 58 L9 30 L18 58 Z" fill="#3a5c32" fillOpacity="0.52"/>
                        <rect x="185" y="0" width="10" height="75" fill="#5c4228" fillOpacity="0.48"/>
                        <path d="M182 42 L189 15 L196 42 Z" fill="#3a5c32" fillOpacity="0.62"/>
                        <path d="M182 58 L189 30 L196 58 Z" fill="#3a5c32" fillOpacity="0.52"/>
                        <path d="M60 72 L100 24 L140 72 Z" fill="#c8bfa0" fillOpacity="0.38"/>
                        <path d="M82 50 L100 24 L118 50 Z" fill="white" fillOpacity="0.5"/>
                        <rect x="60" y="42" width="14" height="78" rx="2.5" fill="#b83020" fillOpacity="0.88" stroke="#8c1e10" strokeWidth="1.8"/>
                        <rect x="126" y="42" width="14" height="78" rx="2.5" fill="#b83020" fillOpacity="0.88" stroke="#8c1e10" strokeWidth="1.8"/>
                        <path d="M46 42 Q 100 28, 154 42 L154 54 Q 100 40, 46 54 Z" fill="#b83020" fillOpacity="0.88" stroke="#8c1e10" strokeWidth="1.8"/>
                        <rect x="60" y="62" width="80" height="10" rx="1.5" fill="#b83020" fillOpacity="0.78" stroke="#8c1e10" strokeWidth="1.2"/>
                        <path d="M60 49 Q 100 56, 140 49" stroke="#e8dfc8" strokeWidth="2.5" fill="none" strokeDasharray="4 2"/>
                        <rect x="80" y="108" width="14" height="12" rx="1" fill="#c8bfa0" fillOpacity="0.42"/>
                        <rect x="93" y="110" width="14" height="10" rx="1" fill="#c8bfa0" fillOpacity="0.38"/>
                        <rect x="106" y="108" width="14" height="12" rx="1" fill="#c8bfa0" fillOpacity="0.42"/>
          </>
        );
      case 14: // 0 0 200 120
        return (
          <>
<rect x="0" y="0" width="200" height="120" fill="none" stroke="#c4a878" strokeWidth="2.5"/>
                        <rect x="0" y="0" width="200" height="22" fill="#c8bfa0" fillOpacity="0.38"/>
                        <line x1="0" y1="33" x2="200" y2="33" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="41" x2="200" y2="41" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="49" x2="200" y2="49" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="57" x2="200" y2="57" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="65" x2="200" y2="65" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="73" x2="200" y2="73" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="81" x2="200" y2="81" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="89" x2="200" y2="89" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="97" x2="200" y2="97" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="105" x2="200" y2="105" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <line x1="0" y1="113" x2="200" y2="113" stroke="#c8bfa0" strokeWidth="1.1" opacity="0.68"/>
                        <ellipse cx="52" cy="72" rx="30" ry="11" fill="none" stroke="#9c8340" strokeWidth="1.1" strokeDasharray="5 2.5"/>
                        <ellipse cx="52" cy="72" rx="21" ry="7.5" fill="none" stroke="#9c8340" strokeWidth="1" strokeDasharray="5 2.5"/>
                        <ellipse cx="52" cy="72" rx="12" ry="4.5" fill="none" stroke="#9c8340" strokeWidth="1"/>
                        <ellipse cx="52" cy="70" rx="15" ry="11" fill="#8c7050" stroke="#6b5030" strokeWidth="1.8"/>
                        <ellipse cx="48" cy="66" rx="4.5" ry="3.5" fill="#a88060" fillOpacity="0.5"/>
                        <ellipse cx="140" cy="58" rx="24" ry="9" fill="none" stroke="#9c8340" strokeWidth="1" strokeDasharray="5 2.5"/>
                        <ellipse cx="140" cy="58" rx="15" ry="5.5" fill="none" stroke="#9c8340" strokeWidth="1"/>
                        <ellipse cx="140" cy="57" rx="11" ry="8.5" fill="#8c7050" stroke="#6b5030" strokeWidth="1.8"/>
                        <ellipse cx="168" cy="86" rx="9"  ry="7"   fill="#8c7050" stroke="#6b5030" strokeWidth="1.5"/>
                        <ellipse cx="159" cy="89" rx="6"  ry="4.5" fill="#9c8060" stroke="#6b5030" strokeWidth="1.2"/>
                        <ellipse cx="177" cy="82" rx="4.5" ry="3.5" fill="#8c7050" stroke="#6b5030" strokeWidth="1.2"/>
                        <path d="M158 0 Q 174 16, 186 13 Q 178 22, 168 19 Q 182 30, 193 27" stroke="#3a5c32" strokeWidth="3" fill="none"/>
                        <path d="M174 16 Q 186 10, 196 15" stroke="#3a5c32" strokeWidth="1.8" fill="none"/>
                        <path d="M177 24 Q 190 19, 200 22" stroke="#3a5c32" strokeWidth="1.8" fill="none"/>
          </>
        );
      case 15: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 58 L0 58 Z" fill="#7aafcc" fillOpacity="0.14"/>
                        <path d="M0 58 L20 36 L42 50 L62 28 L82 44 L102 26 L122 42 L145 24 L165 40 L185 26 L200 36 L200 58 Z" fill="#5c8050" fillOpacity="0.38"/>
                        <path d="M0 65 Q 100 58, 200 65 L200 120 L0 120 Z" fill="#7aafcc" fillOpacity="0.22"/>
                        <path d="M66 88 Q 80 85, 96 88 Q 100 90, 106 86 Q 120 88, 126 90 L122 108 L68 108 Z" fill="#c8bfa0" fillOpacity="0.24" stroke="#c4a878" strokeWidth="0.8"/>
                        <rect x="68" y="52" width="64" height="19" rx="1.5" fill="#e8dfc8" fillOpacity="0.88" stroke="#9c8340" strokeWidth="1.8"/>
                        <rect x="63" y="49" width="74" height="6"  rx="1.5" fill="#c4a878" stroke="#9c8340" strokeWidth="1.4"/>
                        <rect x="78" y="35" width="44" height="17" rx="1.5" fill="#e8dfc8" fillOpacity="0.88" stroke="#9c8340" strokeWidth="1.8"/>
                        <rect x="73" y="32" width="54" height="6"  rx="1.5" fill="#c4a878" stroke="#9c8340" strokeWidth="1.4"/>
                        <path d="M52 49 Q 100 38, 148 49 L142 56 Q 100 44, 58 56 Z" fill="#9c8340" fillOpacity="0.75" stroke="#6b5030" strokeWidth="1.8"/>
                        <path d="M62 32 Q 100 20, 138 32 L132 39 Q 100 27, 68 39 Z" fill="#9c8340" fillOpacity="0.8" stroke="#6b5030" strokeWidth="1.8"/>
                        <path d="M94 20 Q 100 12, 106 20 L100 18 Z" fill="#c4a878" stroke="#9c8340" strokeWidth="1.2"/>
                        <line x1="75"  y1="52" x2="75"  y2="71" stroke="#9c8340" strokeWidth="2.2"/>
                        <line x1="90"  y1="52" x2="90"  y2="71" stroke="#9c8340" strokeWidth="2.2"/>
                        <line x1="110" y1="52" x2="110" y2="71" stroke="#9c8340" strokeWidth="2.2"/>
                        <line x1="125" y1="52" x2="125" y2="71" stroke="#9c8340" strokeWidth="2.2"/>
                        <path d="M148 70 L168 42 L188 70 Z" fill="#e8dfc8" fillOpacity="0.8" stroke="#c4a878" strokeWidth="1.8"/>
                        <line x1="148" y1="70" x2="188" y2="70" stroke="#c4a878" strokeWidth="1.2"/>
                        <circle cx="28" cy="20" r="14" fill="#f5edd8" fillOpacity="0.6" stroke="#e8a830" strokeWidth="0.8"/>
                        <path d="M20 80 Q 28 75, 36 80" stroke="#f5edd8" strokeWidth="2.2" fill="none" opacity="0.4"/>
          </>
        );
      case 16: // 0 0 200 160
        return (
          <>
<rect x="0" y="72" width="200" height="88" fill="#c8bfa0" fillOpacity="0.18"/>
                        <line x1="0" y1="72" x2="200" y2="72" stroke="#c4a878" strokeWidth="1.8"/>
                        <line x1="0" y1="90" x2="200" y2="90" stroke="#c4a878" strokeWidth="0.6" opacity="0.38"/>
                        <line x1="0" y1="108" x2="200" y2="108" stroke="#c4a878" strokeWidth="0.6" opacity="0.38"/>
                        <line x1="0" y1="126" x2="200" y2="126" stroke="#c4a878" strokeWidth="0.6" opacity="0.38"/>
                        <line x1="0" y1="144" x2="200" y2="144" stroke="#c4a878" strokeWidth="0.6" opacity="0.38"/>
                        <ellipse cx="100" cy="154" rx="52" ry="7" fill="#c8bfa0" opacity="0.28"/>
                        <path d="M52 110 C48 135 152 135 148 110 L140 88 C120 110 80 110 60 88 Z" fill="#5c4228" fillOpacity="0.82" stroke="#3a2010" strokeWidth="2.5"/>
                        <ellipse cx="100" cy="88" rx="48" ry="14" fill="#6b4c2e" stroke="#3a2010" strokeWidth="2.5"/>
                        <ellipse cx="100" cy="86" rx="42" ry="11" fill="#5c8050" fillOpacity="0.88"/>
                        <path d="M76 83 Q 88 77, 100 83 T 124 80" stroke="#7a9e70" strokeWidth="2"   fill="none"/>
                        <path d="M78 87 Q 90 82, 100 87 T 122 84" stroke="#7a9e70" strokeWidth="1.5" fill="none"/>
                        <line x1="112" y1="48" x2="100" y2="84" stroke="#9c7038" strokeWidth="4" strokeLinecap="round"/>
                        <path d="M92 76 L105 70 L109 78 L104 84" stroke="#c4a878" strokeWidth="2" fill="none"/>
                        <path d="M98 76 Q 108 68, 114 73 Q 107 80, 104 83" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
                        <path d="M105 70 Q 116 64, 122 69 Q 115 76, 111 78" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
                        <path d="M34 65 Q 68 76, 70 86" stroke="#9c7038" strokeWidth="3" strokeLinecap="round" fill="none"/>
                        <path d="M70 86 Q 78 96, 70 99 Q 62 97, 65 87" stroke="#9c7038" strokeWidth="2" fill="#c4a878" fillOpacity="0.4"/>
                        <ellipse cx="164" cy="95"  rx="22" ry="25" fill="#b83020" fillOpacity="0.68" stroke="#8c1e10" strokeWidth="2.5"/>
                        <ellipse cx="164" cy="84"  rx="22" ry="10" fill="#c84838" fillOpacity="0.68" stroke="#8c1e10" strokeWidth="2"/>
                        <path d="M149" x1="88" x2="179" y1="88" stroke="#e8a830" strokeWidth="2" fill="none" opacity="0.72"/>
                        <path d="M150 88 Q 164 84, 178 88" stroke="#e8a830" strokeWidth="2" fill="none" opacity="0.72"/>
                        <path className="steam-line"        d="M88 82 Q 83 70, 88 58" stroke="#a8b8a0" strokeWidth="2" fill="none"/>
                        <path className="steam-line steam-2" d="M110 80 Q 105 68, 110 54" stroke="#a8b8a0" strokeWidth="1.8" fill="none"/>
          </>
        );
      case 17: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 72 L0 72 Z" fill="#e8dfc8" fillOpacity="0.28"/>
                        <path d="M80 72 L122 26 L162 72 L200 72 L200 55 L165 55 L145 26 L120 12 L95 26 L75 55 L40 55 L40 72 Z" fill="#c8bfa0" fillOpacity="0.38"/>
                        <path d="M108 38 L120 12 L132 38 Z" fill="white" fillOpacity="0.52"/>
                        <line x1="0" y1="80" x2="80" y2="80" stroke="#c8bfa0" strokeWidth="1.2" opacity="0.48"/>
                        <line x1="0" y1="84" x2="60" y2="84" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.38"/>
                        <line x1="0" y1="88" x2="70" y2="88" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.38"/>
                        <line x1="0" y1="92" x2="55" y2="92" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.3"/>
                        <line x1="0"   y1="110" x2="200" y2="110" stroke="#9c8340" strokeWidth="2.5"/>
                        <line x1="0"   y1="116" x2="200" y2="116" stroke="#9c8340" strokeWidth="2.5"/>
                        <line x1="18"  y1="108" x2="18"  y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="44"  y1="108" x2="44"  y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="70"  y1="108" x2="70"  y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="96"  y1="108" x2="96"  y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="122" y1="108" x2="122" y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="148" y1="108" x2="148" y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <line x1="174" y1="108" x2="174" y2="118" stroke="#8c6c30" strokeWidth="3.5"/>
                        <path d="M28 76 Q 48 67, 64 67 L196 67 L200 76 L200 108 L28 108 Z" fill="#f2e8d0" fillOpacity="0.92" stroke="#c4a878" strokeWidth="1.8"/>
                        <rect x="28" y="85" width="172" height="6" fill="#7aafcc" fillOpacity="0.68"/>
                        <rect x="66"  y="70" width="20" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
                        <rect x="92"  y="70" width="20" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
                        <rect x="118" y="70" width="20" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
                        <rect x="144" y="70" width="20" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
                        <rect x="170" y="70" width="20" height="12" rx="1.5" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
                        <path d="M28 76 Q 20 82, 16 90 Q 16 100, 26 108" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
                        <line x1="0"   y1="62" x2="200" y2="57" stroke="#9c8340" strokeWidth="1"/>
                        <line x1="42"  y1="67" x2="42"  y2="62" stroke="#9c8340" strokeWidth="1"/>
                        <line x1="102" y1="67" x2="102" y2="59" stroke="#9c8340" strokeWidth="1"/>
                        <line x1="162" y1="67" x2="162" y2="60" stroke="#9c8340" strokeWidth="1"/>
          </>
        );
      case 18: // 0 0 200 120
        return (
          <>
<path d="M0 0 L200 0 L200 82 L0 82 Z" fill="#e8a830" fillOpacity="0.07"/>
                        <path d="M0 75 Q 100 62, 200 75" stroke="#e8a830" strokeWidth="7" fill="none" opacity="0.18"/>
                        <ellipse cx="30"  cy="40" rx="38" ry="17" fill="#e8e0d0" fillOpacity="0.6"/>
                        <ellipse cx="54"  cy="37" rx="26" ry="13" fill="#f0e8d8" fillOpacity="0.52"/>
                        <ellipse cx="12"  cy="43" rx="19" ry="11" fill="#e8e0d0" fillOpacity="0.5"/>
                        <ellipse cx="155" cy="55" rx="32" ry="14" fill="#e8e0d0" fillOpacity="0.55"/>
                        <ellipse cx="178" cy="52" rx="21" ry="11" fill="#f0e8d8" fillOpacity="0.5"/>
                        <path d="M0 96 L10 86 L20 92 L30 80 L42 88 L52 74 L64 84 L75 76 L87 90 L102 82 L200 83 L200 120 L0 120 Z" fill="#c8bfa0" fillOpacity="0.5" stroke="#9c8340" strokeWidth="0.6"/>
                        <path d="M66 82 L70 60 L74 82 Z" fill="#b83020" fillOpacity="0.48"/>
                        <line x1="70" y1="60" x2="70" y2="54" stroke="#b83020" strokeWidth="1.8" opacity="0.5"/>
                        <path d="M14 104 Q 82 18, 198 34" stroke="#c87e18" strokeWidth="1.8" strokeDasharray="7 3.5" fill="none"/>
                        <path d="M153 38 Q 170 30, 182 35 Q 173 44, 153 42 Z" fill="#2e1f0f" fillOpacity="0.72"/>
                        <path d="M157 38 Q 154 28, 162 27 Q 167 33, 164 40 Z" fill="#2e1f0f" fillOpacity="0.62"/>
                        <path d="M157 40 Q 154 51, 162 53 Q 167 47, 164 40 Z" fill="#2e1f0f" fillOpacity="0.52"/>
                        <path d="M153 40 Q 116 50, 72 62" stroke="white" strokeWidth="3" fill="none" opacity="0.48" strokeLinecap="round"/>
                        <path d="M153 40 Q 112 52, 64 66" stroke="white" strokeWidth="1.8" fill="none" opacity="0.3" strokeLinecap="round"/>
                        <circle cx="102" cy="13" r="2"   fill="#c87e18" opacity="0.5"/>
                        <circle cx="130" cy="6"  r="1.5" fill="#c87e18" opacity="0.42"/>
                        <circle cx="158" cy="16" r="2"   fill="#c87e18" opacity="0.45"/>
                        <circle cx="36" cy="95" r="2.2" fill="#c87e18" opacity="0.52"/>
                        <circle cx="56" cy="88" r="1.8" fill="#c87e18" opacity="0.42"/>
                        <circle cx="74" cy="92" r="1.8" fill="#c87e18" opacity="0.42"/>
          </>
        );
      default: return null;
    }
  };
  return (
    <svg
      viewBox={_vbMap[day] ?? "0 0 200 120"}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: 'block', width: '100%', height: '100%',
        maskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 10%, transparent 100%)',
        WebkitMaskImage: 'radial-gradient(ellipse 90% 85% at 50% 50%, black 10%, transparent 100%)',
      }}
    >
      {renderSVGContent()}
    </svg>
  );
};

const ActivityItem: React.FC<{ activity: any; index: number }> = ({ activity, index }) => {
  const { activeDay, editMode, userEdits, updateActivityEdit } = useStore();
  const dayHaikus = haikus[activeDay] || [];
  const savedKey = `${activeDay}_${index}`;
  const editedTitle = userEdits.activities[savedKey]?.title;
  const editedDesc = userEdits.activities[savedKey]?.description;
  const displayTitle = editedTitle !== undefined ? editedTitle : activity.title;
  const displayHaiku = editedDesc !== undefined ? editedDesc : (dayHaikus[index] || "");

  return (
    <div className="timeline-item">
      <span className="timeline-bullet">🌿</span>
      <span className="timeline-time">{activity.time}</span>
      <h3 contentEditable={editMode} suppressContentEditableWarning onBlur={(e) => updateActivityEdit(activeDay, index, 'title', e.currentTarget.innerText)} className={`timeline-title focus:outline-none ${editMode ? 'border-b border-dashed border-[#c87e18] bg-white bg-opacity-40 px-1' : ''}`}>{displayTitle}</h3>
      <p contentEditable={editMode} suppressContentEditableWarning onBlur={(e) => updateActivityEdit(activeDay, index, 'description', e.currentTarget.innerText)} className={`timeline-desc focus:outline-none ${editMode ? 'border-b border-dashed border-[#c87e18] bg-white bg-opacity-40 px-1 mt-2' : ''}`}>{displayHaiku}</p>
    </div>
  );
};

const MealsSection: React.FC = () => {
  const { activeDay, editMode, userEdits, updateMealEdit } = useStore();
  const dayMeals = meals[activeDay];
  const mealTypes: Array<{ key: 'breakfast' | 'lunch' | 'dinner'; label: string; icon: string }> = [
    { key: 'breakfast', label: 'Breakfast', icon: '☀' }, { key: 'lunch', label: 'Lunch', icon: '◑' }, { key: 'dinner', label: 'Dinner', icon: '☽' }
  ];
  return (
    <div className="meals-container">
      <h4 className="meals-header">Today's Table</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {mealTypes.map(({ key, label, icon }) => {
          const defaultMeal = dayMeals?.[key];
          const editedText = userEdits.meals[activeDay]?.[key];
          const displayText = editedText !== undefined ? editedText : (defaultMeal?.text || "");
          return (
            <div key={key} className={`meal-row ${defaultMeal?.booked ? 'booked' : ''}`}>
              <div className="meal-label-col">
                <span className="text-base">{icon}</span>
                <span className="meal-type">{label}</span>
              </div>
              <p contentEditable={editMode} suppressContentEditableWarning onBlur={(e) => updateMealEdit(activeDay, key, e.currentTarget.innerText)} className={`meal-text focus:outline-none ${editMode ? 'border-b border-dashed border-[#c87e18] bg-white bg-opacity-40 px-1' : ''}`}>{displayText}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ReservationsPanel: React.FC = () => {
  const { activeDay, reservations, updateReservation } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const res: Reservation = reservations[activeDay] || {};

  const handleInputChange = (field: keyof Reservation, value: string) => {
    updateReservation(activeDay, { [field]: value });
  };

  const addBooking = () => {
    const list = res.restaurantBookings || [];
    updateReservation(activeDay, { restaurantBookings: [...list, { name: '', time: '', notes: '' }] });
  };

  const updateBooking = (idx: number, key: keyof RestaurantBooking, value: string) => {
    const list = [...(res.restaurantBookings || [])];
    list[idx] = { ...list[idx], [key]: value };
    updateReservation(activeDay, { restaurantBookings: list });
  };

  return (
    <div style={{ marginTop: '32px', border: '1px solid #cdbf9c', borderRadius: '4px', backgroundColor: '#e6d8be', opacity: 0.85 }}>
      <button onClick={() => setIsOpen(!isOpen)} style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'Crimson Text, serif', fontSize: '14px', color: '#1e1208', border: 'none', background: 'transparent', cursor: 'pointer' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen style={{ width: '16px', height: '16px' }} />Offline Booking & Lodging Records</span>
        {isOpen ? <ChevronUp style={{ width: '16px', height: '16px' }} /> : <ChevronDown style={{ width: '16px', height: '16px' }} />}
      </button>
      {isOpen && (
        <div style={{ padding: '16px', borderTop: '1px solid #cdbf9c', display: 'flex', flexDirection: 'column', gap: '24px', fontFamily: 'Crimson Text, serif', fontSize: '14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h5 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>🏨 Hotel / Ryokan Details</h5>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <input type="text" placeholder="Confirmation Code" value={res.hotelConfirmation || ''} onChange={(e) => handleInputChange('hotelConfirmation', e.target.value)} style={{ backgroundColor: '#f2e8d0', border: '1px solid #cdbf9c', padding: '8px', borderRadius: '4px', outline: 'none' }} />
              <input type="text" placeholder="Full Hotel Address" value={res.hotelAddress || ''} onChange={(e) => handleInputChange('hotelAddress', e.target.value)} style={{ backgroundColor: '#f2e8d0', border: '1px solid #cdbf9c', padding: '8px', borderRadius: '4px', outline: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h5 style={{ fontWeight: 'bold', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>🍽 Dining Reservations</h5>
              <button onClick={addBooking} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--rc)' }}><Plus style={{ width: '14px', height: '14px' }} /> Add</button>
            </div>
            {(res.restaurantBookings || []).map((booking, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', backgroundColor: '#f2e8d0', padding: '12px', borderRadius: '4px', border: '1px solid #cdbf9c', alignItems: 'center' }}>
                <input type="text" placeholder="Name" value={booking.name} onChange={(e) => updateBooking(idx, 'name', e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #cdbf9c', padding: '4px', outline: 'none', width: '30%' }} />
                <input type="text" placeholder="Time" value={booking.time} onChange={(e) => updateBooking(idx, 'time', e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #cdbf9c', padding: '4px', outline: 'none', width: '30%' }} />
                <input type="text" placeholder="Notes" value={booking.notes} onChange={(e) => updateBooking(idx, 'notes', e.target.value)} style={{ backgroundColor: 'transparent', border: 'none', borderBottom: '1px solid #cdbf9c', padding: '4px', outline: 'none', width: '30%' }} />
                <button onClick={() => {
                  const list = (res.restaurantBookings || []).filter((_, i) => i !== idx);
                  updateReservation(activeDay, { restaurantBookings: list });
                }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#b83020', padding: '4px' }}>
                  <Trash style={{ width: '16px', height: '16px' }} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const JournalPane: React.FC = () => {
  const { activeDay } = useStore();
  const region = regionMap[activeDay];
  const color = regionColors[region];
  const metadata = dayMeta[activeDay];

  const vignetteIdx = vignettePlacement[activeDay];
  const styleStr = vignetteStyle[activeDay] || "float:right;width:180px;";
  const parsedStyles = Object.fromEntries(
    styleStr.split(';').map(item => {
      const [k, v] = item.split(':');
      if (!k || !v) return [];
      return [k.trim().replace(/-./g, x => x[1].toUpperCase()), v.trim()];
    }).filter(x => x.length > 0)
  );

  const elements: React.ReactNode[] = [];
  (activities[activeDay] || []).forEach((act, idx) => {
    if (vignetteIdx !== null && idx === vignetteIdx) {
      elements.push(<div key="v" style={parsedStyles} className="hidden sm:block"><ArtVignette day={activeDay} /></div>);
    }
    elements.push(<ActivityItem key={idx} activity={act} index={idx} />);
  });
  if (vignetteIdx === null) {
    elements.push(<div key="v" style={parsedStyles} className="hidden sm:block"><ArtVignette day={activeDay} /></div>);
  }

  return (
    <div className="journal-pane" style={{ '--rc': color } as React.CSSProperties}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '96px' }}>
        <div>
          <span className="region-tag">{region} Region</span>
          <h2 className="day-title"><span style={{ color: color }}>〜</span> {metadata.title}</h2>
          <div className="lodging-badge-row">
            <span className="lodging-badge">LODGING</span>
            <span className="lodging-name">{metadata.lodging}</span>
          </div>
          <div style={{ height: '2px', width: '100%', background: `linear-gradient(to right, ${color}, #cdbf9c, transparent)`, marginTop: '8px' }} />
        </div>
        <div className="timeline-container">{elements}</div>
        <MealsSection />
        <ReservationsPanel />
      </div>
    </div>
  );
};

const getPinIconUrl = (type: string, color: string) => {
  const icons: Record<string, string> = {
    hotel: `<path d="M6 17v-5H4l8-7 8 7h-2v5h-5v-4H9v4H6z" fill="#fff"/>`,
    restaurant: `<path d="M4 11h16v1H4zm3-6h2v5H7zm4 0h2v5h-2zm4 0h2v5h-2z" fill="#fff"/>`,
    museum: `<path d="M4 18h16v1H4zm1-3h2v2H5zm4 0h2v2H9zm4 0h2v2h-2zm4 0h2v2h-2zm-12-6l7-5 7 5z" fill="#fff"/>`,
    shop: `<path d="M17 18H7c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2zM9 5c0-1.66 1.34-3 3-3s3 1.34 3 3H9z" fill="#fff"/>`,
    transit: `<path d="M4 16c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-1h4v1c0 .55.45 1 1 1h2c.55 0 1-.45 1-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v11z" fill="#fff"/>`
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="${color}"/><circle cx="12" cy="9" r="6" fill="#fff" fill-opacity="0.2"/>${icons[type] || icons.transit}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const MapEngine: React.FC<{ activeDay: number }> = ({ activeDay }) => {
  const googleMap = useMap('travel_map');
  const [markers, setMarkers] = useState<any[]>([]);
  const [polyline, setPolyline] = useState<any>(null);

  useEffect(() => {
    if (!googleMap) return;
    const google = (window as any).google;
    if (!google) return;

    markers.forEach(m => m.setMap(null));
    if (polyline) polyline.setMap(null);

    const dayActs = activities[activeDay] || [];
    const hotel = hotelAnchors[activeDay];
    const pathCoordinates: any[] = [];
    const bounds = new google.maps.LatLngBounds();
    const newMarkers: any[] = [];

    if (hotel) {
      const loc = { lat: hotel.lat, lng: hotel.lng };
      bounds.extend(loc);
      pathCoordinates.push(loc);
      const marker = new google.maps.Marker({
        position: loc, map: googleMap, title: hotel.name,
        icon: { url: getPinIconUrl('hotel', '#b83020'), scaledSize: new google.maps.Size(32, 32) }
      });
      newMarkers.push(marker);
    }

    dayActs.forEach((act) => {
      const loc = { lat: act.lat, lng: act.lng };
      bounds.extend(loc);
      pathCoordinates.push(loc);
      const marker = new google.maps.Marker({
        position: loc, map: googleMap, title: act.title,
        icon: { url: getPinIconUrl(act.type, '#c87e18'), scaledSize: new google.maps.Size(32, 32) }
      });
      newMarkers.push(marker);
    });

    if (hotel && hotel.loop) {
      pathCoordinates.push({ lat: hotel.lat, lng: hotel.lng });
    }
    setMarkers(newMarkers);

    if (pathCoordinates.length > 1) {
      const newPolyline = new google.maps.Polyline({
        path: pathCoordinates, strokeOpacity: 0,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#c87e18' }, offset: '0', repeat: '15px' }],
        map: googleMap
      });
      setPolyline(newPolyline);
    }
    if (pathCoordinates.length > 0) {
      googleMap.fitBounds(bounds, 50);
    }
  }, [activeDay, googleMap]);

  return null;
};

const MapPane: React.FC = () => {
  const { activeDay } = useStore();
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map id="travel_map" defaultCenter={{ lat: 35.6762, lng: 139.6503 }} defaultZoom={11} mapTypeId={mapType} disableDefaultUI={true} zoomControl={true} style={{ width: '100%', height: '100%' }}>
        <MapEngine activeDay={activeDay} />
        <MapControl position={ControlPosition.TOP_RIGHT}>
          <div className="map-controls-overlay">
            <button onClick={() => setMapType('roadmap')} className={`map-control-btn ${mapType === 'roadmap' ? 'active' : ''}`}>Sketch Map</button>
            <button onClick={() => setMapType('hybrid')} className={`map-control-btn ${mapType === 'hybrid' ? 'active' : ''}`}>Satellite</button>
          </div>
        </MapControl>
      </Map>
    </div>
  );
};

const EditModeToggle: React.FC = () => {
  const { editMode, toggleEditMode } = useStore();
  return (
    <button onClick={toggleEditMode} className={`fab-btn ${editMode ? 'active' : ''}`}>
      {editMode ? <Check style={{ width: '20px', height: '20px' }} /> : <Edit3 style={{ width: '20px', height: '20px' }} />}
    </button>
  );
};

// --- MAIN RUNNER LAYOUT ---

const App: React.FC = () => {
  const { editMode } = useStore();
  return (
    <APIProvider apiKey="YOUR_NEW_KEY_HERE">
      <div className="app-container">
        <AmbientLayer />
        <Header />
        <DayNav />
        <RegionLegend />
        <main className="main-content">
          <section className="journal-pane-wrapper" style={{ borderRight: '1px solid var(--paper-fold)', boxShadow: editMode ? 'inset 0 0 0 2px var(--amber)' : 'none' }}>
            <JournalPane />
          </section>
          <section className="map-pane-wrapper">
            <MapPane />
          </section>
        </main>
        <EditModeToggle />
      </div>
    </APIProvider>
  );
};

export default App;
