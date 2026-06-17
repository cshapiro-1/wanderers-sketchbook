import React, { useState, useEffect } from 'react';

// --- GHIBLI MARGIN SCRIBBLES DATA ---
const SCRIBBLES = [
  // Soot Sprite (Susuwatari)
  <svg viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2.5" className="w-full h-full">
    <path d="M50 20 L50 80 M20 50 L80 50 M28 28 L72 72 M28 72 L72 28 M35 15 L65 85 M15 35 L85 65 M15 65 L85 35 M35 85 L65 15" strokeWidth="3" />
    <circle cx="42" cy="45" r="5" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="58" cy="45" r="5" fill="white" stroke="currentColor" strokeWidth="1.5" />
    <circle cx="42" cy="45" r="1.5" fill="black" />
    <circle cx="58" cy="45" r="1.5" fill="black" />
    <path d="M 40 70 Q 50 65, 60 70" />
  </svg>,
  // Kodama Forest Spirit
  <svg viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2.5" className="w-full h-full">
    <path d="M 50 15 C 20 15, 15 45, 25 70 C 35 90, 65 92, 75 70 C 85 45, 80 15, 50 15 Z" />
    <circle cx="38" cy="45" r="6" fill="black" />
    <circle cx="62" cy="40" r="5.5" fill="black" />
    <ellipse cx="50" cy="65" rx="3.5" ry="5" fill="black" />
  </svg>,
  // Coffee/Tea stain ring
  <svg viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2" opacity="0.4" className="w-full h-full">
    <path d="M 50 15 C 70 15, 85 30, 85 50 C 85 70, 70 85, 50 85 C 30 85, 15 70, 15 50 C 15 32, 28 17, 45 15" strokeDasharray="4 2" />
    <path d="M 53 10 C 65 15, 78 28, 80 40" strokeWidth="1"/>
  </svg>,
  // Whimsical Pointer Arrow
  <svg viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2.5" className="w-full h-full">
    <path d="M 20 70 Q 40 40, 75 35" />
    <path d="M 60 30 L 78 33 L 73 50" />
  </svg>,
  // Forest Sprout
  <svg viewBox="0 0 100 100" stroke="currentColor" fill="none" strokeWidth="2.5" className="w-full h-full">
    <path d="M 50 85 L 50 40 Q 50 25, 75 25" />
    <path d="M 50 45 Q 50 30, 25 35" />
    <path d="M 75 25 Q 60 40, 50 40" fill="rgba(120, 160, 110, 0.2)" />
    <path d="M 25 35 Q 40 45, 50 45" fill="rgba(120, 160, 110, 0.2)" />
  </svg>
];

