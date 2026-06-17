import { useState, useEffect } from 'react';

// ============================================================================
//   1. TRIP CONFIGURATION (Change your month, year, and start date here!)
// ============================================================================
const TRIP_MONTH = "April"; // Change to "May", "September", "December", etc.
const TRIP_YEAR = "2027";
const START_DAY = 1;      // First day of your trip

// Helper function to calculate calendar dates based on start date
const getCalendarDate = (dayOffset: number): string => {
  const currentDay = START_DAY + dayOffset;
  // Simple ordinal suffix helper (1st, 2nd, 3rd, 4th...)
  const j = currentDay % 10;
  const k = currentDay % 100;
  if (j === 1 && k !== 11) return `${TRIP_MONTH} ${currentDay}st`;
  if (j === 2 && k !== 12) return `${TRIP_MONTH} ${currentDay}nd`;
  if (j === 3 && k !== 13) return `${TRIP_MONTH} ${currentDay}rd`;
  return `${TRIP_MONTH} ${currentDay}th`;
};

// ============================================================================
//   2. TYPES FOR STRICT TS COMPILATION
// ============================================================================
interface Activity {
  time: string;
  title: string;
  detail: string;
}

interface Meal {
  type: string;
  place: string;
  item: string;
}

interface Transport {
  type: string;
  detail: string;
}

interface DocumentItem {
  name: string;
  id: string;
  qrCodeUrl: string;
}

interface TripDay {
  dayNumber: number;
  title: string;
  date: string;
  activities: Activity[];
  meals: Meal[];
  transport: Transport[];
  notes: string;
  documents: DocumentItem[];
}

interface SketchInstance {
  id: number;
  index: number;
  x: string;
  y: string;
  scale: number;
  rotation: number;
  opacity: number;
}

// ============================================================================
//   3. GHIBLI MARGIN ARTWORK POOL
// ============================================================================
const GHIBLI_SKETCHES = [
  // Autumn Maple Leaf
  <svg key="maple" viewBox="0 0 120 120" className="w-full h-full">
    <defs>
      <linearGradient id="mapleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#bf5a37" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#d98236" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#8c331b" stopOpacity="0.9" />
      </linearGradient>
    </defs>
    <path d="M 60,110 L 60,90 M 60,90 Q 60,70 60,50" stroke="#3d2118" strokeWidth="2" strokeLinecap="round" />
    <path d="M 60,90 C 45,85 15,80 20,60 C 22,50 35,62 40,55 C 30,45 10,40 18,25 C 23,20 38,38 45,30 C 40,15 30,0 45,5 C 50,8 55,25 60,35 C 65,25 70,8 75,5 C 90,0 80,15 75,30 C 82,38 97,20 102,25 C 110,40 90,45 80,55 C 85,62 98,50 100,60 C 105,80 75,85 60,90 Z" 
          fill="url(#mapleGrad)" stroke="#3d2118" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M 60,70 L 40,58 M 60,55 L 35,42 M 60,45 L 48,28 M 60,70 L 80,58 M 60,55 L 85,42 M 60,45 L 72,28" stroke="#3d2118" strokeWidth="1" strokeLinecap="round" />
  </svg>,
  // Soot Sprite (Susuwatari)
  <svg key="soot" viewBox="0 0 120 120" className="w-full h-full">
    <defs>
      <radialGradient id="sootGrad" cx="50%" cy="50%" r="50%">
        <stop offset="70%" stopColor="#1e1b18" />
        <stop offset="100%" stopColor="#3d3733" />
      </radialGradient>
      <radialGradient id="blushGrad" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#e08282" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#e08282" stopOpacity="0" />
      </radialGradient>
    </defs>
    <g stroke="#1a1816" strokeWidth="1.8" strokeLinecap="round">
      <path d="M60 10 L60 110 M10 60 L110 60 M25 25 L95 95 M25 95 L95 25" />
      <path d="M40 15 L80 105 M15 40 L105 80 M15 80 L105 40 M40 105 L80 15" />
      <path d="M50 12 L70 108 M12 50 L108 70 M12 70 L108 50 M50 108 L70 12" />
    </g>
    <circle cx="60" cy="60" r="32" fill="url(#sootGrad)" stroke="#1a1816" strokeWidth="2" />
    <circle cx="40" cy="68" r="10" fill="url(#blushGrad)" />
    <circle cx="80" cy="68" r="10" fill="url(#blushGrad)" />
    <circle cx="46" cy="52" r="10" fill="white" stroke="#1a1816" strokeWidth="1.5" />
    <circle cx="74" cy="52" r="10" fill="white" stroke="#1a1816" strokeWidth="1.5" />
    <circle cx="47" cy="52" r="3" fill="black" />
    <circle cx="73" cy="52" r="3" fill="black" />
  </svg>,
  // Steaming Mug
  <svg key="tea" viewBox="0 0 120 120" className="w-full h-full">
    <defs>
      <linearGradient id="mugGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e8f1f5" />
        <stop offset="100%" stopColor="#b9cbd6" />
      </linearGradient>
    </defs>
    <path d="M 45,30 Q 40,15 50,5 T 45,-5 M 60,32 Q 65,18 55,8 T 65,-2 M 75,30 Q 70,16 80,6" fill="none" stroke="#a0afb8" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <path d="M 75,45 C 95,45 100,75 75,80" fill="none" stroke="#2a353d" strokeWidth="2.5" />
    <rect x="35" y="38" width="45" height="46" rx="4" fill="url(#mugGrad)" stroke="#2a353d" strokeWidth="2" />
    <ellipse cx="57" cy="62" rx="10" ry="12" fill="#fafafa" stroke="#2a353d" strokeWidth="1" />
    <path d="M 52,60 Q 57,55 62,60 M 54,66 Q 57,63 60,66" stroke="#2a353d" strokeWidth="1" />
  </svg>,
  // Compass
  <svg key="compass" viewBox="0 0 120 120" className="w-full h-full">
    <circle cx="60" cy="60" r="45" fill="none" stroke="#544436" strokeWidth="2" />
    <circle cx="60" cy="60" r="41" fill="none" stroke="#544436" strokeWidth="1" strokeDasharray="3 3" />
    <polygon points="60,20 65,55 60,60" fill="#a64d32" stroke="#544436" strokeWidth="1" />
    <polygon points="60,20 55,55 60,60" fill="#d9735d" stroke="#544436" strokeWidth="1" />
    <polygon points="60,100 65,65 60,60" fill="#75675b" stroke="#544436" strokeWidth="1" />
    <polygon points="60,100 55,65 60,60" fill="#bfaea1" stroke="#544436" strokeWidth="1" />
    <polygon points="100,60 65,65 60,60" fill="#bfaea1" stroke="#544436" strokeWidth="1" />
    <polygon points="20,60 55,55 60,60" fill="#bfaea1" stroke="#544436" strokeWidth="1" />
    <text x="56" y="16" fontSize="11" fontFamily="Georgia" fill="#544436" fontWeight="bold">N</text>
  </svg>
];

