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
  1: { breakfast: { text: "In transit — long-haul flight, arrive Narita past noon", booked: false }, lunch: { text: "Narita Airport ramen hall · a grounding bowl of shoyu or tonkotsu, the first Japanese mouthful", booked: false }, dinner: { text: "Ginza Happo · raw oysters on ice and snow crab legs, first maritime meal of the journey", booked: true } },
  2: { breakfast: { text: "Kimuraya Honten Ginza · Japan's oldest bakery (est. 1869), fresh anpan straight from the oven on Chuo-dori", booked: false }, lunch: { text: "Maisen Tonkatsu Aoyama · legendary crispy pork cutlet set in a converted Meiji-era public bathhouse", booked: false }, dinner: { text: "Sushi Yoshitake or Ginza Sushi Iwa · intimate omakase nigiri at the counter, seasonal selections", booked: false } },
  3: { breakfast: { text: "Shiseido Parlour Ginza · seventh-floor café above the historic cosmetics flagship, eggs and coffee over the rooftops", booked: false }, lunch: { text: "Sometaro Asakusa · monjayaki griddle cakes and cold Sapporo in the old shitamachi quarter", booked: false }, dinner: { text: "Otafuku Asakusa (est. 1945) · oden simmered in clear dashi, a beloved winter ritual in the old neighbourhood", booked: false } },
  4: { breakfast: { text: "Shinjuku Isetan B2 food hall · melon pan and seasonal fruit from Japan's most celebrated basement market", booked: false }, lunch: { text: "Fuunji Shinjuku · thick wavy tsukemen with a richly complex dipping broth, a Shinjuku cult institution", booked: false }, dinner: { text: "Omoide Yokocho · binchotan yakitori in the smoky lantern-lit alley, cold draft beer, Shinjuku night", booked: true } },
  5: { breakfast: { text: "Standing soba at Iwa near Shinbashi · a quick pre-shinkansen bowl of cold seiro soba, classic Tokyo fuel", booked: false }, lunch: { text: "Ekiben on the Shinkansen · wappa meshi bento box, cold green tea, watching the coast dissolve into green hills", booked: false }, dinner: { text: "Asaba Ryokan kaiseki · mountain vegetables, clear dashi, perfect local sake — first night deep in the Izu forest", booked: false } },
  6: { breakfast: { text: "Morning walk to Shuzenji town · fresh warabi mochi and matcha at Toko-an sweet shop by the ancient spring", booked: false }, lunch: { text: "Shuzenji Agetofu · freshly deep-fried local tofu near the bamboo shrine, cold matcha alongside", booked: false }, dinner: { text: "Asaba multi-course kaiseki · sixteen lacquered courses, the floating Noh stage lit against the still water", booked: true } },
  7: { breakfast: { text: "Oraga Soba Shuzenji · handmade buckwheat noodles at a riverside local, a final taste of Izu before the mountain transit", booked: false }, lunch: { text: "Yuba tofu café in Hakone · silken tofu skin drawn fresh from soy milk, ponzu, mountain quietude", booked: false }, dinner: { text: "Gyoza Center Hakone Yumoto · no-frills gyoza and ramen beloved by the mountain-town locals, comfort after the switchback climb", booked: false } },
  8: { breakfast: { text: "Amazake Chaya (甘酒茶屋) · a tea house in continuous operation since 1618 on the old Tokaido road, sweet fermented amazake and grilled mochi", booked: false }, lunch: { text: "Owakudani kuro-tamago · sulfur-blackened eggs boiled in volcanic spring water, eaten hot on the ridge", booked: false }, dinner: { text: "Kasho Gyoshin near Hakone · local kaiseki dinner away from the hotel, mountain forage and delicate plating", booked: false } },
  9: { breakfast: { text: "Bakery & Table Hakone Yumoto · lakeside morning toast and coffee at the wooden terrace before the long westward transit", booked: false }, lunch: { text: "En route stop · Omi beef yakiniku at a Shiga roadside restaurant — the prefecture's quietly famous hidden gem", booked: false }, dinner: { text: "Shatei Hamasho Otsu · freshwater eel (unagi) and funa-zushi (fermented crucian carp) at a local lakeside restaurant, Shiga's most ancient flavour", booked: false } },
  10: { breakfast: { text: "Otsu morning market · freshly caught lake fish, pickled vegetables, and miso from the waterside market stalls", booked: false }, lunch: { text: "Near Yamazaki Distillery · whisky-paired small plates and Kyoto vegetable dishes at a riverside restaurant", booked: false }, dinner: { text: "Endo Sushi near Osaka Fish Market · the legendary market sushi counter open since the wholesale market days, fish so fresh it needs nothing", booked: false } },
  11: { breakfast: { text: "Ichiwa mochi-ya · grilled mochi with sweet red bean paste at a shop that has stood near Imamiya Shrine since the year 1000", booked: false }, lunch: { text: "Mizuno Okonomiyaki · Dotonbori's 1945 original, mountain-yam batter griddled tableside to a golden crust", booked: false }, dinner: { text: "Daruma Kushikatsu · the original 1929 panko-skewer counter — crispy, golden, strict no-double-dipping rule enforced", booked: true } },
  12: { breakfast: { text: "Café Absinthe Nakazakicho · creative all-day brunch in Osaka's most charming vintage neighbourhood, vintage tiles and morning coffee", booked: false }, lunch: { text: "Tsuruhashi yakiniku · tabletop wagyu and kimchi in Osaka's Korean quarter, the oldest and most fragrant covered market", booked: false }, dinner: { text: "Namba takoyaki crawl · five different stands along the Golden Street, comparing batter, char, and bonito flake technique", booked: false } },
  13: { breakfast: { text: "Chibo Namba · one final Osaka okonomiyaki before the train north — the city's unofficial farewell dish, griddle-crisped at the table", booked: false }, lunch: { text: "Nishiki Market, Kyoto · Kyoto's ancient kitchen — tamagoyaki skewers, fresh tsukemono, tofu, warm soy milk from the stalls", booked: false }, dinner: { text: "Kikunoi Roan · the warm branch of 3-Michelin-star Kikunoi, Kyoto kaiseki in the stone-lantern-lined Maruyama hills", booked: false } },
  14: { breakfast: { text: "Inoda Coffee Honten · the Kyoto kissaten institution since 1940, European-style breakfast in a beloved old shophouse near Sanjo", booked: false }, lunch: { text: "Shoraian Yudofu near Kinkaku-ji · silken tofu simmered slowly in spring-clear dashi in an old garden setting", booked: false }, dinner: { text: "Kichisen Kyoto · Japan's most revered kaiseki table — tea-ceremony cuisine at its very peak, book months ahead", booked: false } },
  15: { breakfast: { text: "Sarasa Nishijin · morning coffee and toast in a converted 1920s public bathhouse, azulejo-tiled walls and slow light", booked: false }, lunch: { text: "Canal-side café on the Philosopher's Path · tofu dengaku and cold barley tea, a wooden bench above the stone waterway", booked: false }, dinner: { text: "Hyotei Kyoto · one of the oldest kaiseki restaurants in the world, serving the morning tea-ceremony meal since the 1600s", booked: false } },
  16: { breakfast: { text: "Café Bibliotic Hello! · morning pour-over in a converted Kyoto machiya townhouse, textured plaster walls and quiet shelves", booked: false }, lunch: { text: "Takagamine Tea House Estate · wagashi sweets and whisked matcha, deep tatami silence in the northern hills", booked: true }, dinner: { text: "ROKU KYOTO Clay-Pot Crab Rice · sweet snow crab steamed over heirloom rice, intimate donabe at the foothills", booked: true } },
  17: { breakfast: { text: "Tousuiro near Kyoto Station · a tofu kaiseki morning set — silken, clear-dashi richness, the definitive final Kyoto meal", booked: false }, lunch: { text: "Tokyo Station Ramen Street · eight premier ramen shops beneath the historic brick vault, choose your broth", booked: false }, dinner: { text: "Sushi Kanesaka Ginza · an elegant omakase counter a short walk from the station, a refined return to the capital", booked: false } },
  18: { breakfast: { text: "Le Bretagne Yurakucho · Breton buckwheat galettes and café crème across from Hibiya Park, a beloved Tokyo morning institution since 1994", booked: false }, lunch: { text: "Marunouchi sushi · a final counter omakase — close the loop on the journey in the shadow of the old brick station", booked: false }, dinner: { text: "Haneda international lounge · a quiet pre-flight meal before the long arc home", booked: false } }
};