// --- SAMPLE MULTI-DAY ITINERARY DATA ---
const TRIP_DAYS = [
  {
    dayNumber: 1,
    title: "Kyoto Forest Wanderings",
    date: "October 14",
    activities: [
      { time: "09:00 AM", title: "Walk through Arashiyama Bamboo Grove", detail: "Listen to the bamboo creak in the wind. Walk slow." },
      { time: "02:00 PM", title: "Otagi Nenbutsu-ji Temple", detail: "Find the happiest stone head statue nestled in the moss." }
    ],
    meals: [
      { type: "Breakfast", place: "Sagano Bakery", item: "Melon pan and matcha latte" },
      { type: "Lunch", place: "Tofu Tea House", item: "Yudofu hot pot" }
    ],
    transport: [
      { type: "Train", detail: "Hankyu Railway from Central Kyoto to Arashiyama (220 yen)" },
      { type: "Walking", detail: "Around 14,000 steps through temple pathways." }
    ],
    notes: "Buy a stamp book (Goshuin-cho) at the first temple. Keep an eye out for friendly river herons!",
    documents: [
      { name: "Shoraian Lunch Reservation", id: "RES-99120", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KyotoReservationsShoraian" }
    ]
  },
  {
    dayNumber: 2,
    title: "Nara's Whispering Deer",
    date: "October 15",
    activities: [
      { time: "10:30 AM", title: "Todai-ji Great Buddha", detail: "Marvel at the giant bronze statue inside the giant wooden hall." },
      { time: "03:00 PM", title: "Kasuga Taisha Forest Hike", detail: "Stroll along paths lined with 3,000 stone lanterns." }
    ],
    meals: [
      { type: "Lunch", place: "Edogawa Naramachi", item: "Grilled unagi (eel) on rice" },
      { type: "Snack", place: "Nakatanidou", item: "Famous fast-pounded mugwort mochi" }
    ],
    transport: [
      { type: "Train", detail: "Kintetsu-Nara Line from Kyoto Station (45 mins)" },
      { type: "Walking", detail: "Very hilly walking paths. The deer will bow to you for crackers!" }
    ],
    notes: "Do not put deer crackers in your pockets—the deer will find them and nibble your shirt!",
    documents: [
      { name: "Kintetsu Rail Pass ticket", id: "PASS-NARA-552", qrCodeUrl: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=NaraKintetsuPassActive" }
    ]
  }
];

export default function App() {
  const [selectedDayIdx, setSelectedDayIdx] = useState(0);
  const [activeTab, setActiveTab] = useState('activities');
  const [scribbles, setScribbles] = useState<any[]>([]);

  const currentDay = TRIP_DAYS[selectedDayIdx];

  // Randomly generate margin sketches on client load
  useEffect(() => {
    const pageHeight = document.documentElement.scrollHeight || 1000;
    const count = Math.max(4, Math.floor(pageHeight / 400));
    const generated = [];

    for (let i = 0; i < count; i++) {
      const isLeft = Math.random() > 0.5;
      generated.push({
        id: i,
        index: Math.floor(Math.random() * SCRIBBLES.length),
        x: isLeft ? `${Math.random() * 4 + 1}%` : `${Math.random() * 4 + 93}%`,
        y: `${(i / count) * 85 + Math.random() * 10 + 5}%`,
        scale: Math.random() * 0.4 + 0.65,
        rotation: Math.floor(Math.random() * 50 - 25),
        opacity: Math.random() * 0.35 + 0.5,
      });
    }
    setScribbles(generated);
  }, [selectedDayIdx]); // Regen or adjust positions slightly on day switch

  const tabs = [
    { id: 'activities', label: '🎒 Activities' },
    { id: 'meals', label: '🍙 Meals' },
    { id: 'transport', label: '🚂 Transport' },
    { id: 'notes', label: '✏️ Notes' },
    { id: 'documents', label: '🎟️ Documents' }
  ];

  return (
    <div className="relative min-h-screen py-10 px-4 md:px-12">
      
      {/* 1. RANDOMIZED SCATTERED MARGIN SKETCHES */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        {scribbles.map((s) => (
          <div
            key={s.id}
            className="margin-scribble"
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
              opacity: s.opacity,
              width: '65px',
              height: '65px',
              color: '#534436', // Graphite pencil color
            }}
          >
            {SCRIBBLES[s.index]}
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        
        {/* 2. THE DAY NAVIGATOR (Sketchy sticky notes at the top) */}
        <div className="flex justify-center gap-4 mb-8 flex-wrap">
          {TRIP_DAYS.map((day, idx) => (
            <button
              key={day.dayNumber}
              onClick={() => {
                setSelectedDayIdx(idx);
                setActiveTab('activities');
              }}
              style={{
                filter: 'url(#hand-drawn-sketch)',
                transform: `rotate(${idx % 2 === 0 ? -2 : 3}deg)`,
              }}
              className={`px-5 py-2.5 font-bold border-2 border-[#3d3122] transition-transform hover:scale-105 active:scale-95 ${
                selectedDayIdx === idx
                  ? 'bg-[#c3d3be] text-[#2c3d25] shadow-sm'
                  : 'bg-[#faf8f5] text-[#5c4a37] opacity-80'
              }`}
            >
              📌 Day {day.dayNumber}: {day.date}
            </button>
          ))}
        </div>

        {/* 3. TRIP DAY HEADER */}
        <div className="text-center mb-8">
          <span className="bg-[#b3caaf] text-[#2b3a26] px-4 py-1.5 rounded-full text-sm font-bold shadow-sm inline-block transform -rotate-1 mb-2">
            Day {currentDay.dayNumber} — {currentDay.date}
          </span>
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-[#3d3122] mt-1" style={{ filter: 'url(#hand-drawn-sketch)' }}>
            {currentDay.title}
          </h1>
        </div>

        {/* 4. THE INTERACTIVE TABBED CARD (Notebook page) */}
        <div className="flex flex-col">
          
          {/* Card Tabs */}
          <div className="flex flex-wrap gap-1 px-4 z-10 -mb-[3.5px]">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`sketchy-tab px-4 py-2.5 text-sm md:text-base font-bold transition-all ${
                    isActive 
                      ? 'bg-[#faf8f5] text-[#3d3122] border-b-transparent transform translate-y-[2px] z-20' 
                      : 'bg-[#e9e3d5] text-[#6b5d4c] hover:bg-[#eae2cf]'
                  }`}
                  style={{ backgroundColor: isActive ? '#faf8f5' : '' }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Card Body */}
          <div className="sketchy-border p-6 md:p-8 min-h-[400px] shadow-lg relative bg-[#faf8f5]">
            
            {/* Subtle binder spirals on the left edge */}
            <div className="absolute left-3 top-0 bottom-0 flex flex-col justify-around pointer-events-none opacity-25">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-4 h-4 rounded-full border-2 border-dashed border-[#5a4f43]"></div>
              ))}
            </div>

            <div className="pl-6">
              
              {/* TAB CONTENT: ACTIVITIES */}
              {activeTab === 'activities' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b border-dashed border-[#8c7e6c] pb-2 text-[#5c4a37]">
                    🎒 Today's Wandering Path
                  </h3>
                  {currentDay.activities.map((act, index) => (
                    <div key={index} className="flex gap-4">
                      <span className="text-[#a85a44] font-bold min-w-[75px] pt-1">{act.time}</span>
                      <div>
                        <h4 className="font-bold text-lg text-[#3d3122]">{act.title}</h4>
                        <p className="text-sm text-[#615444] italic">{act.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB CONTENT: MEALS */}
              {activeTab === 'meals' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b border-dashed border-[#8c7e6c] pb-2 text-[#5c4a37]">
                    🍙 Eats & Treats
                  </h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    {currentDay.meals.map((meal, index) => (
                      <div key={index} className="p-4 border border-dashed border-[#8c7e6c] rounded-md bg-[#faf8f5]">
                        <span className="bg-[#e4cbaf] text-[#5c442a] text-xs font-bold px-2 py-0.5 rounded">
                          {meal.type}
                        </span>
                        <h4 className="font-bold text-lg mt-2 text-[#3d3122]">{meal.place}</h4>
                        <p className="text-sm text-[#615444] italic">Must try: {meal.item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: TRANSPORT */}
              {activeTab === 'transport' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b border-dashed border-[#8c7e6c] pb-2 text-[#5c4a37]">
                    🚂 Transport & Routes
                  </h3>
                  <div className="space-y-4">
                    {currentDay.transport.map((trans, index) => (
                      <div key={index} className="flex gap-3 items-start">
                        <span className="text-xl">
                          {trans.type === 'Train' ? '🚂' : '🚶'}
                        </span>
                        <div>
                          <span className="font-bold text-[#446254] block">{trans.type}</span>
                          <p className="text-sm text-[#615444]">{trans.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB CONTENT: NOTES */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold border-b border-dashed border-[#8c7e6c] pb-2 text-[#5c4a37]">
                    ✏️ Doodles & Scribbled Thoughts
                  </h3>
                  <div className="p-4 bg-[#fcfaf7] italic text-lg leading-relaxed text-[#514335] relative border border-[#e1d9c9] rounded">
                    <span className="absolute -top-3 right-4 text-3xl opacity-30">📌</span>
                    "{currentDay.notes}"
                  </div>
                </div>
              )}

              {/* TAB CONTENT: DOCUMENTS / QR CODES */}
              {activeTab === 'documents' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold border-b border-dashed border-[#8c7e6c] pb-2 text-[#5c4a37]">
                    🎟️ Passes & Tickets
                  </h3>
                  <div className="flex flex-wrap gap-8 justify-center md:justify-start items-center">
                    {currentDay.documents.map((doc, index) => (
                      <div key={index} className="flex flex-col md:flex-row gap-6 items-center p-4 border-2 border-[#5a4f43] rounded bg-white shadow-sm">
                        {/* Polaroid-style photo frame for the QR Code */}
                        <div className="p-2 pb-6 bg-[#fafafa] border border-gray-300 shadow-md transform rotate-1 flex flex-col items-center">
                          <img 
                            src={doc.qrCodeUrl} 
                            alt="Reservation QR Code" 
                            className="w-36 h-36 border border-gray-200" 
                          />
                          <span className="text-xs text-gray-500 mt-2 font-mono">Scan at counter</span>
                        </div>
                        
                        <div className="text-center md:text-left">
                          <h4 className="font-bold text-lg text-[#3d3122]">{doc.name}</h4>
                          <p className="text-sm text-gray-500 font-mono">ID: {doc.id}</p>
                          <button className="mt-3 px-3 py-1 bg-[#8fa492] hover:bg-[#7e9281] text-white text-sm rounded shadow transition-colors">
                            Open PDF Ticket
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