// ============================================================================
//   4. FULL 18-DAY JAPAN DIARY ITINERARY
// ============================================================================
const TRIP_DAYS: TripDay[] = [
  {
    dayNumber: 1,
    title: "Arrival: Whispers of Tokyo Neon",
    date: getCalendarDate(0),
    activities: [
      { time: "04:00 PM", title: "Touchdown at Haneda Terminal", detail: "Step into the humming terminal. Gather pocket WiFi and collect travel rail passes." },
      { time: "07:30 PM", title: "Shinjuku Alleyways & Cozy Izakayas", detail: "Wander through Omoide Yokocho's narrow wood-paneled food alleys, smelling charcoal-grilled yakitori smoke rising into the mist." }
    ],
    meals: [
      { type: "Dinner", place: "Tsubame Izakaya", item: "Tare-glazed chicken skewers with crisp cold lager" }
    ],
    transport: [
      { type: "Train", detail: "Tokyo Monorail and JR Yamanote Line straight to hotel." }
    ],
    notes: "Rest early. Let the hum of the city lull us to sleep under heavy cotton duvets.",
    documents: [
      { name: "Tokyo Hotel Booking", id: "HOTEL-TYO-99", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HanedaTokyoHotelCheckIn" }
    ]
  },
  {
    dayNumber: 2,
    title: "Mossy Paths & Retro Meiji Forest",
    date: getCalendarDate(1),
    activities: [
      { time: "09:30 AM", title: "Meiji Jingu Shrine Sanctuary", detail: "Step through massive cypress Torii gates into a lush 170-acre forest. Crisp morning air smelling of ancient cedar bark." },
      { time: "02:00 PM", title: "Harajuku & Cat Street Explorations", detail: "Slip past busy avenues into narrow alleys lined with hand-painted clothing boutiques and tiny espresso holes." }
    ],
    meals: [
      { type: "Breakfast", place: "Nozy Coffee", item: "Pourover single-origin brew with warm cinnamon buns" },
      { type: "Lunch", place: "Gyoza Lou", item: "Pan-fried pork and chive gyoza with cucumber pickles" }
    ],
    transport: [
      { type: "Walking", detail: "Wandering winding paths through ancient shrine groves and Harajuku side-streets (15,000 steps)." }
    ],
    notes: "Look closely at the giant walls of sake barrels stacked in dedication outside the shrine paths.",
    documents: []
  },
  {
    dayNumber: 3,
    title: "The Old Heart of Yanaka Ginza",
    date: getCalendarDate(2),
    activities: [
      { time: "10:00 AM", title: "Nostalgic Yanaka Alleys", detail: "A rare pocket of Tokyo that survived wartime bombing. Stroll quiet residential paths, spotting lazy alley cats napping on tiled rooftops." },
      { time: "03:00 PM", title: "Ueno Park & Pond Lilies", detail: "Row a green wooden boat across Shinobazu Pond, watching pink lotus flowers floating over still water." }
    ],
    meals: [
      { type: "Lunch", place: "Yanaka Shippoya", item: "Warm, cat-tail shaped sweet donuts filled with custard" },
      { type: "Dinner", place: "Izu-ei Honten", item: "Eel (unagi) grilled over binchotan wood, served in a lacquer bento box" }
    ],
    transport: [
      { type: "Train", detail: "Yamanote Line loops to Nippori Station." }
    ],
    notes: "Yanaka is best explored slowly with no maps. Let yourself get lost.",
    documents: []
  },
  {
    dayNumber: 4,
    title: "Into Mitaka's Ghibli Forest",
    date: getCalendarDate(3),
    activities: [
      { time: "11:00 AM", title: "The Ghibli Museum in Mitaka", detail: "Walk through a spiral-staircased magical house. Meet a giant brass robot soldier guarding a rooftop garden." },
      { time: "04:00 PM", title: "Inokashira Park Forest Walk", detail: "Walk under low-hanging weeping cherry trees along the peaceful park river canal." }
    ],
    meals: [
      { type: "Lunch", place: "Straw Hat Cafe", item: "Fluffy pancakes stamped with black cat footprints" },
      { type: "Dinner", place: "Kichijoji Harmonica Yokocho", item: "Tiny retro standing bar serving steaming vegetable tempura" }
    ],
    transport: [
      { type: "Train", detail: "Chuo Line rapid train to Mitaka Station, walk through wooded pathways." }
    ],
    notes: "No cameras are allowed inside the Ghibli museum. Feel the art with your eyes, not your screen.",
    documents: [
      { name: "Mitaka Ghibli Admission", id: "GHIBLI-TIX-4", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GhibliMitakaMuseumMuseumVoucher" }
    ]
  },
  {
    dayNumber: 5,
    title: "Kitchens of Tsukiji & Electronic Glow",
    date: getCalendarDate(4),
    activities: [
      { time: "07:30 AM", title: "Tsukiji Outer Market Food Hunt", detail: "Squeeze past bustling family vendors selling charcoal oysters and blocks of golden rolled omelet." },
      { time: "06:00 PM", title: "Akihabara Vintage Arcade Crawl", detail: "Step into dark multi-story retro arcades, surrounded by 8-bit synthetic chirps and the smell of warm machine fans." }
    ],
    meals: [
      { type: "Breakfast", place: "Yamachou Omelet", item: "Hot sweet rolled egg omelet skewered on bamboo" },
      { type: "Lunch", place: "Sushi Dai", item: "Morning-catch tuna nigiri hand-formed right before us" }
    ],
    transport: [
      { type: "Metro", detail: "Hibiya Line to Tsukiji, Hibiya Line to Akihabara." }
    ],
    notes: "Bring small coins for vintage Capsule toy machines (Gachapon) in Akihabara's backstreets.",
    documents: []
  },
  {
    dayNumber: 6,
    title: "Hakone: Steam, Sulfur & Volcanoes",
    date: getCalendarDate(5),
    activities: [
      { time: "11:30 AM", title: "Hakone Tozan Switchback Train", detail: "Ride a vintage red train as it crawls slowly up a steep mountain forest through narrow wooden bridges." },
      { time: "02:00 PM", title: "Owakudani Boiling Valley", detail: "Walk through billowing clouds of hot volcanic steam. Eat sulfur-boiled black eggs (Kuro-tamago)." }
    ],
    meals: [
      { type: "Lunch", place: "Owakudani Rest House", item: "Warm sulfur-boiled eggs (rumored to add 7 years to your life)" },
      { type: "Dinner", place: "Ryokan Dining Hall", item: "12-course local Kaiseki banquet containing mountain vegetables" }
    ],
    transport: [
      { type: "Train", detail: "Odakyu Romancecar express from Shinjuku into Hakone-Yumoto mountain pass." }
    ],
    notes: "If the mountain sky is clear, look out for the snow-capped silhouette of Mt. Fuji over the lakes.",
    documents: [
      { name: "Ryokan Booking & Onsen Pass", id: "RYO-HKN-882", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HakoneRyokanHotSpringReservation" }
    ]
  },
  {
    dayNumber: 7,
    title: "Lake Ashi's Misty Shrines",
    date: getCalendarDate(6),
    activities: [
      { time: "10:00 AM", title: "Lake Ashi Pirate Cruise", detail: "Glide across a vast, mist-covered mountain caldera lake, looking at a towering vermillion Torii gate standing directly in the water." },
      { time: "03:00 PM", title: "Hakone Jinja Cedar Shrine", detail: "Ascend a wet stone staircase flanked by enormous moss-carpeted cedar trunks." }
    ],
    meals: [
      { type: "Lunch", place: "Bakery & Table Hakone", item: "Freshly-baked honey toast overlooking the misty lake" }
    ],
    transport: [
      { type: "Boat", detail: "Lake Ashi sightseeing boat to Motohakone." }
    ],
    notes: "The lake waters are deep and perfectly quiet. Soak in the morning silence.",
    documents: []
  },
  {
    dayNumber: 8,
    title: "Kyoto: The Bullet Train & Lanterns",
    date: getCalendarDate(7),
    activities: [
      { time: "10:00 AM", title: "Shinkansen Bullet Train West", detail: "Watch the Japanese countryside blur into beautiful watercolor ribbons at 200mph while sipping green bento tea." },
      { time: "06:30 PM", title: "Gion Paper Lantern Walk", detail: "Walk down wooden lanes beside Shirakawa Canal. Listen for the soft click-clack of wooden sandals (geta) of passing geishas." }
    ],
    meals: [
      { type: "Lunch", place: "Ekiben Station Box", item: "Kyoto-style pressed sushi box with pickled plum and ginger" },
      { type: "Dinner", place: "Gion Okaru", item: "Curry udon noodles inside a historical lantern-lit dining room" }
    ],
    transport: [
      { type: "Bullet Train", detail: "Tokaido Shinkansen bullet train from Odawara directly to Kyoto Station (2 hours)." }
    ],
    notes: "Keep voices soft in Gion. It is a peaceful residential district of deep heritage.",
    documents: [
      { name: "Kyoto Machiya Reservation", id: "MACH-KYO-41", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KyotoMachiyaTraditionalInnCheckIn" }
    ]
  },
  {
    dayNumber: 9,
    title: "Gold Foil & Zen Raked Sand",
    date: getCalendarDate(8),
    activities: [
      { time: "09:00 AM", title: "The Golden Pavilion (Kinkaku-ji)", detail: "Marvel at a golden temple shining brightly over a reflecting mirror pond filled with ancient carp." },
      { time: "02:00 PM", title: "Ryoan-ji Rock Garden Meditation", detail: "Sit on wooden temple steps, silently studying fifteen stones placed meticulously in a sea of raked white gravel." }
    ],
    meals: [
      { type: "Lunch", place: "Kinkaku-ji Soba", item: "Cold buckwheat noodles dipped in dashi with mountain yam" },
      { type: "Dinner", place: "Izusen Tofubou", item: "Zen vegetarian multi-dish tofu meal served in stacked red lacquered bowls" }
    ],
    transport: [
      { type: "Bus", detail: "Kyoto City Bus #205 north to Kinkakuji-michi." }
    ],
    notes: "Try to count all 15 stones at Ryoan-ji. From any angle, at least one is always hidden.",
    documents: []
  },
  {
    dayNumber: 10,
    title: "The Bamboo Sough & River Dining",
    date: getCalendarDate(9),
    activities: [
      { time: "08:30 AM", title: "Arashiyama Bamboo Grove", detail: "Walk inside towering green arches. Mountain fog rolls over Arashiyama's slopes." },
      { time: "01:30 PM", title: "Otagi Nenbutsu-ji Temple", detail: "Count 1,200 whimsical stone head statues. Find the funniest one tucked behind wild ferns." }
    ],
    meals: [
      { type: "Breakfast", place: "Saga-Toriimoto Tea House", item: "Pounded rice mochi with hot roasted mugwort tea" },
      { type: "Lunch", place: "Shoraian Kaiseki", item: "Twelve courses of handmade tofu over the rushing mountain river" }
    ],
    transport: [
      { type: "Train", detail: "Saga-Scenic railway or Hankyu Arashiyama line." }
    ],
    notes: "Bring an umbrella. Mountain rain in Arashiyama makes the moss glow like neon emeralds.",
    documents: [
      { name: "Shoraian River Dining", id: "RES-99120", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=ShoraianLunchKyoto" }
    ]
  },
  {
    dayNumber: 11,
    title: "The Vermillion Mountain (Fushimi Inari)",
    date: getCalendarDate(10),
    activities: [
      { time: "07:00 AM", title: "Fushimi Inari Shrine Hike", detail: "Ascend a mountain path through 10,000 closely-spaced vermillion shrine gates. Shafts of morning light filter through dense evergreen forest." },
      { time: "02:00 PM", title: "Sanjusangendo Hall of 1001 Statues", detail: "Step into an ancient wooden hall housing 1,001 golden-faced statues of Kannon, carved out of Japanese cypress." }
    ],
    meals: [
      { type: "Lunch", place: "Inari Roadside Stalls", item: "Sweet tofu-skin pockets (Inari sushi) and flame-grilled quail" },
      { type: "Dinner", place: "Gyoza Hohei", item: "Thin-wrapper ginger gyoza with pickled cabbage" }
    ],
    transport: [
      { type: "Train", detail: "JR Nara Line from Kyoto Station to Inari Station (5 mins)." }
    ],
    notes: "The higher you climb Fushimi Inari, the quieter the trails become. The summit is incredibly peaceful.",
    documents: []
  },
  {
    dayNumber: 12,
    title: "Uji: The Cradle of Green Tea",
    date: getCalendarDate(11),
    activities: [
      { time: "10:30 AM", title: "Uji River Tea Plantations", detail: "Wander past rolling slopes of dense jade green tea bushes. Clean smell of ground matcha leaves in the air." },
      { time: "01:00 PM", title: "Byodoin Temple Phoenix Hall", detail: "Study a floating red wooden temple hall representing the pure Buddhist paradise, built over a wide pond." }
    ],
    meals: [
      { type: "Lunch", place: "Nakamura Tokichi", item: "Matcha-infused buckwheat noodles with rich green tea jelly" }
    ],
    transport: [
      { type: "Train", detail: "JR Nara Line southward to Uji Station." }
    ],
    notes: "Uji makes the finest green tea in Japan. Take home a small tin of ceremonial matcha.",
    documents: []
  },
  {
    dayNumber: 13,
    title: "Nara: Whispering Deer & Stone Lanterns",
    date: getCalendarDate(12),
    activities: [
      { time: "10:00 AM", title: "Todai-ji Temple Great Hall", detail: "Pass beneath massive wooden guardians into the largest timber building in the world housing the giant bronze Buddha." },
      { time: "02:30 PM", title: "Kasuga Taisha Lantern Walk", detail: "Hike silent gravel forest trails enclosed by cedar trees. 3,000 stone lanterns stand carpeted in green moss." }
    ],
    meals: [
      { type: "Lunch", place: "Edogawa Naramachi", item: "Freshly-grilled savory unagi served inside a 150-year-old merchant home" },
      { type: "Snack", place: "Nakatanidou Mochi", item: "Mugwort rice cakes freshly pounded before our eyes" }
    ],
    transport: [
      { type: "Train", detail: "Kintetsu express line from Kyoto straight to Nara Station (45 mins)." }
    ],
    notes: "Deer in Nara are sacred. Bow to them, and they will bow back before accepting a cracker.",
    documents: [
      { name: "Kintetsu Rail Pass", id: "PASS-NARA-552", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KintetsuNaraPassScanCode" }
    ]
  },
  {
    dayNumber: 14,
    title: "Osaka: Neon Glitz & Towering Castles",
    date: getCalendarDate(13),
    activities: [
      { time: "11:00 AM", title: "Osaka Castle Stone Walls", detail: "Explore high stone ramparts and wide deep moats, observing white-and-gold pagoda towers rising above cherry trees." },
      { time: "06:30 PM", title: "Dotonbori Neon Food Crawl", detail: "Wander under giant mechanical crab signs and towering glowing billboards flashing above the bustling canal." }
    ],
    meals: [
      { type: "Dinner", place: "Acchichi Honpo", item: "Molten hot octopus dough balls (Takoyaki) drizzled with savory sauce" }
    ],
    transport: [
      { type: "Train", detail: "Local rapid lines from Kyoto Station straight to Osaka Station." }
    ],
    notes: "Osaka is high-energy, fun, and loud. Prepare for delicious street food!",
    documents: []
  },
  {
    dayNumber: 15,
    title: "Himeji: The White Egret Castle",
    date: getCalendarDate(14),
    activities: [
      { time: "10:00 AM", title: "Himeji Castle Keep", detail: "Ascend six steep wooden floors inside Japan's most spectacular surviving castle, looking out at sweeping views of the city below." },
      { time: "03:00 PM", title: "Koko-en Traditional Gardens", detail: "Walk through nine beautifully connected Edo-period gardens, watching waterfall cascades feeding koi ponds." }
    ],
    meals: [
      { type: "Lunch", place: "Himeji Soba", item: "Ginger-infused dashi buckwheat noodles with sweet bean skin" }
    ],
    transport: [
      { type: "Train", detail: "Shinkansen bullet train from Shin-Osaka directly to Himeji Station (30 mins)." }
    ],
    notes: "The wood inside the castle is original from 1609. Walk barefoot and feel the smooth ancient timbers.",
    documents: [
      { name: "Himeji Combo Entry Ticket", id: "HIM-TIX-918", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HimejiKokoenJointPassEntry" }
    ]
  },
  {
    dayNumber: 16,
    title: "Miyajima: The Floating Torii",
    date: getCalendarDate(15),
    activities: [
      { time: "01:30 PM", title: "Itsukushima Floating Shrine", detail: "Witness the iconic massive red Torii gate standing peacefully in the ocean tides. As water recedes, walk across wet sand to touch it." },
      { time: "05:00 PM", title: "Mount Misen Ropeway Walk", detail: "Ascend through forested slopes to study ancient shrines where mountain monkeys run beside pine groves." }
    ],
    meals: [
      { type: "Dinner", place: "Miyajima Stalls", item: "Sweet maple-leaf-shaped sweet cakes (Momiji Manju) filled with bean paste" }
    ],
    transport: [
      { type: "Train & Ferry", detail: "Sanyo Line train to Miyajimaguchi, boarding a wooden ferry across the channel." }
    ],
    notes: "The sunset over Miyajima's bay is breathtaking. Find a bench on the shoreline to watch the light fade.",
    documents: [
      { name: "Miyajima Ferry Pass", id: "FERRY-MIY-2", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MiyajimaIslandFerryTransitCode" }
    ]
  },
  {
    dayNumber: 17,
    title: "Tokyo Return: Shimokitazawa Alleys",
    date: getCalendarDate(16),
    activities: [
      { time: "02:00 PM", title: "Shimokitazawa Thrift Hunting", detail: "Wander quiet, pedestrian-only narrow lanes. Browse shops selling vintage vinyl records and pre-loved woolen sweaters." },
      { time: "07:30 PM", title: "Farewell Tea Ceremony", detail: "Gather in a cozy hand-crafted wooden tea house, sipping hand-whisked hot matcha as old vinyl jazz plays." }
    ],
    meals: [
      { type: "Lunch", place: "Rojiura Curry Samurai", item: "Thick vegetable soup curry containing twenty charcoal-roasted vegetables" }
    ],
    transport: [
      { type: "Bullet Train", detail: "Shinkansen bullet train back east to Tokyo Station, transfer to hotel." }
    ],
    notes: "Pack bags carefully tonight. Let our travel treasures find a safe spot in our suitcases.",
    documents: []
  },
  {
    dayNumber: 18,
    title: "Departure: Last Skyward Glance",
    date: getCalendarDate(17),
    activities: [
      { time: "11:00 AM", title: "Souvenir Shopping at Tokyo Station", detail: "Collect box treats like banana sponge cakes and matcha sweets for friends back home." },
      { time: "03:00 PM", title: "Haneda Airport Departure", detail: "Board the departure flight, looking down at Tokyo's sprawling cityscape fade into the soft ocean clouds." }
    ],
    meals: [
      { type: "Lunch", place: "Rokurinsha Ramen", item: "Thick dipping noodles (tsukemen) in a slow-simmered seafood-pork broth" }
    ],
    transport: [
      { type: "Monorail", detail: "Tokyo Monorail back to Haneda International Terminal." }
    ],
    notes: "Carry the quiet forest memories of Japan inside our hearts forever. Farewell!",
    documents: [
      { name: "Haneda Flight Boarding", id: "FLT-HDN-772", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HanedaDepartureFlightCheckInCode" }
    ]
  }
];

export default function App() {
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<string>('activities');
  const [scribbles, setScribbles] = useState<SketchInstance[]>([]);

  const currentDay = TRIP_DAYS[selectedDayIdx];

  // Dynamically scatter gorgeous drawings down the margins
  useEffect(() => {
    const pageHeight = document.documentElement.scrollHeight || 1200;
    const count = Math.max(4, Math.floor(pageHeight / 450));
    const generated: SketchInstance[] = [];

    for (let i = 0; i < count; i++) {
      const isLeft = Math.random() > 0.5;
      generated.push({
        id: i,
        index: Math.floor(Math.random() * GHIBLI_SKETCHES.length),
        x: isLeft ? `${Math.random() * 3 + 1}%` : `${Math.random() * 3 + 92}%`,
        y: `${(i / count) * 82 + Math.random() * 8 + 6}%`,
        scale: Math.random() * 0.3 + 0.8, // Elegant, highly visible sizes
        rotation: Math.floor(Math.random() * 40 - 20),
        opacity: Math.random() * 0.2 + 0.65,
      });
    }
    setScribbles(generated);
  }, [selectedDayIdx]);

  const tabs = [
    { id: 'activities', label: '🎒 Itinerary' },
    { id: 'meals', label: '🍙 Tea & Feast' },
    { id: 'transport', label: '🚂 Journey' },
    { id: 'notes', label: '✏️ Musings' },
    { id: 'documents', label: '🎟️ Passes' }
  ];

  return (
    <div className="relative min-h-screen py-12 px-4 md:px-16 flex flex-col justify-center">
      
      {/* 1. SCATTERED GHIBLI ARTWORK (MARGINS) */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {scribbles.map((s) => (
          <div
            key={s.id}
            className="botanical-sketch"
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
              opacity: s.opacity,
              width: '75px',
              height: '75px',
            }}
          >
            {GHIBLI_SKETCHES[s.index]}
          </div>
        ))}
      </div>

      <div className="max-w-5xl mx-auto w-full relative z-10">
        
        {/* 2. THE DIARY TAB NAVIGATOR (Pressed ticket look) */}
        <div className="flex justify-center gap-2 mb-10 flex-wrap max-w-4xl mx-auto">
          {TRIP_DAYS.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => {
                setSelectedDayIdx(idx);
                setActiveTab('activities');
              }}
              style={{
                filter: 'url(#hand-drawn-sketch)',
                transform: `rotate(${idx % 2 === 0 ? -1.5 : 2.2}deg)`,
              }}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold border-2 border-[#544436] transition-transform hover:scale-105 active:scale-95 shadow-md ${
                selectedDayIdx === idx
                  ? 'bg-[#c3d3be] text-[#243521] border-[#243521] font-bold'
                  : 'bg-[#faf8f5] text-[#5c4a37]'
              }`}
            >
              Day {day.dayNumber}
            </button>
          ))}
        </div>

        {/* 3. LEATHER-BOUND SKETCHBOOK CONTAINER */}
        <div className="flex rounded-lg overflow-hidden shadow-2xl border-4 border-[#331c13]">
          
          {/* Leather spine of the notebook */}
          <div className="w-8 md:w-12 leather-spine flex flex-col items-center justify-around py-12 relative">
            {/* Brass binding rings */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-4 h-4 rounded-full bg-gradient-to-br from-[#d4af37] to-[#8c6d1b] border border-[#52441c] shadow-md relative">
                <div className="absolute inset-1 rounded-full bg-[#3e2c0e] opacity-60"></div>
              </div>
            ))}
          </div>

          {/* Sketchbook interior page */}
          <div className="flex-1 sketchbook-page p-6 md:p-12">
            
            {/* Page Header */}
            <div className="border-b-2 border-dashed border-[#dcd1be] pb-6 mb-8 text-center md:text-left">
              <span className="font-serif tracking-widest text-[#a1553c] text-xs font-bold uppercase block mb-1">
                Adventure Log / {currentDay.date}, {TRIP_YEAR}
              </span>
              <h1 className="font-serif text-2xl md:text-4xl italic font-bold tracking-tight text-[#2b1f14]">
                {currentDay.title}
              </h1>
            </div>

            {/* Folder tab buttons */}
            <div className="flex flex-wrap gap-1 mb-8">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`journal-tab px-4 py-2.5 text-xs md:text-sm font-bold ${
                      isActive ? 'journal-tab-active' : ''
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* TAB PANELS WITH CUSTOM WATERCOLOR WASH TINTS */}
            <div className="min-h-[320px]">
              
              {/* TAB CONTENT: ITINERARY */}
              {activeTab === 'activities' && (
                <div className="space-y-8 watercolor-wash-green p-6 rounded-md border border-[#d9e2d5] hand-inked">
                  <h3 className="font-serif text-2xl font-bold italic text-[#394a2c]">
                    👣 The Day's Wandering
                  </h3>
                  <div className="space-y-6">
                    {currentDay.activities.map((act, index) => (
                      <div key={index} className="flex gap-6 items-start">
                        <span className="font-serif italic font-bold text-[#b45d3e] text-lg min-w-[85px]">
                          {act.time}
                        </span>
                        <div className="border-l-2 border-[#d0dfd4] pl-4">
                          <h4 className="font-serif font-bold text-lg text-[#251b11]">{act.title}</h4>
                          <p className="text-sm md:text-base leading-relaxed text-[#504539] font-serif mt-1 italic">
                            "{act.detail}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: FEASTS */}
              {activeTab === 'meals' && (
                <div className="space-y-8 watercolor-wash-amber p-6 rounded-md border border-[#e8ded0] hand-inked">
                  <h3 className="font-serif text-2xl font-bold italic text-[#634b35]">
                    🍙 Food, Teas & Sweet Bites
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {currentDay.meals.map((meal, index) => (
                      <div key={index} className="p-5 border border-dashed border-[#cfc4b3] rounded bg-[#faf8f5]/80 shadow-sm">
                        <span className="bg-[#e2cebe] text-[#543b23] text-xs font-serif font-bold px-2.5 py-1 rounded">
                          {meal.type}
                        </span>
                        <h4 className="font-serif font-bold text-lg mt-3 text-[#2c1d13]">{meal.place}</h4>
                        <p className="text-sm md:text-base leading-relaxed text-[#504539] italic mt-1 font-serif">
                          "{meal.item}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: TRANSIT */}
              {activeTab === 'transport' && (
                <div className="space-y-6 watercolor-wash-blue p-6 rounded-md border border-[#d5dee2] hand-inked">
                  <h3 className="font-serif text-2xl font-bold italic text-[#2e434c]">
                    🚂 Journey Details & Routes
                  </h3>
                  <div className="space-y-5">
                    {currentDay.transport.map((trans, index) => (
                      <div key={index} className="flex gap-4 items-start bg-[#fcf9f2] p-4 rounded border border-[#d2d9dc]">
                        <span className="text-2xl mt-1">
                          {trans.type === 'Train' ? '🚂' : '🚶'}
                        </span>
                        <div>
                          <span className="font-serif font-bold text-[#2e434c] block text-lg">{trans.type}</span>
                          <p className="text-sm md:text-base text-[#504539] leading-relaxed mt-0.5">{trans.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: MUSINGS */}
              {activeTab === 'notes' && (
                <div className="space-y-6 hand-inked p-6 bg-[#f7f5ee] rounded border border-[#e2dec9]">
                  <h3 className="font-serif text-2xl font-bold italic text-[#4f4335]">
                    ✏️ Traveler's Scrapbook Notes
                  </h3>
                  <div className="p-6 italic text-lg md:text-xl leading-relaxed text-[#4d3c2e] font-serif relative border-l-4 border-[#b45d3e] bg-[#fdfcfa] rounded-r shadow-inner">
                    <span className="absolute top-2 right-4 text-4xl opacity-15">📌</span>
                    "{currentDay.notes}"
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PASSES */}
              {activeTab === 'documents' && (
                <div className="space-y-6 hand-inked p-6 bg-[#faf8f5] rounded border border-[#e8ded0]">
                  <h3 className="font-serif text-2xl font-bold italic text-[#543b23]">
                    🎟️ Lodging & Transit Tickets
                  </h3>
                  <div className="flex flex-wrap gap-8 justify-center md:justify-start items-center">
                    {currentDay.documents.map((doc, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-6 items-center p-5 border border-[#5a4f43]/40 rounded-lg bg-[#fdfdfd] shadow-md hover:shadow-lg transition-shadow">
                        <div className="p-3 pb-8 bg-[#fafafa] border border-gray-300 shadow-md transform rotate-1 flex flex-col items-center">
                          <img 
                            src={doc.qrCodeUrl} 
                            alt="Reservation Access Code" 
                            className="w-32 h-36 border border-gray-200" 
                          />
                          <span className="text-[10px] text-gray-500 mt-2 font-mono uppercase tracking-widest">Aged Scan Entry</span>
                        </div>
                        
                        <div className="text-center md:text-left space-y-2">
                          <h4 className="font-serif font-bold text-xl text-[#2c1d13]">{doc.name}</h4>
                          <p className="text-xs text-gray-500 font-mono tracking-wider">REGISTRY CODE: {doc.id}</p>
                          <button className="mt-2 px-4 py-1.5 bg-[#697d70] hover:bg-[#57695c] text-white text-xs font-bold font-serif tracking-wider uppercase rounded shadow transition-colors">
                            View Parchment Ticket
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