const dayMeta: Record<number, { title: string; lodging: string }> = {
  1: { title: "Day 1: Arrival into Neon Mist", lodging: "Hyatt Centric Ginza" },
  2: { title: "Day 2: Secret Gardens & Mechanical Masters", lodging: "Hyatt Centric Ginza" },
  3: { title: "Day 3: Shokunin Crafts & Sumida Reflections", lodging: "Hyatt Centric Ginza" },
  4: { title: "Day 4: Mid-Century Vinyl & Izakaya Alleyways", lodging: "Hyatt Centric Ginza" },
  5: { title: "Day 5: Coastal Pathways into the Izu Peninsula", lodging: "Asaba Ryokan" },
  6: { title: "Day 6: Deep Bamboo Groves & Floating Noh Stages", lodging: "Asaba Ryokan" },
  7: { title: "Day 7: Through Cloud Passes to Hakone Caldera", lodging: "Gora Kadan" },
  8: { title: "Day 8: Open-Air Sculpture & Volcanic Vents", lodging: "Gora Kadan" },
  9: { title: "Day 9: Lake Biwa Rail Cruising", lodging: "Biwako Ryokisui" },
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
  1: "float:right;width:192px;height:118px;margin:4px 0 8px 12px;transform:rotate(2deg)",
  2: "float:right;width:165px;height:165px;margin:4px 0 8px 12px;transform:rotate(-2.5deg)",
  3: "float:right;width:210px;height:95px;margin:4px 0 8px 12px;transform:rotate(1.5deg)",
  4: "float:right;width:168px;height:168px;margin:4px 0 8px 12px;transform:rotate(4deg)",
  5: "float:right;width:200px;height:118px;margin:4px 0 8px 12px;transform:rotate(-1deg)",
  6: "float:right;width:108px;height:195px;margin:4px 0 8px 12px;transform:rotate(-2deg)",
  7: "float:right;width:198px;height:112px;margin:4px 0 8px 12px;transform:rotate(1deg)",
  8: "float:right;width:188px;height:112px;margin:4px 0 8px 12px;transform:rotate(-3deg)",
  9: "float:right;width:196px;height:118px;margin:4px 0 8px 12px;transform:rotate(1.5deg)",
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

// --- HIGH FIDELITY ANTIQUE WATERCOLOR GOOGLE MAP SKIN ---
const RETRO_MAP_STYLE = [
  { "elementType": "geometry", "stylers": [{ "color": "#ebe3cd" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#523735" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "administrative", "elementType": "geometry.stroke", "stylers": [{ "color": "#c9b2a6" }] },
  { "featureType": "landscape.natural", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi", "elementType": "geometry", "stylers": [{ "color": "#dfd2ae" }] },
  { "featureType": "poi.park", "elementType": "geometry.fill", "stylers": [{ "color": "#a5b076" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#447530" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#f5f1e6" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#f8c967" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#e9bc62" }] },
  { "featureType": "water", "elementType": "geometry.fill", "stylers": [{ "color": "#aac2c7" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#607478" }] }
];

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

const ArtVignette: React.FC<{ day: number }> = ({ day }) => {
  const renderSVGContent = () => {
    switch (day) {
      case 1:
        return (
          <g stroke="#1e1208" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 20 50 Q 20 90 60 90 Q 100 90 100 50 Z" fill="#f2e8d0" />
            <path d="M 15 50 L 105 50" strokeWidth="3" />
            <path d="M 40 90 L 40 95 L 80 95 L 80 90" />
            <path d="M 30 50 Q 35 38 40 50 Q 45 38 50 50 Q 55 38 60 50 Q 65 38 70 50" strokeWidth="1.5" />
            <path className="steam-line" d="M 45 25 Q 42 15 47 5" strokeWidth="1.5" opacity="0.6" style={{ animationDelay: '0.2s' }} />
            <path className="steam-line" d="M 60 25 Q 58 12 62 5" strokeWidth="1.5" opacity="0.6" style={{ animationDelay: '0.8s' }} />
          </g>
        );
      case 6:
        return (
          <g stroke="#1e1208" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <line x1="30" y1="120" x2="30" y2="0" strokeWidth="4" />
            <line x1="60" y1="120" x2="60" y2="0" strokeWidth="6" />
            <line x1="28" y1="80" x2="32" y2="80" />
            <line x1="57" y1="50" x2="63" y2="50" />
            <path className="float-item" d="M 60 50 Q 45 40 30 42" fill="#3a5c32" opacity="0.75" />
          </g>
        );
      default:
        return (
          <g stroke="#1e1208" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M 20 100 Q 60 40 100 40 Q 140 40 180 100 Z" fill="#ede6d8" />
            <path d="M 85 62 L 95 72 L 105 65 L 115 75 Z" />
            <circle cx="140" cy="50" r="14" fill="#b83020" opacity="0.15" />
          </g>
        );
    }
  };
  const isPortrait = day === 6;
  return (
    <svg className="art-svg drop-shadow-sm select-none" viewBox={isPortrait ? "0 0 120 200" : "0 0 200 120"} style={{ maskImage: 'radial-gradient(circle, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)', WebkitMaskImage: 'radial-gradient(circle, rgba(0,0,0,1) 75%, rgba(0,0,0,0) 100%)' }}>
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
      
      {/* Notebook Binder Rings (Top and bottom layout overlay style) */}
      <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-20 z-20">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-4 h-4 rounded-full border-2 border-dashed border-[#544436]"></div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '96px', paddingLeft: '16px' }}>
        <div>
          <span className="region-tag">{region} Region</span>
          <h2 className="day-title"><span style={{ color: color }}>〜</span> {metadata.title}</h2>
          <div className="lodging-badge-row">
            <span className="lodging-badge">LODGING</span>
            <span className="lodging-name">{metadata.lodging}</span>
          </div>
          <div style={{ height: '2px', width: '100%', background: `linear-gradient(to right, ${color}, #cdbf9c, transparent)`, marginTop: '12px' }} />
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
      <Map 
        id="travel_map" 
        defaultCenter={{ lat: 35.6762, lng: 139.6503 }} 
        defaultZoom={11} 
        mapTypeId={mapType} 
        disableDefaultUI={true} 
        zoomControl={true} 
        style={{ width: '100%', height: '100%' }}
        options={{
          styles: RETRO_MAP_STYLE,
          gestureHandling: 'cooperative'
        }}
      >
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
          {/* Notebook cover container on left split */}
          <section className="journal-pane-wrapper flex flex-row" style={{ boxShadow: editMode ? 'inset 0 0 0 2px var(--amber)' : 'none' }}>
            {/* Opened Leather Spine binding panel */}
            <div className="w-4 md:w-6 leather-spine flex flex-col justify-around py-16 relative">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1b] border border-[#52441c] shadow-md mx-auto"></div>
              ))}
            </div>
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
