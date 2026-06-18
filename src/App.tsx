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

interface DocEntry { name: string; b64: string; mime: string; }

interface TravelStore {
  activeDay: number;
  editMode: boolean;
  userEdits: UserEdits;
  reservations: Record<number, Reservation>;
  documents: Record<number, DocEntry[]>;
  selectedActivity: { key: string; lat: number; lng: number } | null;
  setActiveDay: (day: number) => void;
  toggleEditMode: () => void;
  updateActivityEdit: (dayId: number, actIndex: number, field: 'title' | 'description', val: string) => void;
  updateMealEdit: (dayId: number, mealType: 'breakfast' | 'lunch' | 'dinner', val: string) => void;
  updateReservation: (dayId: number, fields: Partial<Reservation>) => void;
  selectActivity: (key: string, lat: number, lng: number) => void;
  addDocument: (dayId: number, entry: DocEntry) => void;
  removeDocument: (dayId: number, idx: number) => void;
}

const EDITS_KEY = 'wanderer_edits_v1';
const RESERVATIONS_KEY = 'wanderer_reservations_v1';

const useStore = create<TravelStore>((set) => ({
  activeDay: 1,
  editMode: false,
  userEdits: JSON.parse(localStorage.getItem(EDITS_KEY) || '{"activities":{},"meals":{}}'),
  reservations: JSON.parse(localStorage.getItem(RESERVATIONS_KEY) || '{}'),
  documents: JSON.parse(localStorage.getItem('wanderer_docs_v1') || '{}'),
  selectedActivity: null,

  setActiveDay: (day) => set({ activeDay: day, selectedActivity: null }),
  selectActivity: (key, lat, lng) => set({ selectedActivity: { key, lat, lng } }),

  addDocument: (dayId, entry) => set((state) => {
    const next = { ...state.documents };
    next[dayId] = [...(next[dayId] || []), entry];
    localStorage.setItem('wanderer_docs_v1', JSON.stringify(next));
    return { documents: next };
  }),
  removeDocument: (dayId, idx) => set((state) => {
    const next = { ...state.documents };
    next[dayId] = (next[dayId] || []).filter((_, i) => i !== idx);
    localStorage.setItem('wanderer_docs_v1', JSON.stringify(next));
    return { documents: next };
  }),
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars

// eslint-disable-next-line @typescript-eslint/no-unused-vars

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

const regionGroups = [
  { name: 'Tokyo',         color: '#c87e18', days: [1,2,3,4]        },
  { name: 'Izu Peninsula', color: '#4a7848', days: [5,6]            },
  { name: 'Hakone',        color: '#5878a0', days: [7,8]            },
  { name: 'Lake Biwa',     color: '#388888', days: [9]              },
  { name: 'Osaka',         color: '#b84428', days: [10,11,12]       },
  { name: 'Kyoto',         color: '#7a4a88', days: [13,14,15,16]    },
  { name: 'Tokyo',         color: '#c87e18', days: [17,18]          },
];

const DayNav: React.FC = () => {
  const { activeDay, setActiveDay } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const activeEl = containerRef.current?.querySelector(`[data-day="${activeDay}"]`);
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [activeDay]);

  return (
    <div className="nav-container">
      <div ref={containerRef} className="day-nav">
        {regionGroups.map((group, gi) => (
          <div key={gi} className="nav-region-group">
            <div className="nav-region-label" style={{ color: group.color }}>{group.name}</div>
            <div className="nav-region-days">
              {group.days.map(day => {
                const isActive = activeDay === day;
                return (
                  <button
                    key={day}
                    data-day={day}
                    className={`nav-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setActiveDay(day)}
                  >
                    <div className="nav-btn-color-bar" style={{ backgroundColor: group.color }} />
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// ── Day Master Vignette (one cohesive whimsical scene per day) ────────────────
const DayMasterVignette: React.FC<{ day: number }> = ({ day }) => {
  const renderScene = (): React.ReactNode => {
    switch (day) {
    case 1:
      return (
        <g fillOpacity="1">

    {/* DAY 1 – TOKYO ARRIVAL: neon cityscape at dusk, shinkansen gliding in, soot sprite peeking from suitcase */}
    <rect width="480" height="170" fill="#1a1a2e" fillOpacity="0.18"/>
    {/* City silhouette */}
    <path d="M0 145 L20 145 L20 100 L30 100 L30 88 L42 88 L42 100 L58 100 L58 75 L68 75 L68 60 L78 60 L78 95 L92 95 L92 72 L102 72 L102 55 L112 55 L112 90 L128 90 L128 65 L138 65 L138 82 L154 82 L154 58 L165 58 L165 42 L175 42 L175 78 L190 78 L190 92 L205 92 L205 70 L215 70 L215 55 L225 55 L225 88 L242 88 L242 65 L252 65 L252 78 L268 78 L268 58 L278 58 L278 42 L288 42 L288 75 L302 75 L302 90 L320 90 L320 68 L330 68 L330 52 L340 52 L340 85 L358 85 L358 62 L368 62 L368 78 L385 78 L385 92 L400 92 L400 55 L412 55 L412 42 L422 42 L422 85 L440 85 L440 70 L455 70 L455 88 L480 88 L480 145 Z"
          fill="#2e1f0f" fillOpacity="0.55"/>
    {/* Amber building windows glowing */}
    <rect x="104" y="60" width="5" height="8" fill="#e8a830" fillOpacity="0.7"/>
    <rect x="111" y="60" width="5" height="8" fill="#e8a830" fillOpacity="0.6"/>
    <rect x="167" y="48" width="5" height="6" fill="#c87e18" fillOpacity="0.8"/>
    <rect x="167" y="58" width="5" height="6" fill="#c87e18" fillOpacity="0.7"/>
    <rect x="280" y="48" width="5" height="8" fill="#e8a830" fillOpacity="0.75"/>
    <rect x="402" y="60" width="5" height="8" fill="#c87e18" fillOpacity="0.7"/>
    <rect x="414" y="48" width="5" height="6" fill="#e8a830" fillOpacity="0.6"/>
    {/* Sky gradient hint */}
    <path d="M0 0 L480 0 L480 90 Q240 50 0 90 Z" fill="#7aafcc" fillOpacity="0.1"/>
    {/* Moon */}
    <circle cx="420" cy="28" r="18" fill="#f5edd8" fillOpacity="0.55"/>
    <circle cx="428" cy="24" r="14" fill="#1a1a2e" fillOpacity="0.25"/>
    {/* Ground */}
    <rect x="0" y="145" width="480" height="25" fill="#c8bfa0" fillOpacity="0.3"/>
    {/* Rails */}
    <line x1="0" y1="148" x2="480" y2="148" stroke="#9c8340" strokeWidth="2"/>
    <line x1="0" y1="155" x2="480" y2="155" stroke="#9c8340" strokeWidth="2"/>
    {[20,55,90,125,160,195,230,265,300,335,370,405,440].map((x,i)=>(
      <line key={i} x1={x} y1="146" x2={x} y2="157" stroke="#8c6c30" strokeWidth="3"/>
    ))}
    {/* Shinkansen arriving from right */}
    <path d="M52 118 Q72 108 88 108 L290 108 L294 118 L294 143 L52 143 Z" fill="#f2e8d0" fillOpacity="0.95" stroke="#c4a878" strokeWidth="1.8"/>
    <rect x="52" y="124" width="242" height="5" fill="#7aafcc" fillOpacity="0.7"/>
    {[98,122,146,170,194,218,242,266].map((x,i)=>(
      <rect key={i} x={x} y="110" width="18" height="11" rx="2" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
    ))}
    <path d="M52 118 Q44 124 40 131 Q40 140 50 143" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
    {/* Speed lines left of train */}
    <line x1="0" y1="120" x2="48" y2="120" stroke="#c8bfa0" strokeWidth="1.2" opacity="0.5"/>
    <line x1="0" y1="126" x2="40" y2="126" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.4"/>
    {/* Soot sprite peeking from train window (leftmost) */}
    <circle cx="302" cy="114" r="7" fill="#1e1208" fillOpacity="0.85"/>
    <circle cx="299" cy="112" r="1.8" fill="white"/>
    <circle cx="305" cy="112" r="1.8" fill="white"/>
    <circle cx="299" cy="112" r="0.9" fill="#1e1208"/>
    <circle cx="305" cy="112" r="0.9" fill="#1e1208"/>
    {/* Tiny traveller with enormous suitcase on platform */}
    <rect x="328" y="128" width="16" height="18" rx="2" fill="#5878a0" fillOpacity="0.8" stroke="#3a4870" strokeWidth="1.2"/>
    <line x1="336" y1="128" x2="336" y2="120" stroke="#5c4228" strokeWidth="1.5"/>
    <circle cx="336" cy="116" r="5" fill="#e8dfc8" stroke="#5c4228" strokeWidth="1"/>
    <line x1="336" y1="121" x2="330" y2="128" stroke="#5c4228" strokeWidth="1.2"/>
    <line x1="336" y1="121" x2="342" y2="128" stroke="#5c4228" strokeWidth="1.2"/>
    {/* Stars */}
    <circle cx="60" cy="18" r="1.5" fill="#f5edd8" fillOpacity="0.7" className="float-item"/>
    <circle cx="130" cy="12" r="1"   fill="#f5edd8" fillOpacity="0.5" className="float-item" style={{animationDelay:'1s'}}/>
    <circle cx="360" cy="22" r="1.5" fill="#f5edd8" fillOpacity="0.6" className="float-item" style={{animationDelay:'0.5s'}}/>

        </g>
      );
    case 2:
      return (
        <g fillOpacity="1">

    {/* DAY 2 – GARDENS & CLOCKS: cedar canopy with Totoro napping, pocket watch floating in the trees */}
    <rect width="480" height="170" fill="#7aafcc" fillOpacity="0.1"/>
    {/* Morning sky wash */}
    <path d="M0 0 L480 0 L480 65 Q240 40 0 65 Z" fill="#e8a830" fillOpacity="0.12"/>
    {/* Misty ground */}
    <path d="M0 155 Q240 145 480 155 L480 170 L0 170 Z" fill="#e8e0d0" fillOpacity="0.5"/>
    {/* Stone path */}
    {[60,100,140,180,220,260,300,340,380,420].map((x,i)=>(
      <ellipse key={i} cx={x} cy={163} rx="14" ry="5" fill="#c8bfa0" fillOpacity="0.4"/>
    ))}
    {/* Background cedar forest – far */}
    <rect x="0"   y="80" width="18" height="90" fill="#5c8050" fillOpacity="0.28"/>
    <rect x="30"  y="65" width="22" height="105" fill="#3a5c32" fillOpacity="0.25"/>
    <rect x="68"  y="72" width="18" height="98" fill="#5c8050" fillOpacity="0.22"/>
    <rect x="400" y="75" width="18" height="95" fill="#5c8050" fillOpacity="0.28"/>
    <rect x="430" y="62" width="22" height="108" fill="#3a5c32" fillOpacity="0.25"/>
    <rect x="460" y="78" width="20" height="92" fill="#5c8050" fillOpacity="0.22"/>
    {/* Foreground cedar trunks */}
    <rect x="15"  y="50" width="28" height="120" fill="#3a5c32" fillOpacity="0.55"/>
    <path d="M0 80  L29 40 L58 80  Z" fill="#3a5c32" fillOpacity="0.62"/>
    <path d="M0 105 L29 65 L58 105 Z" fill="#3a5c32" fillOpacity="0.52"/>
    <rect x="82"  y="40" width="32" height="130" fill="#3a5c32" fillOpacity="0.5"/>
    <path d="M66 72 L98 32 L130 72 Z"  fill="#3a5c32" fillOpacity="0.65"/>
    <path d="M66 100 L98 60 L130 100 Z" fill="#3a5c32" fillOpacity="0.5"/>
    <rect x="420" y="45" width="28" height="125" fill="#3a5c32" fillOpacity="0.55"/>
    <path d="M404 78 L434 38 L464 78 Z" fill="#3a5c32" fillOpacity="0.62"/>
    {/* Kiyomasa's well — stone circle */}
    <ellipse cx="340" cy="155" rx="22" ry="10" fill="#c8bfa0" fillOpacity="0.4" stroke="#9c8340" strokeWidth="1.5"/>
    <ellipse cx="340" cy="151" rx="22" ry="10" fill="#e8dfc8" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1.5"/>
    <path d="M340 141 Q340 130 340 120" stroke="#a8b8a0" strokeWidth="1.5" fill="none" strokeDasharray="3 3"/>
    {/* Floating pocket watch above the trees */}
    <circle cx="250" cy="48" r="28" fill="#e8dfc8" fillOpacity="0.55" stroke="#9c8340" strokeWidth="2" className="float-item"/>
    <circle cx="250" cy="48" r="22" fill="none" stroke="#c4a878" strokeWidth="1"/>
    <line x1="250" y1="48" x2="250" y2="30" stroke="#1e1208" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="250" y1="48" x2="264" y2="55" stroke="#1e1208" strokeWidth="1.8" strokeLinecap="round"/>
    <circle cx="250" cy="48" r="3" fill="#b83020"/>
    <path d="M248 18 Q252 12 256 18" stroke="#c4a878" strokeWidth="1.5" fill="none"/>
    {/* Chain floating up */}
    <path d="M252 20 Q260 10 268 6" stroke="#c4a878" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
    {/* TOTORO napping at the base of the big cedar – facing left */}
    <ellipse cx="174" cy="148" rx="22" ry="18" fill="#3a5c32" fillOpacity="0.72"/>
    <ellipse cx="163" cy="133" rx="7" ry="16" fill="#3a5c32" fillOpacity="0.72" transform="rotate(-18 163 133)"/>
    <ellipse cx="185" cy="133" rx="7" ry="16" fill="#3a5c32" fillOpacity="0.72" transform="rotate(18 185 133)"/>
    <ellipse cx="174" cy="150" rx="10" ry="10" fill="#a8bcaa" fillOpacity="0.45"/>
    {/* Closed eyes – sleeping */}
    <path d="M167 143 Q170 140 173 143" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M175 143 Q178 140 181 143" stroke="white" strokeWidth="1.5" fill="none"/>
    <path d="M167 148 Q170 152 177 150 Q182 148 181 148" stroke="#c8bfa0" strokeWidth="1.2" fill="none"/>
    {/* ZZZ floating from Totoro */}
    <text x="190" y="130" fontFamily="serif" fontSize="10" fill="#a8bcaa" fillOpacity="0.8" className="float-item">z</text>
    <text x="198" y="122" fontFamily="serif" fontSize="13" fill="#a8bcaa" fillOpacity="0.6" className="float-item" style={{animationDelay:'0.6s'}}>z</text>
    <text x="208" y="112" fontFamily="serif" fontSize="16" fill="#a8bcaa" fillOpacity="0.4" className="float-item" style={{animationDelay:'1.2s'}}>z</text>
    {/* Dappled light spots on forest floor */}
    <ellipse cx="310" cy="160" rx="12" ry="4" fill="#e8a830" fillOpacity="0.18"/>
    <ellipse cx="390" cy="158" rx="8"  ry="3" fill="#e8a830" fillOpacity="0.14"/>

        </g>
      );
    case 3:
      return (
        <g fillOpacity="1">

    {/* DAY 3 – KAPPABASHI + SUMIDA: knife street, river with Skytree, tiny blacksmith spirit hammering */}
    {/* Sky */}
    <rect width="480" height="170" fill="#e8dfc8" fillOpacity="0.25"/>
    <path d="M0 0 L480 0 L480 80 Q240 55 0 80 Z" fill="#7aafcc" fillOpacity="0.18"/>
    {/* Skytree silhouette in distance */}
    <line x1="385" y1="170" x2="385" y2="10"  stroke="#5c4228" strokeWidth="4" strokeOpacity="0.4"/>
    <line x1="385" y1="30"  x2="370" y2="58"  stroke="#5c4228" strokeWidth="2.5" strokeOpacity="0.35"/>
    <line x1="385" y1="30"  x2="400" y2="58"  stroke="#5c4228" strokeWidth="2.5" strokeOpacity="0.35"/>
    <circle cx="385" cy="28" r="4" fill="#5c4228" fillOpacity="0.5"/>
    {/* River */}
    <path d="M0 130 Q120 118 240 125 T480 128 L480 155 L0 155 Z" fill="#7aafcc" fillOpacity="0.25"/>
    <path d="M0 130 Q120 118 240 125 T480 128" stroke="#7aafcc" strokeWidth="1.5" fill="none"/>
    {/* River shimmer */}
    <path d="M40 138 Q60 134 80 138"  stroke="white" strokeWidth="2" fill="none" opacity="0.4" strokeLinecap="round"/>
    <path d="M180 136 Q200 132 220 136" stroke="white" strokeWidth="1.8" fill="none" opacity="0.35" strokeLinecap="round"/>
    {/* Kappabashi shop fronts */}
    <rect x="30"  y="78" width="55" height="52" fill="#e8dfc8" fillOpacity="0.65" stroke="#9c8340" strokeWidth="1.5"/>
    <rect x="95"  y="82" width="50" height="48" fill="#e8dfc8" fillOpacity="0.55" stroke="#9c8340" strokeWidth="1.5"/>
    <rect x="155" y="75" width="60" height="55" fill="#e8dfc8" fillOpacity="0.65" stroke="#9c8340" strokeWidth="1.5"/>
    {/* Shop noren curtains */}
    <rect x="36"  y="85" width="10" height="24" rx="2" fill="#b83020" fillOpacity="0.7"/>
    <rect x="50"  y="85" width="10" height="20" rx="2" fill="#b83020" fillOpacity="0.6"/>
    <rect x="64"  y="85" width="10" height="24" rx="2" fill="#b83020" fillOpacity="0.7"/>
    <rect x="162" y="82" width="10" height="26" rx="2" fill="#5878a0" fillOpacity="0.7"/>
    <rect x="176" y="82" width="10" height="22" rx="2" fill="#5878a0" fillOpacity="0.6"/>
    <rect x="190" y="82" width="10" height="26" rx="2" fill="#5878a0" fillOpacity="0.7"/>
    {/* Giant knife display in center shop window */}
    <path d="M115 88 L215 90 L220 95 L215 100 L115 101 Z" fill="#dde8e4" stroke="#9c8340" strokeWidth="1.2"/>
    <path d="M115 88 L215 90 L220 95" stroke="white" strokeWidth="0.8" fill="none" opacity="0.7"/>
    <rect x="215" y="87" width="12" height="16" rx="2" fill="#8c5c28" stroke="#6b4010" strokeWidth="1.2"/>
    {/* Shop roofs */}
    <path d="M18 78  L57 66  L96 78"  fill="#5c4228" fillOpacity="0.72" stroke="#3a2010" strokeWidth="1.2"/>
    <path d="M82 82  L120 70 L158 82" fill="#5c4228" fillOpacity="0.72" stroke="#3a2010" strokeWidth="1.2"/>
    <path d="M142 75 L185 60 L228 75" fill="#5c4228" fillOpacity="0.72" stroke="#3a2010" strokeWidth="1.2"/>
    {/* TINY BLACKSMITH SPIRIT on the roof */}
    <circle cx="62" cy="58" r="6" fill="#c87e18" fillOpacity="0.85"/>
    <circle cx="60" cy="56" r="1.5" fill="white"/>
    <circle cx="64" cy="56" r="1.5" fill="white"/>
    <line x1="62" y1="64" x2="62" y2="72" stroke="#c87e18" strokeWidth="1.5"/>
    <line x1="55" y1="67" x2="69" y2="67" stroke="#c87e18" strokeWidth="1.5"/>
    {/* Spirit's tiny hammer */}
    <line x1="68" y1="62" x2="74" y2="68" stroke="#5c4228" strokeWidth="2" strokeLinecap="round"/>
    <rect x="73" y="66" width="6" height="5" rx="1" fill="#9c8340"/>
    {/* Tiny sparks from hammering */}
    <circle cx="76" cy="68" r="1.2" fill="#e8a830" fillOpacity="0.9" className="float-item"/>
    <circle cx="80" cy="65" r="0.9" fill="#e8a830" fillOpacity="0.7" className="float-item" style={{animationDelay:'0.4s'}}/>
    <circle cx="78" cy="72" r="0.8" fill="#c87e18" fillOpacity="0.8" className="float-item" style={{animationDelay:'0.8s'}}/>
    {/* Clouds */}
    <ellipse cx="310" cy="22" rx="38" ry="15" fill="#e8e0d0" fillOpacity="0.55" className="drift-cloud"/>
    <ellipse cx="285" cy="20" rx="25" ry="12" fill="#f0e8d8" fillOpacity="0.5" className="drift-cloud"/>

        </g>
      );
    case 4:
      return (
        <g fillOpacity="1">

    {/* DAY 4 – JAZZ KISSA + YOKOCHO: vinyl record sky, alley smoke, cat playing trumpet */}
    {/* Deep night sky */}
    <rect width="480" height="170" fill="#1e1208" fillOpacity="0.2"/>
    {/* Giant vinyl record as moon/sky element */}
    <circle cx="240" cy="-10" r="110" fill="#1e1208" fillOpacity="0.75"/>
    {[95,82,70,58,46,34].map((r,i)=>(
      <circle key={i} cx="240" cy="-10" r={r} fill="none" stroke="#2a2010" strokeWidth="0.8"/>
    ))}
    <circle cx="240" cy="-10" r="28" fill="#c87e18" fillOpacity="0.85"/>
    <circle cx="240" cy="-10" r="25" fill="none" stroke="#e8a830" strokeWidth="0.8"/>
    <text x="240" y="-16" textAnchor="middle" fontFamily="serif" fontSize="8" fill="#f5edd8" fontStyle="italic">Jazz</text>
    <text x="240" y="-8"  textAnchor="middle" fontFamily="serif" fontSize="6" fill="#f5edd8">Side A</text>
    <circle cx="240" cy="-10" r="4" fill="#1e1208"/>
    {/* Tonearm */}
    <line x1="320" y1="-38" x2="262" y2="2" stroke="#9c8340" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="320" cy="-38" r="8" fill="none" stroke="#9c8340" strokeWidth="1.8"/>
    {/* Alley ground */}
    <rect x="0" y="145" width="480" height="25" fill="#c8bfa0" fillOpacity="0.25"/>
    {/* Wooden stalls left side */}
    <rect x="0"   y="70" width="80" height="80" fill="#2e1f0f" fillOpacity="0.55" stroke="#9c8340" strokeWidth="1.2"/>
    <rect x="90"  y="85" width="70" height="65" fill="#2e1f0f" fillOpacity="0.5"  stroke="#9c8340" strokeWidth="1.2"/>
    {/* Red lanterns hanging */}
    <line x1="25" y1="55" x2="25" y2="70" stroke="#9c8340" strokeWidth="1.2"/>
    <ellipse cx="25" cy="76" rx="10" ry="14" fill="#b83020" fillOpacity="0.8" stroke="#8c1e10" strokeWidth="1.2"/>
    <ellipse cx="25" cy="67" rx="10" ry="4"  fill="#c84838" fillOpacity="0.7" stroke="#8c1e10" strokeWidth="1"/>
    <line x1="70" y1="50" x2="70" y2="65" stroke="#9c8340" strokeWidth="1.2"/>
    <ellipse cx="70" cy="71" rx="9"  ry="12" fill="#b83020" fillOpacity="0.75" stroke="#8c1e10" strokeWidth="1.2"/>
    {/* Smoke from yakitori */}
    <path className="steam-line" d="M45 68 Q40 52 46 40" stroke="#c8bfa0" strokeWidth="4" fill="none" opacity="0.4"/>
    <path className="steam-line steam-2" d="M130 80 Q125 64 131 52" stroke="#c8bfa0" strokeWidth="3" fill="none" opacity="0.35"/>
    {/* CAT PLAYING TRUMPET in the shadows */}
    <ellipse cx="220" cy="130" rx="14" ry="11" fill="#1e1208" fillOpacity="0.82"/>
    <circle  cx="220" cy="114" r="9"   fill="#1e1208" fillOpacity="0.82"/>
    <path d="M214 108 L210 100 L217 106 Z" fill="#1e1208" fillOpacity="0.82"/>
    <path d="M226 108 L230 100 L223 106 Z" fill="#1e1208" fillOpacity="0.82"/>
    <circle cx="217" cy="113" r="2" fill="#e8dfc8" fillOpacity="0.7"/>
    <circle cx="223" cy="113" r="2" fill="#e8dfc8" fillOpacity="0.7"/>
    {/* Tail curling */}
    <path d="M234 128 Q248 118 244 108" stroke="#1e1208" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* Trumpet */}
    <path d="M225 115 L248 110 L255 112 Q262 116 258 122 Q252 130 244 124 L238 122 L228 118 Z" fill="#c87e18" fillOpacity="0.8" stroke="#9c6c18" strokeWidth="1"/>
    <path d="M228 118 L225 115" stroke="#9c6c18" strokeWidth="1.5"/>
    {/* Music notes floating */}
    <text x="264" y="100" fontFamily="serif" fontSize="16" fill="#c87e18" fillOpacity="0.7" className="float-item">♪</text>
    <text x="285" y="88"  fontFamily="serif" fontSize="12" fill="#e8a830" fillOpacity="0.55" className="float-item" style={{animationDelay:'0.7s'}}>♫</text>
    <text x="306" y="104" fontFamily="serif" fontSize="10" fill="#c87e18" fillOpacity="0.5" className="float-item" style={{animationDelay:'1.4s'}}>♩</text>
    {/* Stall on right – yakitori grill glow */}
    <rect x="350" y="80" width="130" height="90" fill="#2e1f0f" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1.2"/>
    <rect x="368" y="105" width="80" height="20" rx="2" fill="#c87e18" fillOpacity="0.3"/>
    <ellipse cx="408" cy="105" rx="38" ry="8" fill="#e8a830" fillOpacity="0.2"/>

        </g>
      );
    case 5:
      return (
        <g fillOpacity="1">

    {/* DAY 5 – TO SHUZENJI: shinkansen by the coast, Totoro waving from a green hill */}
    {/* Coastal morning sky */}
    <path d="M0 0 L480 0 L480 80 L0 80 Z" fill="#e8dfc8" fillOpacity="0.3"/>
    <circle cx="420" cy="35" r="22" fill="#e8a830" fillOpacity="0.28"/>
    <circle cx="420" cy="35" r="14" fill="#e8a830" fillOpacity="0.22"/>
    {/* Sun reflection on water */}
    <path d="M390 115 Q420 108 450 115" stroke="#e8a830" strokeWidth="4" fill="none" opacity="0.35" strokeLinecap="round"/>
    <path d="M398 122 Q420 116 442 122" stroke="#e8a830" strokeWidth="2.5" fill="none" opacity="0.25" strokeLinecap="round"/>
    {/* Ocean */}
    <path d="M0 100 Q120 88 240 96 T480 100 L480 150 L0 150 Z" fill="#7aafcc" fillOpacity="0.22"/>
    <path d="M0 100 Q120 88 240 96 T480 100" stroke="#7aafcc" strokeWidth="1.5" fill="none"/>
    <path d="M0 110 Q80 104 160 108 T320 108 T480 112" stroke="#7aafcc" strokeWidth="0.8" fill="none"/>
    {/* Wave crests */}
    <path d="M30 105 Q45 100 60 105"  stroke="white" strokeWidth="2" fill="none" opacity="0.45" strokeLinecap="round"/>
    <path d="M200 103 Q215 98 230 103" stroke="white" strokeWidth="1.8" fill="none" opacity="0.38" strokeLinecap="round"/>
    <path d="M350 106 Q365 101 380 106" stroke="white" strokeWidth="1.8" fill="none" opacity="0.35" strokeLinecap="round"/>
    {/* Green hills rolling */}
    <path d="M0 95 L40 70 L80 85 L120 62 L160 78 L200 58 L240 72 L280 55 L320 68 L360 50 L400 64 L440 48 L480 60 L480 95 Z" fill="#5c8050" fillOpacity="0.4"/>
    <path d="M0 95 L50 78 L100 88 L150 72 L200 80 L250 68 L300 75 L350 62 L400 70 L450 58 L480 65 L480 95 Z" fill="#3a5c32" fillOpacity="0.32"/>
    {/* Rails */}
    <line x1="0" y1="147" x2="480" y2="147" stroke="#9c8340" strokeWidth="2"/>
    <line x1="0" y1="153" x2="480" y2="153" stroke="#9c8340" strokeWidth="2"/>
    {[18,48,78,108,138,168,198,228,258,288,318,348,378,408,438,468].map((x,i)=>(
      <line key={i} x1={x} y1="145" x2={x} y2="155" stroke="#8c6c30" strokeWidth="3"/>
    ))}
    {/* Shinkansen rushing */}
    <path d="M80 115 Q100 105 118 105 L360 105 L364 115 L364 142 L80 142 Z" fill="#f2e8d0" fillOpacity="0.94" stroke="#c4a878" strokeWidth="1.8"/>
    <rect x="80" y="122" width="284" height="5" fill="#7aafcc" fillOpacity="0.7"/>
    {[125,150,175,200,225,250,275,300,325].map((x,i)=>(
      <rect key={i} x={x} y="107" width="18" height="11" rx="2" fill="#7aafcc" fillOpacity="0.62" stroke="#c4a878" strokeWidth="0.8"/>
    ))}
    <path d="M80 115 Q72 121 68 128 Q68 138 78 142" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
    <line x1="0" y1="118" x2="76" y2="118" stroke="#c8bfa0" strokeWidth="1.2" opacity="0.5"/>
    <line x1="0" y1="124" x2="68" y2="124" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.4"/>
    {/* TOTORO on the hill waving */}
    <ellipse cx="390" cy="62" rx="18" ry="20" fill="#3a5c32" fillOpacity="0.75"/>
    <ellipse cx="381" cy="44" rx="5" ry="13" fill="#3a5c32" fillOpacity="0.75" transform="rotate(-18 381 44)"/>
    <ellipse cx="399" cy="44" rx="5" ry="13" fill="#3a5c32" fillOpacity="0.75" transform="rotate(18 399 44)"/>
    <ellipse cx="390" cy="65" rx="8" ry="9" fill="#a8bcaa" fillOpacity="0.4"/>
    <circle cx="385" cy="56" r="3.5" fill="white" fillOpacity="0.9"/>
    <circle cx="395" cy="56" r="3.5" fill="white" fillOpacity="0.9"/>
    <circle cx="385" cy="56" r="1.8" fill="#1e1208"/>
    <circle cx="395" cy="56" r="1.8" fill="#1e1208"/>
    <path d="M386 62 Q390 66 394 62" stroke="white" strokeWidth="1.2" fill="none"/>
    {/* Totoro's waving arm */}
    <path d="M372 60 Q362 50 356 44" stroke="#3a5c32" strokeWidth="5" fill="none" strokeLinecap="round" fillOpacity="0.75"/>
    {/* Clouds */}
    <ellipse cx="60"  cy="20" rx="40" ry="16" fill="#e8e0d0" fillOpacity="0.6" className="drift-cloud"/>
    <ellipse cx="35"  cy="18" rx="26" ry="12" fill="#f0e8d8" fillOpacity="0.5" className="drift-cloud"/>
    <ellipse cx="180" cy="14" rx="35" ry="14" fill="#e8e0d0" fillOpacity="0.5" className="drift-cloud" style={{animationDuration:'14s', animationDelay:'-6s'}}/>

        </g>
      );
    case 6:
      return (
        <g fillOpacity="1">

    {/* DAY 6 – BAMBOO + NOH: bamboo grove, Kodama spirits, floating Noh stage on water */}
    {/* Filtered jade sky */}
    <rect width="480" height="170" fill="#4a7040" fillOpacity="0.08"/>
    <path d="M0 0 L480 0 L480 60 Q240 40 0 60 Z" fill="#5c8050" fillOpacity="0.1"/>
    {/* Ground mist */}
    <path d="M0 148 Q240 138 480 148 L480 170 L0 170 Z" fill="#e8e0d0" fillOpacity="0.5"/>
    {/* Bamboo stalks – back layer */}
    {[8,32,56,82,108,134,162,190,220,252,285,318,352,385,420,455].map((x,i)=>(
      <rect key={i} x={x} y={0} width={i%3===0?10:i%3===1?14:8} height={170} fill={i%3===0?"#7a9e70":i%3===1?"#5c8050":"#a8bfaa"} fillOpacity={i%3===0?0.55:i%3===1?0.62:0.38}/>
    ))}
    {/* Bamboo nodes */}
    {[8,32,56,82,108,134,162,190,220,252,285,318,352,385,420,455].map((x,i)=>(
      [28,62,96,130].map((y,j)=>(
        <line key={j} x1={x-2} y1={y} x2={x+(i%3===0?14:i%3===1?18:12)} y2={y} stroke="#c4a878" strokeWidth={i%3===1?3:2}/>
      ))
    ))}
    {/* Light rays through bamboo */}
    <path d="M130 0 L155 100" stroke="#e8a830" strokeWidth="18" fill="none" opacity="0.055"/>
    <path d="M280 0 L260 100" stroke="#e8a830" strokeWidth="12" fill="none" opacity="0.045"/>
    {/* Noh stage floating on misty water */}
    <path d="M60 128 Q240 118 420 128 L420 160 Q240 168 60 160 Z" fill="#7aafcc" fillOpacity="0.2"/>
    <rect x="148" y="110" width="185" height="48" fill="#e8dfc8" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.5"/>
    <path d="M132 110 Q240 94 348 110 L344 118 Q240 102 136 118 Z" fill="#5c4228" fillOpacity="0.78" stroke="#3a2010" strokeWidth="1.5"/>
    {/* Noh performer silhouette */}
    <ellipse cx="240" cy="122" rx="8" ry="10" fill="#1e1208" fillOpacity="0.6"/>
    <circle cx="240" cy="110" r="7" fill="#1e1208" fillOpacity="0.55"/>
    {/* Stage reflection wavy */}
    <path d="M148 160 Q240 155 333 160" stroke="#c4a878" strokeWidth="1" fill="none" opacity="0.4" strokeDasharray="4 3"/>
    {/* KODAMA spirits peeking from bamboo - three of them */}
    {[[60,80],[220,95],[380,75]].map(([x,y],i)=>(
      <g key={i} transform={`translate(${x},${y})`} className="float-item" style={{animationDelay:`${i*0.8}s`}}>
        <ellipse cx="0" cy="6" rx="6" ry="8" fill="white" fillOpacity="0.82" stroke="#c8bfa0" strokeWidth="0.8"/>
        <circle cx="0" cy="-5" r="7" fill="white" fillOpacity="0.82" stroke="#c8bfa0" strokeWidth="0.8"/>
        <circle cx="-3" cy="-6" r="1.5" fill="#1e1208" fillOpacity="0.45"/>
        <circle cx="3"  cy="-6" r="1.5" fill="#1e1208" fillOpacity="0.45"/>
        <path d="M-2 -1 Q0 1 2 -1" stroke="#c8bfa0" strokeWidth="0.8" fill="none"/>
      </g>
    ))}
    {/* Leaves drifting */}
    <path className="float-item" style={{animationDelay:'0.5s'}} d="M340 30 Q348 22 358 28 Q350 38 340 30" fill="#5c8050" fillOpacity="0.55"/>
    <path className="float-item" style={{animationDelay:'1.5s'}} d="M110 50 Q118 42 128 48 Q120 58 110 50" fill="#7a9e70" fillOpacity="0.5"/>

        </g>
      );
    case 7:
      return (
        <g fillOpacity="1">

    {/* DAY 7 – MOUNTAIN RAILWAY + HAKONE: cedar ravine, small dragon on the tracks, ryokan */}
    {/* Alpine sky */}
    <path d="M0 0 L480 0 L480 70 L0 70 Z" fill="#e8dfc8" fillOpacity="0.3"/>
    {/* Mountain silhouette */}
    <path d="M0 110 L60 50 L100 80 L160 30 L220 62 L280 20 L340 58 L390 35 L450 55 L480 42 L480 110 Z" fill="#c8bfa0" fillOpacity="0.35"/>
    <path d="M248 38 L280 20 L312 38 Z" fill="white" fillOpacity="0.55"/>
    {/* Cloud layers crossing mountain */}
    <path d="M0 65 Q60 55 120 65 T240 62 T360 65 T480 62" stroke="#e8e0d0" strokeWidth="10" fill="none" opacity="0.42"/>
    <path d="M0 72 Q60 62 120 72 T240 69 T360 72 T480 69" stroke="#e8e0d0" strokeWidth="6" fill="none" opacity="0.32"/>
    {/* Cedar forest walls */}
    <rect x="0"   y="75" width="70" height="95" fill="#3a5c32" fillOpacity="0.55"/>
    <rect x="400" y="72" width="80" height="98" fill="#3a5c32" fillOpacity="0.55"/>
    {/* Ravine walls */}
    <path d="M55 75 L55 170" stroke="#9c8340" strokeWidth="2" strokeDasharray="4 3" opacity="0.4"/>
    <path d="M425 72 L425 170" stroke="#9c8340" strokeWidth="2" strokeDasharray="4 3" opacity="0.4"/>
    {/* Rails switchbacking up */}
    <path d="M55 160 Q120 145 180 148 Q240 152 300 140 Q360 128 425 132" stroke="#9c8340" strokeWidth="2.5" fill="none"/>
    <path d="M55 166 Q120 151 180 154 Q240 158 300 146 Q360 134 425 138" stroke="#9c8340" strokeWidth="2.5" fill="none"/>
    {/* Tozan train (red, small) */}
    <path d="M140 138 Q155 132 165 132 L260 132 L263 138 L263 158 L140 158 Z" fill="#b83020" fillOpacity="0.82" stroke="#8c1e10" strokeWidth="1.5"/>
    <rect x="148" y="134" width="14" height="9" rx="1.5" fill="#7aafcc" fillOpacity="0.65"/>
    <rect x="166" y="134" width="14" height="9" rx="1.5" fill="#7aafcc" fillOpacity="0.65"/>
    <rect x="184" y="134" width="14" height="9" rx="1.5" fill="#7aafcc" fillOpacity="0.65"/>
    <path className="steam-line" d="M148 130 Q144 120 148 112" stroke="#e8e0d0" strokeWidth="3" fill="none" opacity="0.6"/>
    {/* Ryokan glimpsed through trees */}
    <rect x="320" y="100" width="65" height="48" fill="#e8dfc8" fillOpacity="0.52" stroke="#9c8340" strokeWidth="1.2"/>
    <path d="M308 100 Q352 86 394 100 L390 108 Q352 94 312 108 Z" fill="#5c4228" fillOpacity="0.7" stroke="#3a2010" strokeWidth="1.2"/>
    {/* SMALL DRAGON coiled on the tracks ahead of train */}
    <path d="M88 148 Q100 138 112 144 Q124 150 118 160 Q106 168 95 160 Q82 150 88 148 Z" fill="#5878a0" fillOpacity="0.75" stroke="#3a4870" strokeWidth="1.2"/>
    <circle cx="118" cy="143" r="8" fill="#5878a0" fillOpacity="0.75" stroke="#3a4870" strokeWidth="1.2"/>
    <circle cx="122" cy="140" r="3"  fill="#5c4228"/>
    <circle cx="122" cy="140" r="1.5" fill="#1e1208"/>
    {/* Dragon spines */}
    <path d="M90 150 L86 144 M97 145 L94 138 M105 144 L103 136" stroke="#7a9e70" strokeWidth="1.5" fill="none"/>
    {/* Dragon winking */}
    <path d="M116 142 Q118 140 120 142" stroke="white" strokeWidth="1" fill="none"/>
    {/* Dragon smoke puff */}
    <path className="steam-line" d="M126 138 Q130 130 128 122" stroke="#e8e0d0" strokeWidth="2.5" fill="none" opacity="0.5"/>
    {/* Fireflies in trees */}
    <circle cx="28"  cy="90" r="2.5" fill="#e8a830" fillOpacity="0.7" className="float-item"/>
    <circle cx="445" cy="88" r="2"   fill="#e8a830" fillOpacity="0.6" className="float-item" style={{animationDelay:'1s'}}/>

        </g>
      );
    case 8:
      return (
        <g fillOpacity="1">

    {/* DAY 8 – HAKONE OPEN AIR + OWAKUDANI: sculpture garden, volcanic steam, fire spirit dancing, ropeway */}
    {/* Moody volcanic sky */}
    <rect width="480" height="170" fill="#e8a830" fillOpacity="0.06"/>
    {/* Distant Fuji hint */}
    <path d="M330 95 L380 45 L430 95" fill="#e8dfc8" fillOpacity="0.42" stroke="#c8bfa0" strokeWidth="1.2"/>
    <path d="M360 72 L380 45 L400 72" fill="white" fillOpacity="0.55"/>
    {/* Volcanic terrain */}
    <path d="M0 125 L22 105 L45 118 L70 98 L95 112 L125 90 L155 106 L185 88 L215 102 L480 95 L480 125 Z" fill="#8c7050" fillOpacity="0.42" stroke="#9c8340" strokeWidth="1"/>
    <path d="M0 140 L480 140 L480 170 L0 170 Z" fill="#8c7050" fillOpacity="0.28"/>
    {/* Ropeway cables */}
    <line x1="0"   y1="52" x2="480" y2="62" stroke="#5c4228" strokeWidth="1.5"/>
    <line x1="0"   y1="55" x2="480" y2="65" stroke="#5c4228" strokeWidth="1.5"/>
    {/* Ropeway cabin */}
    <rect x="180" y="44" width="38" height="24" rx="5" fill="#c87e18" fillOpacity="0.82" stroke="#9c8340" strokeWidth="1.5" className="float-item"/>
    <line x1="199" y1="44" x2="199" y2="38" stroke="#5c4228" strokeWidth="1.8"/>
    <rect x="184" y="48" width="12" height="14" rx="1.5" fill="#7aafcc" fillOpacity="0.6"/>
    <rect x="200" y="48" width="12" height="14" rx="1.5" fill="#7aafcc" fillOpacity="0.6"/>
    {/* Steam vents – BIG */}
    <path className="steam-line"              d="M58 102 Q50 80 58 60"  stroke="#e8e0d0" strokeWidth="12" fill="none" opacity="0.6"/>
    <path className="steam-line steam-2"      d="M85 96  Q77 74 85 54"  stroke="#e8e0d0" strokeWidth="16" fill="none" opacity="0.55"/>
    <path className="steam-line steam-3"      d="M112 102 Q104 80 112 60" stroke="#e8e0d0" strokeWidth="9"  fill="none" opacity="0.5"/>
    <path className="steam-line" style={{animationDelay:'0.4s'}} d="M70 98 Q62 76 70 56" stroke="#e8e0d0" strokeWidth="7" fill="none" opacity="0.4"/>
    {/* Sulfur yellow ground tinge */}
    <path d="M40 120 Q75 115 110 118" stroke="#e8a830" strokeWidth="3" fill="none" opacity="0.4"/>
    {/* Henry Moore-esque sculpture */}
    <ellipse cx="300" cy="112" rx="28" ry="35" fill="#8c7050" fillOpacity="0.55" stroke="#6b5030" strokeWidth="1.8"/>
    <ellipse cx="300" cy="105" rx="16" ry="20" fill="#8c7050" fillOpacity="0" stroke="#6b5030" strokeWidth="0"/>
    <path d="M282 96 Q300 78 318 96 Q314 112 300 118 Q286 112 282 96 Z" fill="#c8bfa0" fillOpacity="0.3"/>
    <ellipse cx="300" cy="95" rx="10" ry="14" fill="none" stroke="#9c8340" strokeWidth="1.2"/>
    {/* FIRE SPIRIT dancing in the steam */}
    <ellipse cx="76" cy="70" rx="10" ry="14" fill="#b83020" fillOpacity="0.7"/>
    <ellipse cx="76" cy="58" rx="7"  ry="10" fill="#c84838" fillOpacity="0.6"/>
    <path d="M70 52 Q76 42 82 52" fill="#e8a830" fillOpacity="0.7"/>
    <circle cx="73" cy="65" r="2" fill="white" fillOpacity="0.9"/>
    <circle cx="79" cy="65" r="2" fill="white" fillOpacity="0.9"/>
    <circle cx="73" cy="65" r="1" fill="#1e1208"/>
    <circle cx="79" cy="65" r="1" fill="#1e1208"/>
    {/* Spirit arms dancing */}
    <path d="M66 68 Q56 58 50 62" stroke="#b83020" strokeWidth="3" fill="none" strokeLinecap="round" fillOpacity="0.7"/>
    <path d="M86 68 Q96 58 102 62" stroke="#b83020" strokeWidth="3" fill="none" strokeLinecap="round" fillOpacity="0.7"/>
    {/* Kuro tamago black eggs on ridge */}
    <circle cx="162" cy="116" r="7" fill="#1e1208" fillOpacity="0.75"/>
    <circle cx="178" cy="114" r="7" fill="#1e1208" fillOpacity="0.7"/>
    <circle cx="194" cy="116" r="7" fill="#1e1208" fillOpacity="0.75"/>

        </g>
      );
    case 9:
      return (
        <g fillOpacity="1">

    {/* DAY 9 – LAKE BIWA: vast lake, reed beds, water spirit with curious eyes */}
    {/* Pale vast sky */}
    <path d="M0 0 L480 0 L480 72 L0 72 Z" fill="#7aafcc" fillOpacity="0.16"/>
    {/* Hazy mountains reflected */}
    <path d="M0 65 L30 42 L55 56 L85 32 L108 48 L138 28 L162 46 L192 26 L220 44 L260 22 L295 42 L325 24 L352 40 L382 22 L415 38 L448 20 L480 35 L480 65 Z" fill="#a8bcaa" fillOpacity="0.42" stroke="#9c8340" strokeWidth="0.8"/>
    <path d="M248 30 L280 22 L312 30 Z" fill="white" fillOpacity="0.4"/>
    {/* Mountain reflection wavy */}
    <path d="M0 75 Q15 79 30 75 Q42 80 55 75 Q68 79 80 75 Q95 80 108 75 Q122 79 138 74 Q155 80 162 74 Q180 80 200 73" stroke="#a8bcaa" strokeWidth="5" fill="none" opacity="0.28"/>
    {/* Lake – vast expanse */}
    <path d="M0 72 Q240 62 480 72 L480 170 L0 170 Z" fill="#7aafcc" fillOpacity="0.22"/>
    {/* Lake shimmer */}
    <path d="M35 88  Q55 83 75 88"  stroke="white" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round"/>
    <path d="M150 84 Q170 79 190 84" stroke="white" strokeWidth="2.2" fill="none" opacity="0.38" strokeLinecap="round"/>
    <path d="M280 90 Q300 85 320 90" stroke="white" strokeWidth="2" fill="none" opacity="0.35" strokeLinecap="round"/>
    <path d="M390 86 Q412 81 432 86" stroke="white" strokeWidth="2" fill="none" opacity="0.32" strokeLinecap="round"/>
    {/* Ripple lines */}
    <path d="M0 100 Q120 93 240 98 T480 100" stroke="#7aafcc" strokeWidth="1" fill="none"/>
    <path d="M0 112 Q120 105 240 110 T480 112" stroke="#7aafcc" strokeWidth="0.8" fill="none"/>
    {/* Reed grasses left */}
    {[18,26,34,44,52].map((x,i)=>(
      <g key={i}>
        <line x1={x} y1={170} x2={x} y2={i%2===0?72:78} stroke={i%2===0?"#5c8050":"#3a5c32"} strokeWidth={i%2===0?3:2.5}/>
        <ellipse cx={x} cy={i%2===0?70:76} rx="3.5" ry={i%2===0?9:8} fill="#8c6c30" fillOpacity="0.65"/>
      </g>
    ))}
    {/* Reed grasses right */}
    {[432,440,450,460,470].map((x,i)=>(
      <g key={i}>
        <line x1={x} y1={170} x2={x} y2={i%2===0?75:70} stroke={i%2===0?"#5c8050":"#3a5c32"} strokeWidth={i%2===0?2.5:3}/>
        <ellipse cx={x} cy={i%2===0?73:68} rx="3.5" ry={i%2===0?8:9} fill="#8c6c30" fillOpacity="0.65"/>
      </g>
    ))}
    {/* Small fishing boat */}
    <path d="M195 118 Q215 115 235 118 Q228 126 202 126 Z" fill="#9c6c30" fillOpacity="0.7" stroke="#6b4010" strokeWidth="1.2"/>
    <line x1="215" y1="118" x2="215" y2="104" stroke="#6b4010" strokeWidth="1.5"/>
    <path d="M215 104 L226 108 L215 114 L204 108 Z" fill="#e8a830" fillOpacity="0.55"/>
    {/* WATER SPIRIT – enormous round face mostly submerged, only top of head + eyes above waterline */}
    <ellipse cx="330" cy="82" rx="42" ry="22" fill="#3a8888" fillOpacity="0.28"/>
    <ellipse cx="330" cy="78" rx="35" ry="16" fill="#388888" fillOpacity="0.22"/>
    {/* Curious eyes breaking the surface */}
    <circle cx="316" cy="75" r="12" fill="#e8dfc8" fillOpacity="0.78" stroke="#5c8888" strokeWidth="1.2"/>
    <circle cx="344" cy="75" r="12" fill="#e8dfc8" fillOpacity="0.78" stroke="#5c8888" strokeWidth="1.2"/>
    <circle cx="316" cy="76" r="7" fill="#388888" fillOpacity="0.7"/>
    <circle cx="344" cy="76" r="7" fill="#388888" fillOpacity="0.7"/>
    <circle cx="316" cy="76" r="3" fill="#1e1208"/>
    <circle cx="344" cy="76" r="3" fill="#1e1208"/>
    <circle cx="318" cy="74" r="1.2" fill="white"/>
    <circle cx="346" cy="74" r="1.2" fill="white"/>
    {/* Concentric water ripples from the spirit */}
    <ellipse cx="330" cy="88" rx="55" ry="12" fill="none" stroke="#7aafcc" strokeWidth="1" opacity="0.4"/>
    <ellipse cx="330" cy="92" rx="72" ry="15" fill="none" stroke="#7aafcc" strokeWidth="0.8" opacity="0.28"/>

        </g>
      );
    case 10:
      return (
        <g fillOpacity="1">

    {/* DAY 10 – YAMAZAKI + OSAKA: copper stills, whisky gold, tanuki rolling a barrel */}
    <rect width="480" height="170" fill="#c87e18" fillOpacity="0.06"/>
    {/* Warm amber sky */}
    <path d="M0 0 L480 0 L480 75 Q240 52 0 75 Z" fill="#e8a830" fillOpacity="0.16"/>
    {/* Oak barrel wall background */}
    {[0,80,160,240,320,400].map((x,i)=>(
      <g key={i}>
        <ellipse cx={x+40} cy={148} rx={32} ry={20} fill="#8c6c30" fillOpacity="0.48" stroke="#6b4010" strokeWidth="1.5"/>
        <line x1={x+8}  y1={148} x2={x+72} y2={148} stroke="#6b4010" strokeWidth="1.5"/>
        <line x1={x+10} y1={138} x2={x+70} y2={138} stroke="#6b4010" strokeWidth="1"/>
        <line x1={x+10} y1={158} x2={x+70} y2={158} stroke="#6b4010" strokeWidth="1"/>
        <ellipse cx={x+72} cy={148} rx={5} ry={20} fill="#9c7038" fillOpacity="0.45"/>
      </g>
    ))}
    {/* Second row of barrels */}
    {[40,120,200,280,360,440].map((x,i)=>(
      <g key={i}>
        <ellipse cx={x+40} cy={112} rx={28} ry={17} fill="#9c7038" fillOpacity="0.42" stroke="#6b4010" strokeWidth="1.5"/>
        <line x1={x+12} y1={112} x2={x+68} y2={112} stroke="#6b4010" strokeWidth="1.5"/>
        <line x1={x+14} y1={102} x2={x+66} y2={102} stroke="#6b4010" strokeWidth="1"/>
        <line x1={x+14} y1={122} x2={x+66} y2={122} stroke="#6b4010" strokeWidth="1"/>
      </g>
    ))}
    {/* Copper pot still – large */}
    <path d="M48 95 L48 40 Q48 20 72 14 L86 10 Q102 6 102 24 L102 40 Q102 56 82 62 L72 66 L72 95 Z" fill="#c87e18" fillOpacity="0.6" stroke="#9c8340" strokeWidth="2"/>
    <path d="M82 10 Q102 0 114 -8 L128 -16" stroke="#c87e18" strokeWidth="7" fill="none" strokeLinecap="round"/>
    <path d="M128 -16 Q148 -20 152 -6 Q156 8 136 14 Q116 18 118 34 Q120 50 138 54" stroke="#c4a878" strokeWidth="3" fill="none"/>
    {/* Steam from still */}
    <path className="steam-line" d="M68 10 Q62 -4 68 -16" stroke="#e8e0d0" strokeWidth="3.5" fill="none" opacity="0.55"/>
    <path className="steam-line steam-2" d="M78 8 Q72 -6 78 -18" stroke="#e8e0d0" strokeWidth="2.8" fill="none" opacity="0.45"/>
    {/* Whisky glass */}
    <path d="M175 95 L170 60 L195 60 L190 95 Z" fill="#e8a830" fillOpacity="0.38" stroke="#9c8340" strokeWidth="1.5"/>
    <ellipse cx="182" cy="60" rx="12" ry="3.5" fill="#c87e18" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1"/>
    <rect x="174" y="72" width="16" height="14" rx="2" fill="white" fillOpacity="0.4" stroke="#c4a878" strokeWidth="0.8" transform="rotate(-6 182 79)"/>
    {/* TANUKI rolling a barrel with great effort */}
    <ellipse cx="280" cy="148" rx="16" ry="22" fill="#8c6c30" fillOpacity="0.4"/>
    <circle  cx="280" cy="120" r="12" fill="#8c6c30" fillOpacity="0.65" stroke="#6b4010" strokeWidth="1"/>
    {/* Tanuki face */}
    <circle cx="276" cy="117" r="2.5" fill="#1e1208"/>
    <circle cx="284" cy="117" r="2.5" fill="#1e1208"/>
    <ellipse cx="280" cy="124" rx="5" ry="3" fill="#5c4228" fillOpacity="0.5"/>
    {/* Tanuki ears */}
    <path d="M271 112 L266 104 L274 110 Z" fill="#8c6c30" fillOpacity="0.65"/>
    <path d="M289 112 L294 104 L286 110 Z" fill="#8c6c30" fillOpacity="0.65"/>
    {/* Tanuki belly spot */}
    <ellipse cx="280" cy="143" rx="9" ry="10" fill="#c4a878" fillOpacity="0.35"/>
    {/* The barrel the tanuki is pushing */}
    <ellipse cx="320" cy="148" rx="28" ry="17" fill="#8c6c30" fillOpacity="0.55" stroke="#6b4010" strokeWidth="1.8"/>
    <line x1="292" y1="148" x2="348" y2="148" stroke="#6b4010" strokeWidth="1.8"/>
    <line x1="294" y1="137" x2="346" y2="137" stroke="#6b4010" strokeWidth="1.2"/>
    <line x1="294" y1="159" x2="346" y2="159" stroke="#6b4010" strokeWidth="1.2"/>
    {/* Tanuki arm pushing barrel */}
    <path d="M292 132 Q305 138 308 148" stroke="#8c6c30" strokeWidth="4" fill="none" strokeLinecap="round" fillOpacity="0.65"/>
    {/* Sweat drop from effort */}
    <path d="M270 108 Q266 104 270 100 Q274 104 270 108" fill="#7aafcc" fillOpacity="0.7"/>
    {/* Osaka tower in distance */}
    <line x1="420" y1="96" x2="420" y2="20"  stroke="#c87e18" strokeWidth="3.5" opacity="0.45"/>
    <rect x="408" y="48" width="24" height="16" rx="2" fill="#c87e18" fillOpacity="0.3"/>
    <circle cx="420" cy="20" r="5" fill="#e8a830" fillOpacity="0.5"/>

        </g>
      );
    case 11:
      return (
        <g fillOpacity="1">

    {/* DAY 11 – DOTONBORI NEON: canal, crab running away, cat in reflections */}
    <rect width="480" height="170" fill="#1e1208" fillOpacity="0.2"/>
    {/* Night sky */}
    <path d="M0 0 L480 0 L480 65 L0 65 Z" fill="#1a1a2e" fillOpacity="0.3"/>
    {/* Building facades */}
    <rect x="0"   y="22" width="45"  height="100" fill="#2e1f0f" fillOpacity="0.55" stroke="#9c8340" strokeWidth="1"/>
    <rect x="50"  y="38" width="35"  height="84"  fill="#1e1208" fillOpacity="0.5"  stroke="#9c8340" strokeWidth="1"/>
    <rect x="155" y="18" width="50"  height="104" fill="#2e1f0f" fillOpacity="0.55" stroke="#9c8340" strokeWidth="1"/>
    <rect x="345" y="20" width="45"  height="102" fill="#2e1f0f" fillOpacity="0.55" stroke="#9c8340" strokeWidth="1"/>
    <rect x="400" y="35" width="40"  height="87"  fill="#1e1208" fillOpacity="0.5"  stroke="#9c8340" strokeWidth="1"/>
    {/* BIG CRAB SIGN */}
    <path d="M78 25 L100 18 L122 22 L140 18 L155 25 Q148 38 135 44 L108 50 L82 44 Q68 38 78 25 Z" fill="#b83020" fillOpacity="0.72" stroke="#8c1e10" strokeWidth="1.5"/>
    <path d="M78 30 Q64 22 62 16 Q70 20 74 28 Z" fill="#b83020" fillOpacity="0.62"/>
    <path d="M155 30 Q169 22 171 16 Q163 20 159 28 Z" fill="#b83020" fillOpacity="0.62"/>
    <text x="116" y="38" textAnchor="middle" fontFamily="serif" fontSize="10" fill="#f5edd8" opacity="0.8">かに</text>
    {/* THE CRAB IS RUNNING AWAY – legs depicted mid-scuttle */}
    <ellipse cx="255" cy="105" rx="30" ry="20" fill="#b83020" fillOpacity="0.7" stroke="#8c1e10" strokeWidth="1.5"/>
    <ellipse cx="255" cy="100" rx="22" ry="14" fill="#c84838" fillOpacity="0.55"/>
    {/* Running legs at wild angles */}
    <line x1="228" y1="110" x2="210" y2="130" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    <line x1="236" y1="122" x2="215" y2="140" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    <line x1="248" y1="125" x2="238" y2="148" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    <line x1="262" y1="125" x2="265" y2="148" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    <line x1="274" y1="122" x2="292" y2="140" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    <line x1="282" y1="110" x2="300" y2="128" stroke="#8c1e10" strokeWidth="3" strokeLinecap="round"/>
    {/* Crab eyes + claws raised in panic */}
    <circle cx="244" cy="96" r="5" fill="#f5edd8" fillOpacity="0.85"/>
    <circle cx="266" cy="96" r="5" fill="#f5edd8" fillOpacity="0.85"/>
    <path d="M236 90 Q228 78 222 80" stroke="#8c1e10" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <rect x="216" y="74" width="14" height="10" rx="2" fill="#8c1e10" fillOpacity="0.7"/>
    <path d="M274 90 Q282 78 288 80" stroke="#8c1e10" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <rect x="286" y="74" width="14" height="10" rx="2" fill="#8c1e10" fillOpacity="0.7"/>
    {/* Canal water */}
    <path d="M0 118 Q120 110 240 116 T480 118 L480 145 L0 145 Z" fill="#7aafcc" fillOpacity="0.22"/>
    {/* Neon reflections in canal */}
    <path d="M80 122 Q108 115 136 122" stroke="#b83020" strokeWidth="3" fill="none" opacity="0.42"/>
    <path d="M168 120 Q185 114 202 120" stroke="#c87e18" strokeWidth="2.5" fill="none" opacity="0.38"/>
    <path d="M350 122 Q368 116 386 122" stroke="#c87e18" strokeWidth="2.5" fill="none" opacity="0.35"/>
    {/* CAT reflection in canal – silhouette only */}
    <ellipse cx="425" cy="132" rx="10" ry="8" fill="#1e1208" fillOpacity="0.55"/>
    <circle  cx="425" cy="120" r="7"  fill="#1e1208" fillOpacity="0.55"/>
    <path d="M420 116 L416 110 L422 114 Z" fill="#1e1208" fillOpacity="0.55"/>
    <path d="M430 116 L434 110 L428 114 Z" fill="#1e1208" fillOpacity="0.55"/>
    <circle cx="422" cy="120" r="2" fill="#e8dfc8" fillOpacity="0.5"/>
    <circle cx="428" cy="120" r="2" fill="#e8dfc8" fillOpacity="0.5"/>
    {/* Lanterns */}
    <ellipse cx="50"  cy="55" rx="10" ry="14" fill="#c87e18" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.2"/>
    <line x1="50"  y1="41" x2="50"  y2="36" stroke="#9c8340" strokeWidth="1.5"/>
    <ellipse cx="430" cy="50" rx="9"  ry="12" fill="#c87e18" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.2"/>
    <line x1="430" y1="38" x2="430" y2="33" stroke="#9c8340" strokeWidth="1.5"/>
    {/* Bridge arc */}
    <path d="M15 118 Q100 88 200 118 Q300 88 400 118 Q450 88 465 118" stroke="#5c4228" strokeWidth="3" fill="none" opacity="0.5"/>

        </g>
      );
    case 12:
      return (
        <g fillOpacity="1">

    {/* DAY 12 – CHURCH OF LIGHT + UMEDA: cross of light, deer-spirit in the beam, twin towers */}
    {/* Concrete grey sky, crisp */}
    <rect width="480" height="170" fill="#e8dfc8" fillOpacity="0.25"/>
    {/* Twin Umeda towers in background */}
    <rect x="320" y="32" width="50" height="138" fill="#c8bfa0" fillOpacity="0.35" stroke="#9c8340" strokeWidth="1"/>
    <rect x="385" y="45" width="50" height="125" fill="#c8bfa0" fillOpacity="0.3"  stroke="#9c8340" strokeWidth="1"/>
    {/* Glass connecting void between towers */}
    <rect x="348" y="50" width="58" height="16" rx="2" fill="#7aafcc" fillOpacity="0.35" stroke="#c4a878" strokeWidth="0.8"/>
    {/* Church of Light – main walls */}
    <rect x="30"  y="30" width="100" height="140" fill="#5c4228" fillOpacity="0.22"/>
    <rect x="150" y="30" width="100" height="140" fill="#5c4228" fillOpacity="0.22"/>
    <rect x="30"  y="30" width="220" height="75" fill="#5c4228" fillOpacity="0.18"/>
    {/* THE CROSS OF LIGHT – glowing amber beams */}
    <rect x="118" y="28" width="26" height="175" fill="#e8a830" fillOpacity="0.32"/>
    <rect x="30"  y="92" width="220" height="26" fill="#e8a830" fillOpacity="0.28"/>
    {/* Light rays fanning */}
    <path d="M131 28 L70 170"  stroke="#e8a830" strokeWidth="22" fill="none" opacity="0.1"/>
    <path d="M131 28 L192 170" stroke="#e8a830" strokeWidth="22" fill="none" opacity="0.1"/>
    <path d="M131 28 L131 170" stroke="#e8a830" strokeWidth="14" fill="none" opacity="0.08"/>
    {/* Concrete texture lines */}
    <line x1="30" y1="65" x2="130" y2="65" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    <line x1="30" y1="100" x2="130" y2="100" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    <line x1="30" y1="135" x2="130" y2="135" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    <line x1="150" y1="65" x2="250" y2="65" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    <line x1="150" y1="100" x2="250" y2="100" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    <line x1="150" y1="135" x2="250" y2="135" stroke="#c8bfa0" strokeWidth="0.6" opacity="0.4"/>
    {/* Pews silhouettes */}
    <rect x="35"  y="150" width="80" height="9" rx="2" fill="#1e1208" fillOpacity="0.45"/>
    <rect x="35"  y="162" width="80" height="9" rx="2" fill="#1e1208" fillOpacity="0.45"/>
    <rect x="165" y="150" width="80" height="9" rx="2" fill="#1e1208" fillOpacity="0.45"/>
    <rect x="165" y="162" width="80" height="9" rx="2" fill="#1e1208" fillOpacity="0.45"/>
    {/* LIGHT DEER SPIRIT standing in the cross beam */}
    <path d="M112 115 L112 85 M106 105 L100 92 M118 105 L124 92 M108 115 L104 130 M116 115 L120 130" stroke="#f5edd8" strokeWidth="2.5" fill="none" strokeLinecap="round" className="float-item"/>
    <circle cx="112" cy="80" r="8" fill="none" stroke="#f5edd8" strokeWidth="1.8" opacity="0.85" className="float-item"/>
    {/* Antlers */}
    <path d="M108 76 L104 68 L100 62 M104 68 L106 62" stroke="#f5edd8" strokeWidth="1.5" fill="none" strokeLinecap="round" className="float-item"/>
    <path d="M116 76 L120 68 L124 62 M120 68 L118 62" stroke="#f5edd8" strokeWidth="1.5" fill="none" strokeLinecap="round" className="float-item"/>
    {/* Second smaller spirit */}
    <path d="M148 130 L148 112 M144 122 L140 114 M152 122 L156 114 M146 130 L143 140 M150 130 L153 140" stroke="#f5edd8" strokeWidth="2" fill="none" strokeLinecap="round" className="float-item" style={{animationDelay:'1.2s'}}/>
    <circle cx="148" cy="108" r="6" fill="none" stroke="#f5edd8" strokeWidth="1.5" opacity="0.75" className="float-item" style={{animationDelay:'1.2s'}}/>
    {/* Floor light pool */}
    <path d="M106 168 L118 130 L130 168" fill="#e8a830" fillOpacity="0.14"/>

        </g>
      );
    case 13:
      return (
        <g fillOpacity="1">

    {/* DAY 13 – KYOTO ENTRY: pagoda through mist, torii gate, fox in Inari robes */}
    {/* Misty Kyoto sky */}
    <rect width="480" height="170" fill="#7a4a88" fillOpacity="0.07"/>
    <path d="M0 0 L480 0 L480 70 Q240 48 0 70 Z" fill="#e8a830" fillOpacity="0.14"/>
    {/* Forest background */}
    <path d="M0 88 L25 58 L45 72 L65 45 L88 62 L110 38 L132 55 L158 32 L180 50 L202 28 L225 46 L250 22 L275 42 L300 20 L325 38 L350 18 L375 36 L400 15 L425 34 L448 12 L480 30 L480 88 Z" fill="#5c8050" fillOpacity="0.38"/>
    <path d="M0 92 L30 68 L55 80 L80 55 L105 70 L130 48 L155 64 L180 42 L205 58 L230 35 L255 50 L280 28 L305 44 L330 22 L355 40 L380 18 L405 36 L430 14 L455 32 L480 18 L480 92 Z" fill="#3a5c32" fillOpacity="0.3"/>
    {/* Mist layers */}
    <path d="M0 88 Q120 78 240 85 T480 88" stroke="#e8e0d0" strokeWidth="12" fill="none" opacity="0.38"/>
    <path d="M0 96 Q120 86 240 93 T480 96" stroke="#e8e0d0" strokeWidth="8"  fill="none" opacity="0.28"/>
    {/* Five-storey pagoda */}
    {[[200,150,10],[175,130,14],[152,108,18],[128,82,22],[104,52,26]].map(([y,w,h],i)=>(
      <g key={i}>
        <rect x={240-w/2} y={y-h} width={w} height={h} fill="#e8dfc8" fillOpacity={0.7-i*0.08} stroke="#9c8340" strokeWidth="1.2"/>
        <path d={`M${240-w/2-10} ${y-h} Q240 ${y-h-10} ${240+w/2+10} ${y-h} L${240+w/2} ${y-h+4} Q240 ${y-h-5} ${240-w/2} ${y-h+4} Z`} fill="#5c4228" fillOpacity="0.75" stroke="#3a2010" strokeWidth="1"/>
      </g>
    ))}
    <line x1="240" y1="48" x2="240" y2="40" stroke="#9c8340" strokeWidth="2"/>
    {/* Torii gate framing the pagoda */}
    <rect x="155" y="105" width="12" height="65" rx="2" fill="#b83020" fillOpacity="0.82" stroke="#8c1e10" strokeWidth="1.5"/>
    <rect x="313" y="105" width="12" height="65" rx="2" fill="#b83020" fillOpacity="0.82" stroke="#8c1e10" strokeWidth="1.5"/>
    <path d="M140 105 Q240 90 340 105 L338 114 Q240 99 142 114 Z" fill="#b83020" fillOpacity="0.85" stroke="#8c1e10" strokeWidth="1.5"/>
    <rect x="155" y="120" width="170" height="8" rx="1" fill="#b83020" fillOpacity="0.75" stroke="#8c1e10" strokeWidth="1"/>
    {/* FOX in Inari ceremonial robes standing by the gate */}
    <ellipse cx="108" cy="148" rx="12" ry="18" fill="#e8dfc8" fillOpacity="0.8" stroke="#c4a878" strokeWidth="1.2"/>
    {/* Fox head */}
    <path d="M100 130 Q108 120 116 130 Q118 140 108 142 Q98 140 100 130" fill="#e8dfc8" fillOpacity="0.85" stroke="#c4a878" strokeWidth="1"/>
    {/* Fox ears */}
    <path d="M103 128 L99 120 L108 126 Z" fill="#e8dfc8" fillOpacity="0.85"/>
    <path d="M113 128 L117 120 L108 126 Z" fill="#e8dfc8" fillOpacity="0.85"/>
    {/* Fox eyes (mischievous) */}
    <path d="M104 133 Q107 131 110 133" stroke="#5c4228" strokeWidth="1.2" fill="none"/>
    <circle cx="113" cy="133" r="1.5" fill="#5c4228"/>
    {/* Fox tail curling around */}
    <path d="M120 148 Q135 138 140 148 Q145 158 130 162 Q115 165 108 155" stroke="#e8dfc8" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.8"/>
    {/* Inari red bib */}
    <path d="M100 138 Q108 134 116 138 L112 155 Q108 158 104 155 Z" fill="#b83020" fillOpacity="0.6"/>
    {/* Fireflies in forest */}
    <circle cx="60"  cy="75" r="2.5" fill="#e8a830" fillOpacity="0.7" className="float-item"/>
    <circle cx="420" cy="72" r="2"   fill="#e8a830" fillOpacity="0.6" className="float-item" style={{animationDelay:'0.9s'}}/>
    <circle cx="380" cy="85" r="1.8" fill="#e8a830" fillOpacity="0.5" className="float-item" style={{animationDelay:'1.8s'}}/>

        </g>
      );
    case 14:
      return (
        <g fillOpacity="1">

    {/* DAY 14 – RYOAN-JI + KINKAKU-JI: raked garden, gold pavilion, two stones gossiping */}
    {/* Garden wall top */}
    <rect x="0" y="0" width="480" height="28" fill="#c8bfa0" fillOpacity="0.38"/>
    <rect x="0" y="0" width="480" height="170" fill="none" stroke="#c4a878" strokeWidth="2.5"/>
    {/* Pine branch overhanging top-right */}
    <path d="M340 0 Q360 20 375 16 Q368 28 358 24 Q375 38 388 34" stroke="#3a5c32" strokeWidth="3.5" fill="none"/>
    <path d="M360 20 Q372 14 384 19" stroke="#3a5c32" strokeWidth="2" fill="none"/>
    {/* Raked gravel lines – zen pattern */}
    {[35,42,49,56,63,70,77,84,91,98,105,112,119,126,133,140,147,154,161,168].map((y,i)=>(
      <line key={i} x1="10" y1={y} x2="280" y2={y} stroke="#c8bfa0" strokeWidth="1.1" opacity="0.72"/>
    ))}
    {/* Concentric ripples around stone 1 */}
    <ellipse cx="65"  cy="102" rx="34" ry="14" fill="none" stroke="#9c8340" strokeWidth="1.1" strokeDasharray="5 2.5"/>
    <ellipse cx="65"  cy="102" rx="24" ry="9.5" fill="none" stroke="#9c8340" strokeWidth="1" strokeDasharray="5 2.5"/>
    <ellipse cx="65"  cy="102" rx="14" ry="5.5" fill="none" stroke="#9c8340" strokeWidth="1"/>
    <ellipse cx="65"  cy="100" rx="16" ry="12" fill="#8c7050" stroke="#6b5030" strokeWidth="1.8"/>
    <ellipse cx="61"  cy="96"  rx="5"  ry="3.5" fill="#a88060" fillOpacity="0.48"/>
    {/* Stone 2 – medium, with ripples */}
    <ellipse cx="162" cy="88" rx="26" ry="10" fill="none" stroke="#9c8340" strokeWidth="1" strokeDasharray="5 2.5"/>
    <ellipse cx="162" cy="88" rx="16" ry="6.5" fill="none" stroke="#9c8340" strokeWidth="1"/>
    <ellipse cx="162" cy="87" rx="12" ry="9" fill="#8c7050" stroke="#6b5030" strokeWidth="1.8"/>
    {/* THE TWO STONES ARE GOSSIPING */}
    {/* Speech bubble from stone 1 */}
    <path d="M80 90 Q92 80 105 82 Q115 84 112 94 Q110 102 98 100 Q85 100 80 90 Z" fill="#f5edd8" fillOpacity="0.88" stroke="#c4a878" strokeWidth="1"/>
    <path d="M80 90 Q76 96 78 100" stroke="#c4a878" strokeWidth="1" fill="#f5edd8" fillOpacity="0.88"/>
    <text x="96" y="94" textAnchor="middle" fontFamily="serif" fontSize="7" fill="#5c4228">...ふむ</text>
    {/* Speech bubble from stone 2 */}
    <path d="M148 78 Q136 68 122 70 Q112 72 114 82 Q116 90 128 88 Q142 88 148 78 Z" fill="#f5edd8" fillOpacity="0.88" stroke="#c4a878" strokeWidth="1"/>
    <path d="M148 78 Q152 84 150 88" stroke="#c4a878" strokeWidth="1" fill="#f5edd8" fillOpacity="0.88"/>
    <text x="131" y="82" textAnchor="middle" fontFamily="serif" fontSize="7" fill="#5c4228">そうですね</text>
    {/* Kinkaku-ji golden pavilion right side */}
    <path d="M295 118 Q360 110 425 118 L422 168 L298 168 Z" fill="#7aafcc" fillOpacity="0.22"/>
    <rect x="305" y="95" width="110" height="23" fill="#e8dfc8" fillOpacity="0.85" stroke="#9c8340" strokeWidth="1.5"/>
    <rect x="298" y="92" width="124" height="7" rx="1" fill="#c4a878" stroke="#9c8340" strokeWidth="1.2"/>
    <rect x="315" y="72" width="90"  height="23" fill="#e8dfc8" fillOpacity="0.85" stroke="#9c8340" strokeWidth="1.5"/>
    <rect x="308" y="69" width="104" height="7" rx="1" fill="#c4a878" stroke="#9c8340" strokeWidth="1.2"/>
    {/* Gold overlay */}
    <rect x="305" y="95" width="110" height="23" fill="#e8a830" fillOpacity="0.25"/>
    <rect x="315" y="72" width="90"  height="23" fill="#e8a830" fillOpacity="0.22"/>
    {/* Pavilion roof */}
    <path d="M285 92 Q360 78 435 92 L428 100 Q360 85 292 100 Z" fill="#5c4228" fillOpacity="0.8" stroke="#3a2010" strokeWidth="1.5"/>
    <path d="M296 69 Q360 55 424 69 L418 77 Q360 62 302 77 Z" fill="#5c4228" fillOpacity="0.82" stroke="#3a2010" strokeWidth="1.5"/>
    <path d="M345 47 Q360 36 375 47" stroke="#c4a878" strokeWidth="1.5" fill="none"/>
    {/* Golden reflection */}
    <path d="M310 122 Q360 116 410 122" stroke="#e8a830" strokeWidth="3" fill="none" opacity="0.35"/>
    <path d="M318 130 Q360 125 402 130" stroke="#e8a830" strokeWidth="2" fill="none" opacity="0.25"/>

        </g>
      );
    case 15:
      return (
        <g fillOpacity="1">

    {/* DAY 15 – GINKAKU-JI + PHILOSOPHER'S PATH: canal path, cherry trees, philosopher cat with tiny book */}
    {/* Cherry blossom pink sky */}
    <path d="M0 0 L480 0 L480 72 L0 72 Z" fill="#f5c0c0" fillOpacity="0.2"/>
    {/* Canal */}
    <path d="M0 115 Q120 108 240 112 T480 115 L480 145 L0 145 Z" fill="#7aafcc" fillOpacity="0.22"/>
    <path d="M0 115 Q120 108 240 112 T480 115" stroke="#7aafcc" strokeWidth="1.5" fill="none"/>
    {/* Stone path alongside canal */}
    <path d="M0 148 L480 148" stroke="#c8bfa0" strokeWidth="3" opacity="0.4"/>
    {[20,50,80,110,140,170,200,230,260,290,320,350,380,410,440].map((x,i)=>(
      <ellipse key={i} cx={x} cy={148} rx="12" ry="4" fill="#c8bfa0" fillOpacity="0.38"/>
    ))}
    {/* Cherry trees left side */}
    <line x1="30"  y1="170" x2="30"  y2="65" stroke="#5c4228" strokeWidth="4.5"/>
    <line x1="30"  y1="85"  x2="15"  y2="70" stroke="#5c4228" strokeWidth="2.8"/>
    <line x1="30"  y1="80"  x2="48"  y2="65" stroke="#5c4228" strokeWidth="2.8"/>
    <circle cx="18"  cy="66" r="20" fill="#f5c0c0" fillOpacity="0.22"/>
    <circle cx="36"  cy="58" r="18" fill="#f5c0c0" fillOpacity="0.25"/>
    <circle cx="52"  cy="62" r="16" fill="#b83020" fillOpacity="0.12"/>
    {/* Second tree */}
    <line x1="120" y1="170" x2="120" y2="70" stroke="#5c4228" strokeWidth="4"/>
    <line x1="120" y1="90"  x2="102" y2="72" stroke="#5c4228" strokeWidth="2.5"/>
    <line x1="120" y1="85"  x2="140" y2="70" stroke="#5c4228" strokeWidth="2.5"/>
    <circle cx="104" cy="68" r="18" fill="#f5c0c0" fillOpacity="0.2"/>
    <circle cx="122" cy="62" r="16" fill="#f5c0c0" fillOpacity="0.22"/>
    {/* Cherry trees right */}
    <line x1="400" y1="170" x2="400" y2="62" stroke="#5c4228" strokeWidth="4.5"/>
    <line x1="400" y1="80"  x2="382" y2="64" stroke="#5c4228" strokeWidth="2.8"/>
    <line x1="400" y1="75"  x2="420" y2="60" stroke="#5c4228" strokeWidth="2.8"/>
    <circle cx="384" cy="60" r="22" fill="#f5c0c0" fillOpacity="0.22"/>
    <circle cx="405" cy="54" r="20" fill="#b83020" fillOpacity="0.13"/>
    {/* Drifting petals */}
    {([[85,35,'0.4s'],[180,50,'0.9s'],[260,28,'1.4s'],[340,42,'0.2s'],[445,38,'1.8s']] as [number,number,string][]).map(([x,y,d],i)=>(
      <path key={i} className="float-item" style={{animationDelay:d}} d={`M${x} ${y} Q${x+5} ${y-4} ${x+9} ${y} Q${x+5} ${y+4} ${x} ${y} Z`} fill="#f5c0c0" fillOpacity="0.7"/>
    ))}
    {/* Ginkaku-ji silver pavilion glimpsed between trees */}
    <rect x="210" y="80" width="70" height="35" fill="#e8dfc8" fillOpacity="0.65" stroke="#9c8340" strokeWidth="1.2"/>
    <path d="M198 80 Q245 66 282 80 L278 88 Q245 74 202 88 Z" fill="#5c4228" fillOpacity="0.72" stroke="#3a2010" strokeWidth="1.2"/>
    <rect x="218" y="62" width="54" height="20" fill="#e8dfc8" fillOpacity="0.6" stroke="#9c8340" strokeWidth="1.2"/>
    <path d="M206 62 Q245 50 284 62 L280 70 Q245 58 210 70 Z" fill="#5c4228" fillOpacity="0.75" stroke="#3a2010" strokeWidth="1.2"/>
    {/* Sand cone */}
    <path d="M302 115 L322 88 L342 115 Z" fill="#e8dfc8" fillOpacity="0.75" stroke="#c4a878" strokeWidth="1.5"/>
    <line x1="302" y1="115" x2="342" y2="115" stroke="#c4a878" strokeWidth="1.2"/>
    {/* PHILOSOPHER CAT walking the path, reading a tiny book */}
    <ellipse cx="355" cy="150" rx="12" ry="9"  fill="#1e1208" fillOpacity="0.78"/>
    <circle  cx="355" cy="137" r="8"   fill="#1e1208" fillOpacity="0.78"/>
    <path d="M349 132 L345 124 L352 130 Z" fill="#1e1208" fillOpacity="0.78"/>
    <path d="M361 132 L365 124 L358 130 Z" fill="#1e1208" fillOpacity="0.78"/>
    <circle cx="352" cy="136" r="2" fill="#e8dfc8" fillOpacity="0.6"/>
    <circle cx="358" cy="136" r="2" fill="#e8dfc8" fillOpacity="0.6"/>
    {/* Tail up and curling thoughtfully */}
    <path d="M367 146 Q380 136 378 124 Q376 114 368 118" stroke="#1e1208" strokeWidth="3" fill="none" strokeLinecap="round" fillOpacity="0.78"/>
    {/* Tiny open book held in paw */}
    <rect x="362" y="136" width="12" height="9" rx="1" fill="#e8dfc8" fillOpacity="0.88" stroke="#c4a878" strokeWidth="0.8" transform="rotate(-15 368 140)"/>
    <line x1="362" y1="140" x2="374" y2="138" stroke="#c4a878" strokeWidth="0.6" opacity="0.5"/>
    {/* Walking legs */}
    <line x1="348" y1="158" x2="344" y2="166" stroke="#1e1208" strokeWidth="2.2" strokeLinecap="round" fillOpacity="0.78"/>
    <line x1="354" y1="159" x2="352" y2="168" stroke="#1e1208" strokeWidth="2.2" strokeLinecap="round" fillOpacity="0.78"/>
    <line x1="358" y1="159" x2="360" y2="168" stroke="#1e1208" strokeWidth="2.2" strokeLinecap="round" fillOpacity="0.78"/>
    <line x1="364" y1="157" x2="368" y2="165" stroke="#1e1208" strokeWidth="2.2" strokeLinecap="round" fillOpacity="0.78"/>

        </g>
      );
    case 16:
      return (
        <g fillOpacity="1">

    {/* DAY 16 – TEA HOUSE: thatched roof in northern hills, forest spirit peeking, matcha steam */}
    {/* Dappled light forest sky */}
    <rect width="480" height="170" fill="#3a5c32" fillOpacity="0.07"/>
    {/* Forest background */}
    {[0,24,48,72,96,120,144,168,192,216,240,264,288,312,336,360,384,408,432,456].map((x,i)=>(
      <rect key={i} x={x} y={0} width={i%3===0?20:i%3===1?16:12} height={170}
            fill={i%5===0?"#3a5c32":i%5===1?"#5c8050":i%5===2?"#4a7040":i%5===3?"#7a9e70":"#3a5c32"}
            fillOpacity={0.28+((i*7)%5)*0.06}/>
    ))}
    {/* Light shafts */}
    <path d="M160 0 L180 100" stroke="#e8a830" strokeWidth="20" fill="none" opacity="0.055"/>
    <path d="M280 0 L260 100" stroke="#e8a830" strokeWidth="14" fill="none" opacity="0.045"/>
    {/* Ground cover – ferns and moss */}
    <path d="M0 148 Q120 140 240 146 T480 148 L480 170 L0 170 Z" fill="#3a5c32" fillOpacity="0.35"/>
    {/* Tea house building */}
    <rect x="130" y="88" width="220" height="82" fill="#e8dfc8" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1.8"/>
    {/* Thatched roof – rough golden texture */}
    <path d="M112 88 Q240 62 368 88 L358 96 Q240 70 122 96 Z" fill="#c87e18" fillOpacity="0.7" stroke="#9c6c18" strokeWidth="1.5"/>
    <path d="M125 80 Q240 55 355 80 L348 88 Q240 62 132 88 Z" fill="#c87e18" fillOpacity="0.75" stroke="#9c6c18" strokeWidth="1.5"/>
    {/* Thatching detail strokes */}
    {[140,160,180,200,220,240,260,280,300,320,340].map((x,i)=>(
      <line key={i} x1={x} y1={80} x2={x+8} y2={88} stroke="#9c6c18" strokeWidth="0.8" opacity="0.4"/>
    ))}
    {/* Shoji screens */}
    <rect x="140" y="98"  width="22" height="32" fill="#f5edd8" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1"/>
    <line x1="151" y1="98"  x2="151" y2="130" stroke="#9c8340" strokeWidth="0.7"/>
    <line x1="140" y1="114" x2="162" y2="114" stroke="#9c8340" strokeWidth="0.7"/>
    <rect x="170" y="98"  width="22" height="32" fill="#f5edd8" fillOpacity="0.72" stroke="#9c8340" strokeWidth="1"/>
    <line x1="181" y1="98"  x2="181" y2="130" stroke="#9c8340" strokeWidth="0.7"/>
    <line x1="170" y1="114" x2="192" y2="114" stroke="#9c8340" strokeWidth="0.7"/>
    {/* Sliding door open – matcha table visible inside */}
    <rect x="215" y="98" width="38" height="32" fill="#c4a878" fillOpacity="0.4"/>
    {/* Matcha bowl on table inside */}
    <path d="M225 118 Q238 114 252 118 Q250 128 238 130 Q226 128 225 118 Z" fill="#5c8050" fillOpacity="0.7"/>
    <path className="steam-line"        d="M232 114 Q228 106 232 98" stroke="#a8b8a0" strokeWidth="2" fill="none" opacity="0.6"/>
    <path className="steam-line steam-2" d="M241 112 Q237 104 241 96" stroke="#a8b8a0" strokeWidth="1.5" fill="none" opacity="0.5"/>
    {/* Bamboo water spout */}
    <path d="M90 95 Q108 100 112 108" stroke="#9c7038" strokeWidth="3.5" fill="none" strokeLinecap="round"/>
    <path d="M112 108 Q118 118 112 122 Q106 118 108 112" stroke="#9c7038" strokeWidth="2" fill="#c4a878" fillOpacity="0.4"/>
    <path d="M112 122 Q108 132 112 136" stroke="#7aafcc" strokeWidth="1.5" fill="none" strokeDasharray="2 2"/>
    {/* FOREST SPIRIT peeking around the corner of the tea house */}
    <circle cx="128" cy="112" r="12" fill="white" fillOpacity="0.78" stroke="#c8bfa0" strokeWidth="1"/>
    <ellipse cx="128" cy="126" rx="8" ry="12" fill="white" fillOpacity="0.72" stroke="#c8bfa0" strokeWidth="1"/>
    <circle cx="124" cy="110" r="2.2" fill="#1e1208" fillOpacity="0.5"/>
    <circle cx="132" cy="110" r="2.2" fill="#1e1208" fillOpacity="0.5"/>
    <path d="M126 116 Q128 118 130 116" stroke="#c8bfa0" strokeWidth="0.8" fill="none"/>
    {/* Spirit tilting head curiously */}
    {/* Tiny hands peeking around corner */}
    <path d="M118 118 Q112 115 110 120 Q112 124 118 122" stroke="#c8bfa0" strokeWidth="1.5" fill="white" fillOpacity="0.65"/>
    {/* Fireflies */}
    <circle cx="60"  cy="95" r="2.5" fill="#e8a830" fillOpacity="0.72" className="float-item"/>
    <circle cx="425" cy="90" r="2"   fill="#e8a830" fillOpacity="0.62" className="float-item" style={{animationDelay:'1.1s'}}/>
    <circle cx="390" cy="108" r="2"  fill="#e8a830" fillOpacity="0.55" className="float-item" style={{animationDelay:'2s'}}/>
    {/* Moss-covered stones outside tea house */}
    <ellipse cx="365" cy="162" rx="18" ry="9" fill="#5c8050" fillOpacity="0.4"/>
    <ellipse cx="390" cy="158" rx="12" ry="6" fill="#5c8050" fillOpacity="0.35"/>

        </g>
      );
    case 17:
      return (
        <g fillOpacity="1">

    {/* DAY 17 – RETURN: shinkansen leaving Kyoto, tiny figure waving, tears as rain drops */}
    {/* Golden late afternoon sky */}
    <path d="M0 0 L480 0 L480 75 Q240 52 0 75 Z" fill="#e8a830" fillOpacity="0.18"/>
    {/* Kyoto hills receding (background) */}
    <path d="M0 82 L28 55 L50 68 L78 42 L102 58 L128 35 L155 52 L180 30 L208 48 L235 25 L262 44 L290 22 L318 40 L345 18 L375 36 L405 14 L435 32 L465 12 L480 22 L480 82 Z" fill="#7a4a88" fillOpacity="0.22"/>
    {/* Pagoda silhouette receding into distance */}
    {[[200,88],[195,76],[190,62],[185,46],[180,28]].map(([y,w],i)=>(
      <rect key={i} x={280-w/2} y={y-14} width={w} height={14} fill="#7a4a88" fillOpacity={0.25-i*0.03} stroke="#5c3868" strokeWidth={0.8-i*0.1}/>
    ))}
    {/* Speed landscape blur lines (train moving) */}
    <line x1="0" y1="95"  x2="480" y2="95"  stroke="#c8bfa0" strokeWidth="1.5" opacity="0.3"/>
    <line x1="0" y1="102" x2="480" y2="102" stroke="#c8bfa0" strokeWidth="1"   opacity="0.22"/>
    <line x1="0" y1="108" x2="480" y2="108" stroke="#c8bfa0" strokeWidth="0.8" opacity="0.18"/>
    {/* Rails */}
    <line x1="0" y1="147" x2="480" y2="147" stroke="#9c8340" strokeWidth="2"/>
    <line x1="0" y1="153" x2="480" y2="153" stroke="#9c8340" strokeWidth="2"/>
    {[18,48,78,108,138,168,198,228,258,288,318,348,378,408,438,468].map((x,i)=>(
      <line key={i} x1={x} y1="145" x2={x} y2="155" stroke="#8c6c30" strokeWidth="3"/>
    ))}
    {/* Shinkansen at speed, moving right */}
    <path d="M60 118 Q80 108 98 108 L390 108 L394 118 L394 142 L60 142 Z" fill="#f2e8d0" fillOpacity="0.94" stroke="#c4a878" strokeWidth="1.8"/>
    <rect x="60" y="124" width="334" height="5" fill="#7aafcc" fillOpacity="0.7"/>
    {[108,133,158,183,208,233,258,283,308,333,358].map((x,i)=>(
      <rect key={i} x={x} y="110" width="18" height="11" rx="2" fill="#7aafcc" fillOpacity="0.62" stroke="#c4a878" strokeWidth="0.8"/>
    ))}
    <path d="M60 118 Q52 124 48 131 Q48 141 58 142" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
    {/* Speed lines before the train */}
    <line x1="0" y1="120" x2="56" y2="120" stroke="#c8bfa0" strokeWidth="1.5" opacity="0.6"/>
    <line x1="0" y1="126" x2="48" y2="126" stroke="#c8bfa0" strokeWidth="1.2" opacity="0.5"/>
    <line x1="0" y1="130" x2="44" y2="130" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.4"/>
    {/* TINY FIGURE ON PLATFORM waving goodbye */}
    <line x1="418" y1="108" x2="418" y2="88" stroke="#5c4228" strokeWidth="1.5"/>
    <circle cx="418" cy="84" r="5.5" fill="#e8dfc8" stroke="#5c4228" strokeWidth="1"/>
    <line x1="418" y1="92" x2="412" y2="98" stroke="#5c4228" strokeWidth="1.2"/>
    <line x1="418" y1="92" x2="424" y2="98" stroke="#5c4228" strokeWidth="1.2"/>
    {/* Waving arm enthusiastically */}
    <line x1="418" y1="90" x2="408" y2="80" stroke="#5c4228" strokeWidth="1.5" strokeLinecap="round"/>
    <line x1="408" y1="80" x2="402" y2="74" stroke="#5c4228" strokeWidth="1.2" strokeLinecap="round"/>
    {/* Tears as little rain drops (3 drops) */}
    <path d="M414 86 Q412 90 414 93 Q416 90 414 86" fill="#7aafcc" fillOpacity="0.7"/>
    <path d="M410 88 Q408 93 410 96 Q412 93 410 88" fill="#7aafcc" fillOpacity="0.6"/>
    {/* ROKU Kyoto glimpsed receding left */}
    <rect x="10" y="88" width="45" height="55" fill="#e8dfc8" fillOpacity="0.42" stroke="#9c8340" strokeWidth="1.2"/>
    <path d="M0 88 Q32 74 55 88 L52 96 Q32 80 3 96 Z" fill="#5c4228" fillOpacity="0.65" stroke="#3a2010" strokeWidth="1.2"/>

        </g>
      );
    case 18:
      return (
        <g fillOpacity="1">

    {/* DAY 18 – DEPARTURE: Imperial moat at dawn, origami plane with crane companion, firefly farewell */}
    {/* Dawn sky – rose gold and pale blue */}
    <path d="M0 0 L480 0 L480 80 L0 80 Z" fill="#e8a830" fillOpacity="0.13"/>
    <path d="M0 0 L480 0 L480 55 Q240 35 0 55 Z" fill="#f5c0c0" fillOpacity="0.15"/>
    {/* Stars fading */}
    <circle cx="80"  cy="18" r="1.5" fill="#f5edd8" fillOpacity="0.55" className="float-item"/>
    <circle cx="195" cy="10" r="1"   fill="#f5edd8" fillOpacity="0.4"  className="float-item" style={{animationDelay:'0.8s'}}/>
    <circle cx="310" cy="14" r="1.5" fill="#f5edd8" fillOpacity="0.5"  className="float-item" style={{animationDelay:'1.6s'}}/>
    {/* Horizon glow */}
    <path d="M0 78 Q240 65 480 78" stroke="#e8a830" strokeWidth="8" fill="none" opacity="0.22"/>
    {/* Imperial moat water */}
    <path d="M0 100 Q120 92 240 98 T480 100 L480 140 L0 140 Z" fill="#7aafcc" fillOpacity="0.22"/>
    <path d="M0 100 Q120 92 240 98 T480 100" stroke="#7aafcc" strokeWidth="1.5" fill="none"/>
    {/* Moat shimmer */}
    <path d="M42 110 Q62 105 82 110"  stroke="white" strokeWidth="2.5" fill="none" opacity="0.42" strokeLinecap="round"/>
    <path d="M185 108 Q205 103 225 108" stroke="white" strokeWidth="2" fill="none" opacity="0.36" strokeLinecap="round"/>
    <path d="M340 110 Q360 105 380 110" stroke="white" strokeWidth="2" fill="none" opacity="0.32" strokeLinecap="round"/>
    {/* Tokyo skyline */}
    <path d="M0 100 L10 85 L20 92 L32 78 L45 86 L58 72 L70 82 L84 68 L96 78 L110 65 L125 75 L140 60 L155 70 L168 56 L185 66 L200 88 L480 88 L480 100 Z" fill="#c8bfa0" fillOpacity="0.45" stroke="#9c8340" strokeWidth="0.5"/>
    {/* Tokyo Tower silhouette small */}
    <line x1="68" y1="100" x2="68" y2="62" stroke="#b83020" strokeWidth="3.5" opacity="0.42"/>
    <line x1="60" y1="72"  x2="76" y2="72" stroke="#b83020" strokeWidth="2" opacity="0.35"/>
    <line x1="64" y1="80"  x2="72" y2="80" stroke="#b83020" strokeWidth="1.5" opacity="0.3"/>
    {/* Black pine trees along the moat */}
    {[12,30,50,68,428,448,462].map((x,i)=>(
      <g key={i}>
        <line x1={x} y1={140} x2={x} y2={78} stroke="#1e1208" strokeWidth={i<4?3:2.5} opacity="0.55"/>
        <circle cx={x} cy={76} r={i<4?12:10} fill="#1e1208" fillOpacity="0.42"/>
        <circle cx={x} cy={66} r={i<4?9:8}   fill="#1e1208" fillOpacity="0.35"/>
      </g>
    ))}
    {/* Granite moat walls */}
    <rect x="0" y="140" width="480" height="18" fill="#c8bfa0" fillOpacity="0.4"/>
    <line x1="0" y1="140" x2="480" y2="140" stroke="#9c8340" strokeWidth="2"/>
    {/* DEPARTURE PLANE ascending with arc */}
    <path d="M135 88 Q200 28 380 20" stroke="#c87e18" strokeWidth="1.8" strokeDasharray="7 4" fill="none"/>
    {/* Origami paper plane */}
    <path d="M368 28 L388 18 L376 36 L380 28 Z" fill="#f2e8d0" fillOpacity="0.88" stroke="#c4a878" strokeWidth="1.2"/>
    <path d="M380 28 L388 18 L382 24 Z" fill="#e8dfc8" fillOpacity="0.7"/>
    {/* ORIGAMI CRANE flying alongside */}
    <path d="M340 42 Q352 32 364 38" stroke="#b83020" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M352 32 L352 50 Q348 54 344 50" stroke="#b83020" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
    <path d="M352 50 Q356 54 360 50" stroke="#b83020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    <path d="M352 32 L348 26" stroke="#b83020" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
    {/* Contrail */}
    <path d="M368 28 Q320 38 270 50" stroke="white" strokeWidth="3.5" fill="none" opacity="0.45" strokeLinecap="round"/>
    {/* Farewell fireflies at the moat */}
    <circle cx="112" cy="122" r="3"   fill="#e8a830" fillOpacity="0.75" className="float-item"/>
    <circle cx="142" cy="115" r="2.5" fill="#e8a830" fillOpacity="0.65" className="float-item" style={{animationDelay:'0.6s'}}/>
    <circle cx="160" cy="125" r="2"   fill="#e8a830" fillOpacity="0.6"  className="float-item" style={{animationDelay:'1.3s'}}/>
    <circle cx="190" cy="118" r="2.5" fill="#e8a830" fillOpacity="0.55" className="float-item" style={{animationDelay:'2s'}}/>
    {/* Dawn reflection of plane arc in water */}
    <path d="M120 125 Q190 118 350 108" stroke="#c87e18" strokeWidth="1.2" strokeDasharray="4 4" fill="none" opacity="0.28"/>

        </g>
      );
    default: return null;
    }
  };
  return (
    <div style={{
      width: '100%',
      marginBottom: '24px',
      clear: 'both',
    }}>
      <svg
        viewBox="0 0 480 170"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          maskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 8%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 96% 92% at 50% 50%, black 8%, transparent 100%)',
        }}
      >
        {renderScene()}
      </svg>
    </div>
  );
};


const _vbMap: Record<number,string> = {
  1:"0 0 200 120",2:"0 0 200 200",3:"0 0 240 90",4:"0 0 200 200",
  5:"0 0 200 120",6:"0 0 130 220",7:"0 0 200 120",8:"0 0 200 120",
  9:"0 0 200 120",10:"0 0 200 160",11:"0 0 200 140",12:"0 0 200 160",
  13:"0 0 200 120",14:"0 0 200 120",15:"0 0 200 120",16:"0 0 200 160",
  17:"0 0 200 120",18:"0 0 200 120",
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ArtVignette: React.FC<{ day: number }> = ({ day }) => {
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

// Small per-type vignette SVG (floats right in each activity)
const _typeVignettePaths: Record<string, React.ReactNode> = {
  hotel: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Sky wash */}
      <rect x="0" y="0" width="200" height="120" fill="#7aafcc" fillOpacity="0.08"/>
      {/* Ground */}
      <path d="M0 105 L200 105 L200 120 L0 120 Z" fill="#c8bfa0" fillOpacity="0.35"/>
      {/* Garden stone path */}
      <ellipse cx="100" cy="110" rx="18" ry="5" fill="#c8bfa0" fillOpacity="0.5"/>
      <ellipse cx="72" cy="113" rx="10" ry="3" fill="#c8bfa0" fillOpacity="0.4"/>
      {/* Stone lantern */}
      <rect x="152" y="72" width="12" height="10" rx="1" fill="#e8dfc8" stroke="#9c8340" strokeWidth="1.5"/>
      <rect x="149" y="70" width="18" height="4" rx="1" fill="#c4a878" stroke="#9c8340" strokeWidth="1"/>
      <rect x="153" y="82" width="10" height="18" fill="#9c8340" fillOpacity="0.5"/>
      <ellipse cx="158" cy="77" rx="4" ry="3" fill="#e8a830" fillOpacity="0.5"/>
      {/* Main inn building */}
      <rect x="30" y="55" width="110" height="50" fill="#e8dfc8" fillOpacity="0.6" stroke="#9c8340" strokeWidth="1.8"/>
      {/* Shoji screens */}
      <rect x="38" y="62" width="18" height="28" fill="#f5edd8" fillOpacity="0.7" stroke="#9c8340" strokeWidth="1"/>
      <line x1="47" y1="62" x2="47" y2="90" stroke="#9c8340" strokeWidth="0.8"/>
      <line x1="38" y1="76" x2="56" y2="76" stroke="#9c8340" strokeWidth="0.8"/>
      <rect x="62" y="62" width="18" height="28" fill="#f5edd8" fillOpacity="0.7" stroke="#9c8340" strokeWidth="1"/>
      <line x1="71" y1="62" x2="71" y2="90" stroke="#9c8340" strokeWidth="0.8"/>
      <line x1="62" y1="76" x2="80" y2="76" stroke="#9c8340" strokeWidth="0.8"/>
      {/* Entrance door */}
      <rect x="94" y="72" width="22" height="33" rx="2" fill="#9c6c30" fillOpacity="0.6" stroke="#6b4010" strokeWidth="1.5"/>
      {/* Curved roof – lower */}
      <path d="M18 56 Q100 38 182 56 L175 62 Q100 44 25 62 Z" fill="#5c4228" fillOpacity="0.75" stroke="#3a2010" strokeWidth="1.5"/>
      {/* Curved roof – upper */}
      <path d="M42 40 Q100 25 158 40 L152 46 Q100 30 48 46 Z" fill="#5c4228" fillOpacity="0.8" stroke="#3a2010" strokeWidth="1.5"/>
      {/* Roof ridge ornament */}
      <path d="M96 25 Q100 18 104 25" stroke="#c4a878" strokeWidth="1.5" fill="none"/>
      {/* Pine tree left */}
      <line x1="16" y1="105" x2="16" y2="62" stroke="#3a5c32" strokeWidth="3"/>
      <path d="M4 75 L16 55 L28 75 Z" fill="#3a5c32" fillOpacity="0.6"/>
      <path d="M6 88 L16 70 L26 88 Z" fill="#3a5c32" fillOpacity="0.5"/>
      {/* Steam from bath */}
      <path d="M118 50 Q114 40 119 32" stroke="#a8b8a0" strokeWidth="1.5" fill="none" opacity="0.5" className="steam-line"/>
      <path d="M128 52 Q124 42 129 34" stroke="#a8b8a0" strokeWidth="1.2" fill="none" opacity="0.4" className="steam-line" style={{animationDelay:'0.8s'}}/>
    </g>
  ),

  restaurant: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Misty background */}
      <path d="M0 78 L22 62 L44 72 L70 54 L95 66 L130 50 L165 62 L200 55 L200 80 L0 80 Z" fill="#c8bfa0" fillOpacity="0.25"/>
      {/* Bowl shadow */}
      <ellipse cx="100" cy="116" rx="55" ry="7" fill="#c8bfa0" fillOpacity="0.25"/>
      {/* Bowl body */}
      <path d="M40 80 C38 108 162 108 160 80 L153 68 C132 90 68 90 47 68 Z" fill="#e8dfc8" stroke="#9c8340" strokeWidth="2"/>
      {/* Bowl rim */}
      <ellipse cx="100" cy="68" rx="53" ry="14" fill="#ddd4bc" stroke="#9c8340" strokeWidth="2"/>
      {/* Broth */}
      <ellipse cx="100" cy="66" rx="46" ry="10" fill="#c87e18" fillOpacity="0.22"/>
      {/* Noodle wisps */}
      <path d="M66 63 Q80 57 96 62 T120 59" stroke="#e0d4bc" strokeWidth="2" fill="none"/>
      <path d="M68 68 Q84 62 100 67 T128 64" stroke="#e0d4bc" strokeWidth="1.6" fill="none"/>
      {/* Soft-boiled egg */}
      <circle cx="82" cy="61" r="10" fill="#f5edd8" stroke="#9c8340" strokeWidth="1.4"/>
      <circle cx="82" cy="61" r="5.5" fill="#c87e18" fillOpacity="0.7"/>
      {/* Nori */}
      <rect x="108" y="54" width="10" height="20" rx="1" fill="#3a5c32" fillOpacity="0.75" transform="rotate(-8 113 64)"/>
      {/* Scallion dots */}
      <circle cx="120" cy="70" r="2.5" fill="#5c8050"/>
      <circle cx="126" cy="67" r="2" fill="#5c8050"/>
      {/* Chopsticks */}
      <line x1="52" y1="28" x2="96" y2="72" stroke="#9c6c30" strokeWidth="3" strokeLinecap="round"/>
      <line x1="63" y1="25" x2="106" y2="68" stroke="#9c6c30" strokeWidth="3" strokeLinecap="round"/>
      {/* Steam */}
      <path d="M76 54 Q71 40 78 28 T72 16" stroke="#a8b8a0" strokeWidth="2" fill="none" className="steam-line"/>
      <path d="M100 52 Q95 38 102 26 T96 14" stroke="#a8b8a0" strokeWidth="2" fill="none" className="steam-line" style={{animationDelay:'0.8s'}}/>
      <path d="M122 54 Q117 40 124 28" stroke="#a8b8a0" strokeWidth="1.5" fill="none" className="steam-line" style={{animationDelay:'1.5s'}}/>
    </g>
  ),

  museum: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Sky */}
      <path d="M0 0 L200 0 L200 60 L0 60 Z" fill="#7aafcc" fillOpacity="0.1"/>
      {/* Distant mountains */}
      <path d="M0 65 L35 40 L58 56 L85 32 L112 50 L142 28 L168 46 L200 35 L200 65 Z" fill="#c8bfa0" fillOpacity="0.3"/>
      {/* Torii gate - pillars */}
      <rect x="55" y="48" width="14" height="72" rx="3" fill="#b83020" fillOpacity="0.85" stroke="#8c1e10" strokeWidth="1.5"/>
      <rect x="131" y="48" width="14" height="72" rx="3" fill="#b83020" fillOpacity="0.85" stroke="#8c1e10" strokeWidth="1.5"/>
      {/* Torii – top kasagi (curved) */}
      <path d="M40 48 Q100 34 160 48 L158 58 Q100 42 42 58 Z" fill="#b83020" fillOpacity="0.9" stroke="#8c1e10" strokeWidth="1.5"/>
      {/* Torii – lower nuki bar */}
      <rect x="55" y="66" width="90" height="9" rx="1" fill="#b83020" fillOpacity="0.75" stroke="#8c1e10" strokeWidth="1"/>
      {/* Shimenawa rope */}
      <path d="M55 54 Q100 60 145 54" stroke="#e8dfc8" strokeWidth="2.5" fill="none" strokeDasharray="4 3"/>
      {/* Stone path */}
      <rect x="88" y="110" width="14" height="10" rx="1" fill="#c8bfa0" fillOpacity="0.5"/>
      <rect x="93" y="100" width="14" height="10" rx="1" fill="#c8bfa0" fillOpacity="0.4"/>
      <rect x="88" y="90" width="14" height="10" rx="1" fill="#c8bfa0" fillOpacity="0.5"/>
      {/* Cedar trees */}
      <line x1="22" y1="120" x2="22" y2="62" stroke="#3a5c32" strokeWidth="4"/>
      <path d="M8 78 L22 55 L36 78 Z" fill="#3a5c32" fillOpacity="0.65"/>
      <path d="M10 95 L22 75 L34 95 Z" fill="#3a5c32" fillOpacity="0.55"/>
      <line x1="178" y1="120" x2="178" y2="62" stroke="#3a5c32" strokeWidth="4"/>
      <path d="M164 78 L178 55 L192 78 Z" fill="#3a5c32" fillOpacity="0.65"/>
      <path d="M166 95 L178 75 L190 95 Z" fill="#3a5c32" fillOpacity="0.55"/>
    </g>
  ),

  shop: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Background fade */}
      <rect x="0" y="0" width="200" height="120" fill="#c87e18" fillOpacity="0.04"/>
      {/* Ground */}
      <path d="M0 108 L200 108 L200 120 L0 120 Z" fill="#c8bfa0" fillOpacity="0.3"/>
      {/* Main shop building */}
      <rect x="28" y="42" width="144" height="66" fill="#e8dfc8" fillOpacity="0.55" stroke="#9c8340" strokeWidth="2"/>
      {/* Roof */}
      <path d="M14 44 Q100 28 186 44 L180 52 Q100 36 20 52 Z" fill="#5c4228" fillOpacity="0.78" stroke="#3a2010" strokeWidth="1.5"/>
      {/* Noren curtain strips */}
      <rect x="68" y="52" width="14" height="30" rx="2" fill="#b83020" fillOpacity="0.75"/>
      <rect x="86" y="52" width="14" height="26" rx="2" fill="#b83020" fillOpacity="0.65"/>
      <rect x="104" y="52" width="14" height="30" rx="2" fill="#b83020" fillOpacity="0.75"/>
      <rect x="122" y="52" width="14" height="26" rx="2" fill="#b83020" fillOpacity="0.65"/>
      <line x1="60" y1="52" x2="148" y2="52" stroke="#6b4010" strokeWidth="2"/>
      {/* Display shelf left */}
      <rect x="32" y="66" width="32" height="22" rx="2" fill="#ddd4bc" fillOpacity="0.6" stroke="#9c8340" strokeWidth="1"/>
      <circle cx="42" cy="76" r="6" fill="#c87e18" fillOpacity="0.4" stroke="#9c8340" strokeWidth="1"/>
      <circle cx="56" cy="73" r="5" fill="#7aafcc" fillOpacity="0.4" stroke="#9c8340" strokeWidth="1"/>
      {/* Display shelf right */}
      <rect x="138" y="66" width="32" height="22" rx="2" fill="#ddd4bc" fillOpacity="0.6" stroke="#9c8340" strokeWidth="1"/>
      <rect x="142" y="70" width="10" height="14" rx="1" fill="#9c6c30" fillOpacity="0.5"/>
      <rect x="155" y="72" width="10" height="12" rx="1" fill="#9c6c30" fillOpacity="0.4"/>
      {/* Hanging lantern */}
      <line x1="100" y1="28" x2="100" y2="40" stroke="#9c8340" strokeWidth="1.5"/>
      <ellipse cx="100" cy="46" rx="10" ry="14" fill="#c87e18" fillOpacity="0.7" stroke="#9c8340" strokeWidth="1.5"/>
      <ellipse cx="100" cy="38" rx="10" ry="4" fill="#e8a830" fillOpacity="0.5" stroke="#9c8340" strokeWidth="1"/>
      <line x1="100" y1="60" x2="100" y2="65" stroke="#9c8340" strokeWidth="1.2"/>
    </g>
  ),

  transit: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Sky */}
      <path d="M0 0 L200 0 L200 72 L0 72 Z" fill="#e8dfc8" fillOpacity="0.3"/>
      {/* Mountain Fuji */}
      <path d="M5 108 L100 16 L195 108 Z" fill="#e8dfc8" fillOpacity="0.65" stroke="#9c8340" strokeWidth="1.5"/>
      <path d="M82 40 L100 16 L118 40 Z" fill="white" fillOpacity="0.85"/>
      {/* Cloud layer */}
      <path d="M0 68 Q40 58 80 68 T160 65 T200 68" stroke="#e8e0d0" strokeWidth="7" fill="none" opacity="0.45"/>
      {/* Rails */}
      <line x1="0" y1="112" x2="200" y2="112" stroke="#9c8340" strokeWidth="2.5"/>
      <line x1="0" y1="118" x2="200" y2="118" stroke="#9c8340" strokeWidth="2.5"/>
      {/* Sleepers */}
      {[15,40,65,90,115,140,165,190].map((x, i) => (
        <line key={i} x1={x} y1="110" x2={x} y2="120" stroke="#8c6c30" strokeWidth="3.5"/>
      ))}
      {/* Train body */}
      <path d="M25 78 Q44 68 58 68 L194 68 L198 78 L198 108 L25 108 Z" fill="#f2e8d0" fillOpacity="0.92" stroke="#c4a878" strokeWidth="1.8"/>
      {/* Blue stripe */}
      <rect x="25" y="86" width="173" height="5.5" fill="#7aafcc" fillOpacity="0.7"/>
      {/* Windows */}
      {[64,88,112,136,160].map((x, i) => (
        <rect key={i} x={x} y="71" width="18" height="11" rx="2" fill="#7aafcc" fillOpacity="0.6" stroke="#c4a878" strokeWidth="0.8"/>
      ))}
      {/* Nose */}
      <path d="M25 78 Q17 84 14 91 Q14 102 23 108" stroke="#c4a878" strokeWidth="1.8" fill="none"/>
      {/* Overhead wire */}
      <line x1="0" y1="60" x2="200" y2="56" stroke="#9c8340" strokeWidth="0.8"/>
      <line x1="44" y1="68" x2="44" y2="60" stroke="#9c8340" strokeWidth="0.8"/>
      <line x1="104" y1="68" x2="104" y2="58" stroke="#9c8340" strokeWidth="0.8"/>
      <line x1="164" y1="68" x2="164" y2="58" stroke="#9c8340" strokeWidth="0.8"/>
      {/* Speed lines */}
      <line x1="0" y1="82" x2="22" y2="82" stroke="#c8bfa0" strokeWidth="1.2" opacity="0.5"/>
      <line x1="0" y1="87" x2="18" y2="87" stroke="#c8bfa0" strokeWidth="0.9" opacity="0.4"/>
    </g>
  ),

  nature: (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {/* Sky */}
      <path d="M0 0 L200 0 L200 60 L0 60 Z" fill="#7aafcc" fillOpacity="0.14"/>
      {/* Sun */}
      <circle cx="158" cy="30" r="16" fill="#e8a830" fillOpacity="0.25"/>
      <circle cx="158" cy="30" r="10" fill="#e8a830" fillOpacity="0.2"/>
      {/* Distant mountains */}
      <path d="M0 62 L28 38 L52 54 L80 30 L106 48 L138 26 L162 44 L200 35 L200 62 Z" fill="#a8bcaa" fillOpacity="0.42" stroke="#9c8340" strokeWidth="0.8"/>
      {/* Lake surface */}
      <path d="M0 65 Q100 58 200 65 L200 120 L0 120 Z" fill="#7aafcc" fillOpacity="0.22"/>
      {/* Water reflection lines */}
      <path d="M0 72 Q50 67 100 72 T200 70" stroke="#7aafcc" strokeWidth="1.2" fill="none"/>
      <path d="M0 82 Q50 77 100 82 T200 80" stroke="#7aafcc" strokeWidth="0.8" fill="none"/>
      {/* Light shimmer */}
      <path d="M36 76 Q56 71 76 76" stroke="white" strokeWidth="2.5" fill="none" opacity="0.45" strokeLinecap="round"/>
      <path d="M118 80 Q136 75 152 80" stroke="white" strokeWidth="2" fill="none" opacity="0.38" strokeLinecap="round"/>
      {/* Cherry blossom tree left */}
      <line x1="24" y1="120" x2="24" y2="55" stroke="#5c4228" strokeWidth="3.5"/>
      <line x1="24" y1="72" x2="10" y2="58" stroke="#5c4228" strokeWidth="2.5"/>
      <line x1="24" y1="66" x2="36" y2="54" stroke="#5c4228" strokeWidth="2.5"/>
      <circle cx="14" cy="54" r="16" fill="#e8a830" fillOpacity="0.18"/>
      <circle cx="30" cy="48" r="14" fill="#b83020" fillOpacity="0.15"/>
      <circle cx="24" cy="56" r="12" fill="#c84838" fillOpacity="0.18"/>
      {/* Petals */}
      <circle cx="8" cy="50" r="3" fill="#f5c0c0" fillOpacity="0.7"/>
      <circle cx="18" cy="44" r="3" fill="#f5c0c0" fillOpacity="0.6"/>
      <circle cx="34" cy="46" r="2.5" fill="#f5c0c0" fillOpacity="0.6"/>
      {/* Reed grasses right */}
      <line x1="170" y1="120" x2="170" y2="72" stroke="#5c8050" strokeWidth="2.5"/>
      <line x1="178" y1="118" x2="178" y2="68" stroke="#3a5c32" strokeWidth="3"/>
      <line x1="186" y1="120" x2="186" y2="74" stroke="#5c8050" strokeWidth="2"/>
      <ellipse cx="170" cy="70" rx="3.5" ry="9" fill="#8c6c30" fillOpacity="0.65"/>
      <ellipse cx="178" cy="66" rx="4" ry="10" fill="#8c6c30" fillOpacity="0.7"/>
      <ellipse cx="186" cy="72" rx="3" ry="9" fill="#8c6c30" fillOpacity="0.6"/>
      {/* Floating firefly */}
      <circle cx="95" cy="45" r="2.5" fill="#e8a830" fillOpacity="0.7" className="float-item"/>
      <circle cx="110" cy="38" r="2" fill="#e8a830" fillOpacity="0.5" className="float-item" style={{animationDelay:'1.2s'}}/>
    </g>
  ),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _ActivityTypeVignette: React.FC<{ type: string }> = ({ type }) => (
  <svg className="activity-vignette" viewBox="0 0 200 120">
    {_typeVignettePaths[type] ?? _typeVignettePaths.museum}
  </svg>
);

const ActivityItem: React.FC<{ activity: any; index: number }> = ({ activity, index }) => {
  const { activeDay, editMode, userEdits, updateActivityEdit, selectedActivity, selectActivity } = useStore();
  const dayHaikus = haikus[activeDay] || [];
  const savedKey = `${activeDay}_${index}`;
  const isSelected = selectedActivity?.key === savedKey;
  const editedTitle = userEdits.activities[savedKey]?.title;
  const editedDesc = userEdits.activities[savedKey]?.description;
  const displayTitle = editedTitle !== undefined ? editedTitle : activity.title;
  const displayHaiku = editedDesc !== undefined ? editedDesc : (dayHaikus[index] || "");

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${activity.lat},${activity.lng}`;

  return (
    <div
      className="timeline-item"
      style={{
        cursor: editMode ? 'default' : 'pointer',
        borderLeft: isSelected ? '3px solid var(--rc)' : '3px solid transparent',
        background: isSelected ? 'rgba(0,0,0,0.04)' : undefined,
        transition: 'border-left 0.2s, background 0.2s',
        paddingLeft: '12px',
      }}
      onClick={() => { if (!editMode) selectActivity(savedKey, activity.lat, activity.lng); }}
    >
      <span className="timeline-bullet" style={{ color: isSelected ? 'var(--rc)' : undefined }}>
        {isSelected ? '✦' : '🌿'}
      </span>
      <span className="timeline-time">{activity.time}</span>
      <h3
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={(e) => updateActivityEdit(activeDay, index, 'title', e.currentTarget.innerText)}
        className="timeline-title focus:outline-none"
        style={{ color: isSelected ? 'var(--rc)' : undefined }}
      >
        {displayTitle}
      </h3>
      <p
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={(e) => updateActivityEdit(activeDay, index, 'description', e.currentTarget.innerText)}
        className="timeline-desc focus:outline-none"
      >
        {displayHaiku}
      </p>
      {!editMode && (
        <a href={navUrl} target="_blank" rel="noopener noreferrer" className="navigate-btn"
          onClick={e => e.stopPropagation()}>
          ↗ Navigate
        </a>
      )}
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

// Document uploader (per day, base64 in localStorage)
const DocUploader: React.FC<{ dayId: number }> = ({ dayId }) => {
  const { documents, addDocument, removeDocument } = useStore();
  const docs = documents[dayId] || [];
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        addDocument(dayId, { name: file.name, b64: reader.result as string, mime: file.type });
      };
      reader.readAsDataURL(file);
    });
  };

  const openDoc = (doc: { b64: string; mime: string; name: string }) => {
    const win = window.open();
    if (!win) return;
    if (doc.mime === 'application/pdf') {
      win.document.write(`<iframe src="${doc.b64}" style="width:100%;height:100vh;border:none"/>`);
    } else {
      win.document.write(`<img src="${doc.b64}" style="max-width:100%"/>`);
    }
  };

  return (
    <div style={{ marginTop: '16px' }}>
      <h5 style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--rc)', marginBottom: '10px' }}>
        📎 Documents & Confirmations
      </h5>
      <input ref={inputRef} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple style={{ display: 'none' }}
        onChange={e => handleFiles(e.target.files)} />
      <button className="doc-upload-btn" onClick={() => inputRef.current?.click()}>
        + Upload PDF or image
      </button>
      {docs.length > 0 && (
        <div className="doc-list">
          {docs.map((doc, idx) => (
            <div key={idx} className="doc-item">
              <span className="doc-item-name">📄 {doc.name}</span>
              <div className="doc-item-actions">
                <button className="doc-item-btn doc-item-view" onClick={() => openDoc(doc)}>View</button>
                <button className="doc-item-btn doc-item-del" onClick={() => removeDocument(dayId, idx)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Full-day card modal (slide-up drawer)
// ── Day schedule timeline ─────────────────────────────────────────────────
function parseTimeHours(str: string): number {
  if (!str) return 12;
  const lower = str.toLowerCase();
  if (lower.includes('afternoon') || lower.includes('transit baseline')) return 13.5;
  if (lower.includes('morning') || lower.includes('home base')) return 8;
  if (lower.includes('evening') || lower.includes('return')) return 21;
  const m = str.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!m) return 12;
  let h = parseInt(m[1]);
  const min = parseInt(m[2]);
  const period = m[3].toUpperCase();
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return h + min / 60;
}

const TYPE_COLORS: Record<string, string> = {
  hotel:'#c03828', restaurant:'#c87e18', museum:'#5878a0',
  shop:'#4a7848', transit:'#388888', nature:'#5c8050',
};

const ReservationsPanel: React.FC = () => {
  const { activeDay, reservations, updateReservation } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);
  const res = reservations[activeDay] || {};

  const handleField = (field: string, val: string) =>
    updateReservation(activeDay, { [field]: val });

  const addBooking = () =>
    updateReservation(activeDay, {
      restaurantBookings: [...(res.restaurantBookings || []), { name: '', time: '', notes: '' }]
    });

  const updateBooking = (idx: number, key: string, val: string) => {
    const list = [...(res.restaurantBookings || [])];
    (list[idx] as any)[key] = val;
    updateReservation(activeDay, { restaurantBookings: list });
  };

  const removeBooking = (idx: number) =>
    updateReservation(activeDay, {
      restaurantBookings: (res.restaurantBookings || []).filter((_, i) => i !== idx)
    });

  const fieldStyle = { backgroundColor: '#f2e8d0', border: '1px solid #cdbf9c', padding: '7px 10px', borderRadius: '4px', outline: 'none', fontFamily: 'var(--font-body)', fontSize: '0.88rem', width: '100%' };

  return (
    <div style={{ marginTop: '32px', border: '1px solid var(--paper-fold)', borderRadius: '6px', background: 'rgba(230,216,190,0.3)' }}>
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-display)', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--ink-fade)', border: 'none', background: 'transparent', cursor: 'pointer' }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BookOpen style={{ width: '15px', height: '15px' }} /> Bookings & Documents
        </span>
        {isOpen ? <ChevronUp style={{ width: '15px', height: '15px' }} /> : <ChevronDown style={{ width: '15px', height: '15px' }} />}
      </button>

      {isOpen && (
        <div style={{ padding: '16px', borderTop: '1px solid var(--paper-fold)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--rc)', marginBottom: '10px' }}>🏨 Hotel / Ryokan</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <input placeholder="Confirmation #" value={res.hotelConfirmation || ''} onChange={e => handleField('hotelConfirmation', e.target.value)} style={fieldStyle} />
              <input placeholder="Check-in time"  value={res.hotelCheckIn    || ''} onChange={e => handleField('hotelCheckIn',    e.target.value)} style={fieldStyle} />
              <input placeholder="Address"        value={res.hotelAddress    || ''} onChange={e => handleField('hotelAddress',    e.target.value)} style={{...fieldStyle, gridColumn:'1/-1'}} />
              <input placeholder="Phone"          value={res.hotelPhone      || ''} onChange={e => handleField('hotelPhone',      e.target.value)} style={fieldStyle} />
              <input placeholder="Transport ref"  value={res.transportRef    || ''} onChange={e => handleField('transportRef',    e.target.value)} style={fieldStyle} />
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.68rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: 'var(--rc)' }}>🍽 Restaurant Bookings</p>
              <button onClick={addBooking} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--rc)', fontFamily: 'var(--font-display)' }}>
                <Plus style={{ width: '13px', height: '13px' }} /> Add
              </button>
            </div>
            {(res.restaurantBookings || []).map((b, i) => (
              <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '6px', alignItems: 'center' }}>
                <input placeholder="Name" value={b.name}  onChange={e => updateBooking(i,'name', e.target.value)} style={{...fieldStyle, width:'35%'}} />
                <input placeholder="Time" value={b.time}  onChange={e => updateBooking(i,'time', e.target.value)} style={{...fieldStyle, width:'20%'}} />
                <input placeholder="Notes"value={b.notes} onChange={e => updateBooking(i,'notes',e.target.value)} style={{...fieldStyle, flex:1}} />
                <button onClick={() => removeBooking(i)} style={{ border:'none', background:'none', cursor:'pointer', color:'var(--ghibli-red)', padding:'4px', flexShrink:0 }}>
                  <Trash style={{ width:'14px', height:'14px' }} />
                </button>
              </div>
            ))}
          </div>

          <DocUploader dayId={activeDay} />
        </div>
      )}
    </div>
  );
};

const DayScheduleTimeline: React.FC<{ day: number; color: string; compact?: boolean }> = ({ day, color, compact }) => {
  const acts = activities[day] || [];
  const hotel = hotelAnchors[day];

  type Stop = { title: string; type: string; h: number };
  const stops: Stop[] = [];
  if (hotel) stops.push({ title: hotel.name, type: 'hotel', h: 8 });
  acts.forEach(a => stops.push({ title: a.title, type: a.type, h: parseTimeHours(a.time) }));
  if (hotel?.loop) stops.push({ title: hotel.name, type: 'hotel', h: 22 });
  stops.sort((a, b) => a.h - b.h);

  const DAY_START = 7, DAY_END = 23, SPAN = DAY_END - DAY_START;
  const pct = (h: number) => Math.min(100, Math.max(0, ((h - DAY_START) / SPAN) * 100));

  // Pace metric: total "active" hours (sum of gaps ≤ 3h between activities)
  const busySlots = stops.length - 1;
  const pace = busySlots >= 4 ? 'packed' : busySlots >= 2 ? 'active' : 'relaxed';
  const paceLabel = { packed: '⚡ Packed', active: '◈ Active', relaxed: '〜 Leisurely' }[pace];
  const paceColor = { packed: '#b84428', active: '#c87e18', relaxed: '#4a7848' }[pace];

  const axisHours = compact ? [8, 12, 17, 21] : [7, 9, 12, 15, 18, 21, 23];
  const fmtH = (h: number) => h === 12 ? '12pm' : h < 12 ? `${h}am` : `${h - 12}pm`;

  const trackH = compact ? 36 : 52;
  const dotR = compact ? 7 : 9;
  const labelOffset = compact ? 16 : 22;

  return (
    <div style={{ userSelect: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: compact ? '8px' : '12px' }}>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.65rem', letterSpacing: '2.5px', textTransform: 'uppercase', color, opacity: 0.8 }}>
          Day at a Glance
        </span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: compact ? '0.68rem' : '0.75rem', fontWeight: 700, color: paceColor }}>
          {paceLabel}
        </span>
      </div>

      {/* Timeline track */}
      <div style={{ position: 'relative', height: `${trackH}px`, marginBottom: '18px' }}>
        {/* Base track */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: `${trackH / 2 - 2}px`, height: '4px',
          background: 'var(--paper-fold)', borderRadius: '2px',
        }}/>

        {/* Gap fills — darker = tighter schedule */}
        {stops.slice(0, -1).map((s, i) => {
          const x1 = pct(s.h), x2 = pct(stops[i + 1].h);
          const gap = stops[i + 1].h - s.h;
          const opacity = gap <= 1.5 ? 0.55 : gap <= 3 ? 0.28 : 0.1;
          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${x1}%`, width: `${Math.max(0, x2 - x1)}%`,
              top: `${trackH / 2 - 4}px`, height: '8px',
              background: color, opacity, borderRadius: '2px',
              transition: 'opacity 0.3s',
            }}/>
          );
        })}

        {/* Activity markers */}
        {stops.map((s, i) => {
          const x = pct(s.h);
          const tc = TYPE_COLORS[s.type] || color;
          const above = i % 2 === 0;
          const shortTitle = s.title.split(/[\s,·]/)[0];
          return (
            <div key={i} style={{ position: 'absolute', left: `${x}%`, transform: 'translateX(-50%)' }}>
              {/* Dot */}
              <div style={{
                width: `${dotR * 2}px`, height: `${dotR * 2}px`,
                borderRadius: '50%', background: tc,
                border: '2.5px solid var(--paper)',
                position: 'absolute',
                top: `${trackH / 2 - dotR}px`,
                left: `-${dotR}px`,
                boxShadow: '0 1px 5px rgba(0,0,0,0.22)',
              }}/>
              {/* Label */}
              {!compact && (
                <div style={{
                  position: 'absolute',
                  top: above ? `${trackH / 2 - dotR - labelOffset}px` : `${trackH / 2 + dotR + 4}px`,
                  left: '-28px', width: '56px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-display)',
                  fontSize: '0.6rem', fontWeight: 600,
                  color: tc, lineHeight: 1.2,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {shortTitle}
                </div>
              )}
              {/* Tick */}
              <div style={{
                position: 'absolute',
                left: '-1px', width: '2px',
                top: above
                  ? `${trackH / 2 - dotR - 4}px`
                  : `${trackH / 2 + dotR}px`,
                height: '4px',
                background: tc, opacity: 0.5,
              }}/>
            </div>
          );
        })}
      </div>

      {/* Hour axis */}
      <div style={{ position: 'relative', height: '14px' }}>
        {axisHours.map(h => (
          <span key={h} style={{
            position: 'absolute',
            left: `${pct(h)}%`, transform: 'translateX(-50%)',
            fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
            color: 'var(--ink-light)', opacity: 0.6,
          }}>
            {fmtH(h)}
          </span>
        ))}
      </div>
    </div>
  );
};

const JournalPane: React.FC = () => {
  const { activeDay } = useStore();
  const region = regionMap[activeDay];
  const color = regionColors[region];
  const metadata = dayMeta[activeDay];

  const elements: React.ReactNode[] = [];
  (activities[activeDay] || []).forEach((act, idx) => {
    elements.push(<ActivityItem key={idx} activity={act} index={idx} />);
  });

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

        {/* Compact schedule timeline */}
        <div style={{ padding: '14px 16px 10px', background: 'rgba(0,0,0,0.025)', borderRadius: '5px', border: '1px solid var(--paper-fold)' }}>
          <DayScheduleTimeline day={activeDay} color={color} />
        </div>

        <DayMasterVignette day={activeDay} />
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
  const { selectedActivity } = useStore();
  const [markerData, setMarkerData] = useState<Array<{ marker: any; iw: any; lat: number; lng: number }>>([]);
  const [polyline, setPolyline] = useState<any>(null);
  const openIwRef = React.useRef<any>(null);

  // Rebuild markers when day changes
  useEffect(() => {
    if (!googleMap) return;
    const google = (window as any).google;
    if (!google) return;

    markerData.forEach(({ marker }) => marker.setMap(null));
    if (polyline) polyline.setMap(null);
    if (openIwRef.current) { openIwRef.current.close(); openIwRef.current = null; }

    const dayActs = activities[activeDay] || [];
    const hotel = hotelAnchors[activeDay];
    const pathCoordinates: any[] = [];
    const bounds = new google.maps.LatLngBounds();
    const newMarkerData: typeof markerData = [];

    const addPin = (loc: { lat: number; lng: number }, title: string, type: string, color: string) => {
      bounds.extend(loc);
      pathCoordinates.push(loc);
      const marker = new google.maps.Marker({
        position: loc, map: googleMap, title,
        icon: { url: getPinIconUrl(type, color), scaledSize: new google.maps.Size(32, 32) }
      });
      const iw = new google.maps.InfoWindow({ content: `<div style="font-family:serif;font-size:13px;padding:2px 4px"><strong>${title}</strong></div>` });
      marker.addListener('click', () => {
        if (openIwRef.current) openIwRef.current.close();
        iw.open(googleMap, marker);
        openIwRef.current = iw;
      });
      newMarkerData.push({ marker, iw, lat: loc.lat, lng: loc.lng });
    };

    if (hotel) addPin({ lat: hotel.lat, lng: hotel.lng }, hotel.name, 'hotel', '#b83020');
    dayActs.forEach(act => addPin({ lat: act.lat, lng: act.lng }, act.title, act.type, '#c87e18'));
    if (hotel && hotel.loop) pathCoordinates.push({ lat: hotel.lat, lng: hotel.lng });

    setMarkerData(newMarkerData);

    if (pathCoordinates.length > 1) {
      const newPolyline = new google.maps.Polyline({
        path: pathCoordinates, strokeOpacity: 0,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 3, strokeColor: '#c87e18' }, offset: '0', repeat: '15px' }],
        map: googleMap
      });
      setPolyline(newPolyline);
    }
    if (pathCoordinates.length > 0) googleMap.fitBounds(bounds, 50);
  }, [activeDay, googleMap]);

  // Focus marker when selectedActivity changes
  useEffect(() => {
    if (!googleMap || !selectedActivity) return;
    const google = (window as any).google;
    if (!google) return;

    const { lat, lng } = selectedActivity;
    googleMap.panTo({ lat, lng });
    googleMap.setZoom(16);

    if (openIwRef.current) { openIwRef.current.close(); openIwRef.current = null; }

    markerData.forEach(({ marker, iw, lat: mLat, lng: mLng }) => {
      if (Math.abs(mLat - lat) < 0.002 && Math.abs(mLng - lng) < 0.002) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(() => marker.setAnimation(null), 1400);
        iw.open(googleMap, marker);
        openIwRef.current = iw;
      }
    });
  }, [selectedActivity]);

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
    <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_KEY}>
      <div className="app-container">
        <AmbientLayer />
        <Header />
        <DayNav />
        {/* region groups now shown in DayNav */}
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
