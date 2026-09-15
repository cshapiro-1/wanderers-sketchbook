import type { Activity, DayMeals } from '@/types';

export const activities: Record<number, Activity[]> = {
  1: [
    { lat:34.4272, lng:135.2441, title:"Kansai International Airport",     time:"Afternoon",  type:"transit",    desc:"Renzo Piano's artificial island terminal. Customs and bags clear smoothly, then straight to the Haruka Limited Express platform for the 75-minute non-stop glide to Kyoto." , duration:"~1.5 hrs"},
    { lat:34.9875, lng:135.7726, title:"Hyatt Regency Kyoto",              time:"05:30 PM",   type:"hotel",      desc:"In Shichijo at the southern edge of Higashiyama — cedar wood accents, paper lanterns, and serene bamboo gardens. Settle in, unpack for 4 nights, and begin the journey." , duration:"check-in"},
    { lat:35.0050, lng:135.7655, title:"Obanzai Dinner, Higashiyama",      time:"08:00 PM",   type:"restaurant", desc:"Kyoto's traditional home cooking — small handcrafted dishes of pickled mountain vegetables, simmered seasonal tofu, grilled river fish, and sweet tamago in lacquerware. The perfect restorative first meal in Japan." , duration:"~2 hrs"},
  ],
  2: [
    { lat:34.9880, lng:135.7732, title:"Sanjusangen-do",                   time:"09:30 AM",   type:"museum",     desc:"A 120-metre wooden hall containing 1,001 gilded Kannon statues in serried ranks — each face carved with distinct expression between the 12th and 13th centuries. Three minutes walk from the hotel. No photography inside ensures complete, reverent silence." , duration:"~1.5 hrs"},
    { lat:34.9990, lng:135.7790, title:"Higashiyama — Sannen-zaka & Ninenzaka", time:"02:00 PM", type:"nature",   desc:"The historic stone-paved lanes climbing through Higashiyama's preservation district — wooden machiya townhouses, traditional ceramic shops, and the iconic Yasaka Pagoda framed overhead. Stop for fresh matcha soft-serve." , duration:"~2 hrs"},
    { lat:34.9671, lng:135.7727, title:"Fushimi Inari Taisha",             time:"05:00 PM",   type:"museum",     desc:"Ten thousand vermillion torii gates winding up the sacred slopes of Mt. Inari. While the lower paths are bustling, the upper mountain stations empty out at dusk. The summit is silent, lantern-lit, and mystical." , duration:"~2 hrs"},
  ],
  3: [
    { lat:35.0270, lng:135.7982, title:"Ginkaku-ji Silver Pavilion",       time:"09:00 AM",   type:"museum",     desc:"The iconic Zen temple in eastern Kyoto. The kogetsudai sand cone is meticulously raked to reflect moonlight, and the shaded moss gardens climbing the hillside provide stunning vistas over the city." , duration:"~1.5 hrs"},
    { lat:35.0180, lng:135.7930, title:"Philosopher's Path",               time:"10:45 AM",   type:"nature",     desc:"Two kilometres of tranquil canal path lined with cherry trees and hydrangeas between the Silver Pavilion and Nanzen-ji, named for philosopher Nishida Kitaro who walked it in meditation daily." , duration:"~45 min"},
    { lat:35.0116, lng:135.7937, title:"Nanzen-ji Temple & Aqueduct",      time:"01:00 PM",   type:"museum",     desc:"A grand Zen complex whose grounds feature a dramatic 1890 red-brick Roman aqueduct — an unexpected architectural juxtaposition enveloped by ancient pine trees and moss." , optional:true, duration:"~1 hr"},
    { lat:35.0116, lng:135.7915, title:"Yudofu at Junsei",                 time:"02:30 PM",   type:"restaurant", desc:"Kyoto silken tofu gently simmered in kombu dashi broth inside Nanzen-ji's historic garden. Dipped in toasted sesame sauce and fresh ginger, it is pure culinary elegance." , duration:"~1.5 hrs"},
    { lat:35.0050, lng:135.7687, title:"Kaiseki at Nakamura",              time:"07:30 PM",   type:"restaurant", desc:"Founded in 1716 near Nishiki. 3-star culinary mastery across twelve courses highlighting seasonal hamo (pike conger) and Kyoto heirloom vegetables in a historic wooden machiya." , duration:"~2.5 hrs"},
  ],
  4: [
    { lat:35.0345, lng:135.7186, title:"Ryoan-ji Zen Garden",              time:"09:00 AM",   type:"museum",     desc:"Fifteen stones placed in a sea of raked white gravel. From any vantage point on the wooden veranda, at least one stone remains hidden from sight. A 500-year-old masterpiece of Zen contemplation." , duration:"~1.5 hrs"},
    { lat:35.0394, lng:135.7292, title:"Kinkaku-ji Golden Pavilion",       time:"11:00 AM",   type:"museum",     desc:"The top two floors covered in pure gold leaf, reflected across the Kyoko-chi mirror pond. Breathtaking in the morning sunlight." , duration:"~45 min"},
    { lat:34.9875, lng:135.7726, title:"Traditional Kyoto Shiatsu Massage, RIRAKU", time:"03:30 PM", type:"nature", desc:"Traditional Japanese Shiatsu acupressure at Hyatt's award-winning RIRAKU Spa in Higashiyama. Deep meridian finger-pressure release tailored to alleviate walking fatigue, using warm camellia oils and heated herbal pillows. Restorative and deeply grounding." , duration:"~1.5 hrs"},
    { lat:35.0037, lng:135.7765, title:"Gion Evening Walk",               time:"06:30 PM",   type:"nature",     desc:"The stone-paved lanes behind Yasaka Shrine and along the Shirakawa canal as lanterns flicker on and geiko and maiko hurry to evening appointments." , duration:"~1 hr"},
    { lat:35.0074, lng:135.7759, title:"Farewell Kaiseki, Kikunoi Honten", time:"08:00 PM",   type:"restaurant", desc:"The capstone culinary feast of Kyoto. 3 Michelin stars in Gion — seventeen sublime courses honoring peak seasonal ingredients with unmatched hospitality." , duration:"~3 hrs"},
  ],
  5: [
    { lat:35.0171, lng:135.6711, title:"Arashiyama Bamboo Grove & Tenryu-ji", time:"09:00 AM", type:"nature", desc:"Towering bamboo stalks filtering the morning light and Tenryu-ji's 14th-century Sogenchi garden, before taking the express train west into Osaka." , duration:"~2.5 hrs"},
    { lat:34.9855, lng:135.7588, title:"Kyoto → Osaka Express",            time:"12:30 PM",   type:"transit",    desc:"A fast 15-minute JR express ride from Kyoto Station into Osaka. The historic quiet gives way to the neon energy of the Kansai metropolis." , duration:"~20 min"},
    { lat:34.7042, lng:135.4960, title:"Conrad Osaka",                     time:"01:30 PM",   type:"hotel",      desc:"Hilton's architectural flagship towering 58 floors above Nakanoshima island, offering sweeping 360-degree skyline and river views. Unpack for 4 nights." , duration:"check-in"},
    { lat:34.6873, lng:135.5262, title:"Osaka Castle & Nishinomaru Garden",time:"03:30 PM",   type:"museum",     desc:"The grand stone ramparts and surrounding moat gardens built by Toyotomi Hideyoshi, walking along Nakanoshima promenade." , duration:"~2 hrs"},
    { lat:34.6687, lng:135.5014, title:"Dotonbori & Kushikatsu Daruma",   time:"07:30 PM",   type:"restaurant", desc:"Crispy golden skewers in Shinsekai and the buzzing neon canal under the Glico Running Man sign. Strict no-double-dipping rule enforced." , duration:"~2 hrs"},
  ],
  6: [
    { lat:34.7775, lng:135.2417, title:"Rokko Kokusai Golf Club",            time:"08:30 AM",   type:"nature",     desc:"18 holes on the ridge of Mount Rokko overlooking Osaka Bay. Semi-private championship layout with full caddie service and cool mountain breezes." , duration:"~5 hrs"},
    { lat:34.6979, lng:135.1845, title:"Kobe Kitano Settlement",           time:"05:00 PM",   type:"nature",     desc:"Stroll the historic hillside foreign merchant quarter above Sannomiya overlooking Kobe harbor." , duration:"~1 hr"},
    { lat:34.6908, lng:135.1950, title:"Kobe Beef Teppanyaki, Misono",    time:"07:00 PM",   type:"restaurant", desc:"The original teppanyaki restaurant, open since 1945. Melt-in-your-mouth certified A5 Tajima Kobe beef seared tableside on iron." , duration:"~2 hrs"},
  ],
  7: [
    { lat:34.6895, lng:135.8398, title:"Nara: Todai-ji & Great Buddha",     time:"09:00 AM",   type:"museum",     desc:"The world's largest wooden temple building housing the colossal 15-meter bronze Daibutsu Buddha, an awe-inspiring 8th-century national treasure." , duration:"~2 hrs"},
    { lat:34.6851, lng:135.8430, title:"Nara Park — Bowing Sika Deer",       time:"11:30 AM",   type:"nature",     desc:"Encounter 1,200 free-roaming sacred sika deer who gently bow for shika senbei rice crackers beneath ancient cedars." , duration:"~1.5 hrs"},
    { lat:34.6814, lng:135.8477, title:"Kasuga Taisha Shrine",             time:"01:30 PM",   type:"museum",     desc:"Nara's celebrated Shinto shrine famous for its thousands of bronze and stone lanterns enveloped in forest quietude." , duration:"~1 hr"},
    { lat:34.6740, lng:135.4993, title:"Amerika-mura & Shinsaibashi",      time:"04:30 PM",   type:"shop",       desc:"Return to Osaka for vintage denim hunting, indie streetwear, and record shops in Osaka's trendsetting district." , duration:"~2 hrs"},
    { lat:34.6712, lng:135.5084, title:"Okonomiyaki at Fukutaro",          time:"07:30 PM",   type:"restaurant", desc:"Savory Japanese cabbage pancake griddled with pork belly, mountain yam, and dancing bonito flakes at the counter." , duration:"~1.5 hrs"},
  ],
  8: [
    { lat:34.8856, lng:135.6648, title:"Suntory Yamazaki Distillery",      time:"10:00 AM",   type:"museum",     desc:"Japan's birthplace of whisky, founded in 1923. VIP tour and premium tasting of rare aged single malts in the library room." , duration:"~2.5 hrs"},
    { lat:34.6659, lng:135.5067, title:"Kuromon Ichiba Market",            time:"02:00 PM",   type:"shop",       desc:"Osaka's energetic kitchen — grilled giant scallops, uni over rice, and fresh seasonal fruit from hundreds of covered stalls." , duration:"~1.5 hrs"},
    { lat:34.7197, lng:135.3612, title:"Hanshin Tigers at Koshien Stadium",  time:"06:00 PM",   type:"nature",     desc:"The cathedral of Japanese baseball since 1924. Experience coordinated brass fan sections, singing, balloon releases, and electrifying energy." , duration:"~3.5 hrs"},
  ],
  9: [
    { lat:35.2553, lng:139.1572, title:"Shin-Osaka → Odawara Shinkansen",   time:"10:30 AM",   type:"transit",    desc:"Hikari Bullet Train eastward past Mount Fuji to Odawara, followed by the scenic mountain railway up into Hakone." , duration:"~2.5 hrs"},
    { lat:35.2466, lng:139.0671, title:"Gora Kadan",                      time:"03:00 PM",   type:"hotel",      desc:"Former imperial summer villa in the Hakone mountains — private hot spring baths, manicured moss gardens, and pure serenity." , duration:"check-in"},
    { lat:35.2466, lng:139.0671, title:"In-Room Traditional Shiatsu Massage", time:"05:00 PM", type:"nature", desc:"Authentic Japanese Shiatsu acupressure massage performed in-room on tatami after your private outdoor onsen soak. Master practitioner works pressure points along the spine, shoulders, and legs, releasing all travel tension before dinner." , duration:"~1 hr"},
    { lat:35.2466, lng:139.0671, title:"Kaiseki Dinner, Gora Kadan",          time:"07:30 PM",   type:"restaurant", desc:"Twelve exquisite seasonal courses delivered to your room on ancestral lacquerware, highlighting mountain forage and ocean delicacies." , duration:"~2.5 hrs"},
  ],
  10: [
    { lat:35.2466, lng:139.0671, title:"Morning Onsen, Gora Kadan",          time:"07:30 AM",   type:"nature",     desc:"Soak in the steaming outdoor cedar bath at dawn as morning mist drifts across the Hakone valley." , duration:"~1 hr"},
    { lat:35.2495, lng:139.0226, title:"Owakudani Volcanic Vents",         time:"10:30 AM",   type:"nature",     desc:"Ride the Hakone Ropeway over steaming sulfuric crater vents with dramatic views of Mount Fuji on clear mornings." , duration:"~2 hrs"},
    { lat:35.2467, lng:139.0898, title:"Hakone Open-Air Museum",           time:"02:00 PM",   type:"museum",     desc:"Sculpture park across 17 mountain acres featuring masterworks by Picasso, Henry Moore, and walk-in stained glass towers." , duration:"~2.5 hrs"},
    { lat:35.2466, lng:139.0671, title:"Kaiseki Dinner, Gora Kadan",          time:"07:30 PM",   type:"restaurant", desc:"Second night's bespoke kaiseki menu, featuring fresh seasonal seafood and local wagyu beef." , duration:"~2.5 hrs"},
  ],
  11: [
    { lat:35.2439, lng:139.1074, title:"Odakyu Romancecar → Tokyo",        time:"10:30 AM",   type:"transit",    desc:"Reserved-seat express train descending through the green Tanzawa mountains straight into Shinjuku / Tokyo." , duration:"~1.5 hrs"},
    { lat:35.6717, lng:139.7645, title:"Hyatt Centric Ginza Tokyo",        time:"01:30 PM",   type:"hotel",      desc:"Chic lifestyle hotel on Ginza's Namiki-dori, surrounded by world-class dining, boutiques, and galleries. Base for 8 nights." , duration:"check-in"},
    { lat:35.6718, lng:139.7653, title:"Sushi Counter Omakase, Ginza",     time:"07:30 PM",   type:"restaurant", desc:"An intimate 8-seat hinoki counter omakase feast in Ginza, savoring the day's peak catches from Toyosu." , duration:"~2 hrs"},
  ],
  12: [
    { lat:35.6655, lng:139.7708, title:"Tsukiji Outer Market",             time:"08:30 AM",   type:"shop",       desc:"Freshly made tamagoyaki, grilled scallops, and raw sea urchin nigiri from the historic market alleyways." , duration:"~2 hrs"},
    { lat:35.7148, lng:139.7967, title:"Senso-ji Temple & Nakamise-dori",  time:"11:30 AM",   type:"museum",     desc:"Tokyo's oldest Buddhist temple founded in 645 AD, with its iconic Thunder Gate (Kaminarimon) and heritage craft stalls." , duration:"~2 hrs"},
    { lat:35.7118, lng:139.7958, title:"Tempura Daikokuya, Asakusa",       time:"01:30 PM",   type:"restaurant", desc:"Classic dark sesame oil tempura bowls served continuously since 1887 near Senso-ji temple." , duration:"~1.5 hrs"},
    { lat:35.7126, lng:139.7997, title:"Sumida River Water Bus Cruise",    time:"03:30 PM",   type:"nature",     desc:"Cruise down the Sumida River beneath twelve historic bridges from Asakusa to the bay, taking in Tokyo's skyline." , duration:"~1 hr"},
  ],
  13: [
    { lat:35.6825, lng:139.7791, title:"Arashio Stable — Sumo Morning Practice", time:"07:30 AM",   type:"museum",     desc:"Watch massive sumo rikishi train up close during morning keiko practice through the street-level viewing gallery in Nihonbashi." , duration:"~2 hrs"},
    { lat:35.7164, lng:139.7845, title:"Kappabashi Knife Street",          time:"10:30 AM",   type:"shop",       desc:"Tokyo's legendary chef and knife district — browse handcrafted Japanese Damascus blades, whetstones, and kitchenware." , duration:"~1.5 hrs"},
    { lat:35.6941, lng:139.7735, title:"Kanda Yabu Soba",               time:"01:00 PM",   type:"restaurant", desc:"Handcrafted buckwheat soba noodles in a historic 1880 wooden teahouse." , duration:"~1 hr"},
    { lat:35.7023, lng:139.7715, title:"Akihabara Electric Town",          time:"02:30 PM",   type:"shop",       desc:"Multi-floor retro electronics, vintage gaming arcades, and collector stores in Tokyo's anime and tech capital." , duration:"~2 hrs"},
    { lat:35.6814, lng:139.7673, title:"Cotton Club Jazz, Marunouchi",     time:"08:00 PM",   type:"restaurant", desc:"Sophisticated supper club jazz lounge beneath the Marunouchi skyline." , optional:true, duration:"~2 hrs"},
  ],
  14: [
    { lat:35.6766, lng:139.7097, title:"Meiji Jingu Sanctuary & Forest",   time:"09:00 AM",   type:"nature",     desc:"700,000 square meters of evergreen forest surrounding Tokyo's grandest Shinto shrine, stepping into total serenity from the city." , duration:"~1.5 hrs"},
    { lat:35.6660, lng:139.7125, title:"Omotesando & Cat Street",          time:"11:00 AM",   type:"shop",       desc:"World-renowned modern architecture along the zelkova tree-lined boulevard and indie fashion boutiques on Cat Street." , duration:"~2 hrs"},
    { lat:35.6621, lng:139.7161, title:"Nezu Museum & Iris Gardens",       time:"02:00 PM",   type:"museum",     desc:"Kengo Kuma's stunning museum architecture housing pre-modern Japanese art, opening onto an exquisite stroll garden with stone lanterns." , duration:"~1.5 hrs"},
    { lat:35.6595, lng:139.7004, title:"Shibuya Scramble & Nonbei Yokocho",time:"06:00 PM",   type:"nature",     desc:"Experience the world's most iconic pedestrian crossing, followed by tiny retro yakitori bars in Nonbei Yokocho." , duration:"~2 hrs"},
  ],
  15: [
    { lat:35.6964, lng:139.5706, title:"Studio Ghibli Museum, Mitaka",    time:"11:00 AM",   type:"museum",     desc:"Hayao Miyazaki's whimsical museum featuring original hand-drawn animation cels, sketches, and an exclusive short film." , duration:"~2.5 hrs"},
    { lat:35.6997, lng:139.5739, title:"Inokashira Park Stroll",          time:"02:00 PM",   type:"nature",     desc:"Picturesque park with a central swan pond, shaded paths, and indie coffee shops along the perimeter." , duration:"~1.5 hrs"},
    { lat:35.7042, lng:139.5796, title:"Kichijoji Harmonica Yokocho",      time:"04:00 PM",   type:"shop",       desc:"A dense post-war grid of narrow alleyways filled with retro taverns, clothing shops, and street snacks." , duration:"~1.5 hrs"},
    { lat:35.6709, lng:139.7657, title:"Bar High Five, Ginza",              time:"08:30 PM",   type:"restaurant", desc:"World-renowned master mixologist Hidetsugu Ueno's intimate cocktail lounge. Bespoke, surgical drink craft." , duration:"~2 hrs"},
  ],
  16: [
    { lat:35.6489, lng:139.7003, title:"Daikanyama T-Site & Tsutaya",      time:"10:00 AM",   type:"shop",       desc:"Klein Dytham's award-winning architectural bookstore complex, curated design publications, vinyl, and outdoor café." , duration:"~2 hrs"},
    { lat:35.6441, lng:139.6989, title:"Nakameguro Canal Boutiques",       time:"01:00 PM",   type:"nature",     desc:"Stroll the tree-lined Meguro River canal lined with artisanal coffee roasters, vintage stores, and design studios." , duration:"~2 hrs"},
    { lat:35.6605, lng:139.7292, title:"Mori Art Museum & Tokyo City View", time:"05:30 PM",  type:"museum",     desc:"Cutting-edge contemporary art on the 53rd floor of Roppongi Hills, followed by sunset views from the 52nd-floor indoor observation deck." , duration:"~2 hrs"},
    { lat:35.6628, lng:139.7314, title:"Robata Dining, Roppongi",          time:"08:00 PM",   type:"restaurant", desc:"Charcoal hearth robatayaki dining — fresh Hokkaido seafood and seasonal vegetables grilled over white-hot binchotan." , duration:"~2 hrs"},
  ],
  17: [
    { lat:35.6619, lng:139.6672, title:"Shimokitazawa Vintage & Vinyl Hunt", time:"10:30 AM",  type:"shop",       desc:"Tokyo's indie arts haven — browse rare Japanese vinyl pressings, curated vintage Americana clothing, and specialty coffee." , duration:"~3 hrs"},
    { lat:35.6852, lng:139.7101, title:"Shinjuku Gyoen National Garden",   time:"02:30 PM",   type:"nature",     desc:"Vast 144-acre tranquil park blending traditional Japanese, English, and French garden design in the heart of Shinjuku." , duration:"~2 hrs"},
    { lat:35.6928, lng:139.7001, title:"Omoide Yokocho & Golden Gai",      time:"07:00 PM",   type:"restaurant", desc:"Binchotan skewers in the historic 'Memory Lane' lantern alley, followed by intimate microscopic cocktail bars in Golden Gai." , duration:"~2.5 hrs"},
  ],
  18: [
    { lat:35.6698, lng:139.7662, title:"Seiko Museum Ginza",               time:"10:00 AM",   type:"museum",     desc:"Six floors celebrating Japanese horology, from ancient pendulum clocks to Grand Seiko mechanical tourbillons." , duration:"~1.5 hrs"},
    { lat:35.6715, lng:139.7636, title:"Omurice at Rengatei, Ginza",      time:"12:00 PM",   type:"restaurant", desc:"The Meiji-era birthplace of Japanese omurice (est. 1900), served with rich demi-glace sauce." , duration:"~1 hr"},
    { lat:35.6922, lng:139.7006, title:"Komehyo Shinjuku — Vintage Watches", time:"02:30 PM", type:"shop", desc:"Premier authenticated vintage luxury and rare Grand Seiko Japanese market timepieces." , duration:"~1.5 hrs"},
    { lat:35.8948, lng:139.6309, title:"Radiohead — Live at Saitama Super Arena", time:"06:00 PM",   type:"museum",     desc:"Radiohead's headline June 2027 arena tour at Saitama Super Arena. 30 minutes direct from Tokyo/Ginza via JR Ueno-Tokyo Line. 37,000 capacity with peerless acoustics. Doors 17:30, show 19:00. The ultimate musical highlight of the honeymoon." , duration:"~4 hrs"},
    { lat:35.6717, lng:139.7645, title:"Post-Concert Ramen & Highballs, Ginza", time:"10:30 PM",   type:"restaurant", desc:"Celebrate the show with steaming midnight ramen bowls and cold Suntory highballs in Ginza." , duration:"~1 hr"},
  ],
  19: [
    { lat:35.6711, lng:139.7651, title:"Kimuraya Honten Bakery",           time:"09:00 AM",   type:"restaurant", desc:"Japan's oldest bakery (est. 1869), fresh anpan straight from the oven on Ginza's main boulevard." , duration:"~1 hr"},
    { lat:35.6596, lng:139.7631, title:"Hamarikyu Imperial Gardens",       time:"10:30 AM",   type:"nature",     desc:"Edo-period shogun's tidal pond garden surrounded by modern Shiodome skyscrapers. Tea in the floating pavilion." , duration:"~1.5 hrs"},
    { lat:35.6914, lng:139.7003, title:"Curry Lunch at Nakamura-ya, Shinjuku", time:"01:00 PM", type:"restaurant", desc:"Historic 1927 Indo-Japanese spiced curry and short-grain rice before departure." , duration:"~1 hr"},
    { lat:35.5494, lng:139.7798, title:"Haneda International Airport",     time:"04:30 PM",   type:"transit",    desc:"Direct Keikyu line train to Haneda Terminal 3. Relax in the departure lounge before your flight home." , duration:"~2 hrs"},
  ],
};

export const haikus: Record<number, string[]> = {
  1:  ["Old water meets new\nwhere the river bends, a bridge\nKyoto reflects", "Worn tatami holds\ncedar shadows breathe soft light\narrive, then be still"],
  2:  ["A thousand figures\neach gilded face knows the prayer\nsilence fills the hall", "Vermillion gates climb\nthe mountain mist holds the dusk\nfoxes guard the stone"],
  3:  ["Sand cone waits for moon\nthe pavilion ungilded\nsilver needs no proof", "Dashi, then lacquer\nthe recipe three hundred years\nflavor without haste"],
  4:  ["Fifteen stones remain\nno one agrees what they mean\nthat is the whole point", "Press the aching line\nwarm camellia oil soothes\nKikunoi crowns the night"],
  5:  ["Green columns rise straight\nlight dissolves to jade above\nno sound, only stalk", "Fifteen minutes west\nthe ancient quiet dissolves\nOsaka laughs loud"],
  6:  ["Bay beneath the ridge\niron club cuts through clean air\nmorning on the green", "Sizzle on the iron\nmarbled beef dissolves like cream\nKobe in the dark"],
  7:  ["Fifteen meters bronze\nsacred deer bow on the path\nNara holds the calm", "Indigo and cloth\ngriddled cabbage on the heat\nOsaka night hums"],
  8:  ["Three rivers converge\noak remembers what spring said\nsip slowly, one dram", "Trumpets blow the chant\nthirty thousand roar as one\nKoshien comes alive"],
  9:  ["The train folds upward\ncedar ravines grip the rail\nthe mountain yields first", "Mineral waters steam\nhands release the weary spine\npeace on mountain mats"],
  10: ["Sulfur splits the air\nFuji ghosted in the west\nearth is still working", "Bronze figures stand still\npeaks do not know their own names\nboth belong to sky"],
  11: ["Romancecar glides fast\nmountains thin to tower grids\nTokyo begins", "Hinoki counter\nsea urchin shines under light\nfirst bite of the capital"],
  12: ["Fresh ice on the stall\nmorning tuna sliced like glass\nflavour before light", "Thunder Gate looms high\nincense clouds above the stone\nwater bus glides south"],
  13: ["Giants collide hard\nsand sprays in the early light\nancient ritual", "Ten thousand sharp blades\nhand-forged iron holds the edge\ncraft passed down through blood"],
  14: ["Silent cedar path\nforest holds the sacred gate\npeace in the metropolis", "Glass and steel rise tall\nscramble crossing floods the night\nneon fills the veins"],
  15: ["Pencil sketches dream\ncolors leap from cell to sky\nMiyazaki smiles", "Hidetsugu pours\nthree drinks balanced to the grain\nsilence between sips"],
  16: ["Books climb to the roof\narchitecture curves with light\nmorning in the trees", "Canal waters slow\ncoffee drifts through open doors\ntowers glow at dusk"],
  17: ["Vinyl spins in grooves\nindigo and worn wool coats\nindie spirit lives", "Green sanctuary\nlanterns flicker in the lane\nsip in Golden Gai"],
  18: ["Steel dome shakes with sound\nthirty thousand hold their breath\nthe guitars ignite", "Rails hum through the dark\nSaitama lights blur behind\nringing in the ears"],
  19: ["One last garden path\nlanterns fade against the glass\nTokyo bids farewell", "The gate opens last\nclouds unravel in the sky\ncarry what you learned"]
};

export const _H5 = [
  "old stone steps breathe moss","cedar shadows fall","salt dissolves the day",
  "bronze figures stand still","the sea arrives raw","cold iron waits here",
  "light floods the canal","bamboo fills the cup","the train folds backward",
  "green columns rise straight","three rivers converge","worn tatami holds",
  "pine boughs brush the path","lanterns glow at dusk","ink dries on thin wax",
  "jade hills rise and fall","crisp wind off the ridge","clouds unravel slow",
  "silence fills the gate","petals meet the stream","mist erases roads",
];

export const _H7 = [
  "neon signs blur into signs","ando left no more","the forest breathes deep",
  "stone lanterns emerge from leaves","raked stone, clear stream, cedar shade",
  "the whisk turns froth into art","the actor's mask holds the lake",
  "peaks do not know their own names","dashi, then lacquer, then tea",
  "the pendulum marks the year","each gear a piece of the hour",
  "panko sizzles in the oil","two towers share one open sky",
  "tatami glows at twilight","a thousand-year calm descends",
  "the pavilion never speaks","moss does the quiet talking",
  "cherry boughs bend to the stream","froth holds the mountain's shadow",
  "salt, char, and the long cold night","walk slowly through the bamboo",
];

export const _H5b = [
  "Tokyo begins","hold it, feel the edge","breathe in, then release",
  "still water, still trade","Osaka laughs loud","arrive, then be still",
  "carry what you learned","the mountain yields first","this is the whole meal",
  "no sound, only stalk","time assembles still","sip slowly, one dram",
  "sleep in the station","moss keeps the secret","quiet follows you",
  "both belong to sky","walk, then walk again","nothing is explained",
];

export function _genHaiku(seed: string): string {
  const h = (arr: string[], s: number) => arr[Math.abs(s) % arr.length];
  const code = seed.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  return `${h(_H5, code)}\n${h(_H7, code + 3)}\n${h(_H5b, code + 7)}`;
}

export const meals: Record<number, DayMeals> = {
  1:  { breakfast: { text: "In transit — flight into Kansai International Airport", booked: false }, lunch: { text: "Haruka train bento or airport soba counter", booked: false }, dinner: { text: "Higashiyama Obanzai · small seasonal plates and local Kyoto vegetables", booked: true  } },
  2:  { breakfast: { text: "Hyatt Regency breakfast · fresh matcha, seasonal fruit, and Japanese traditional set", booked: false }, lunch: { text: "Soba near Kiyomizu-dera · cold buckwheat noodles with mountain vegetables", booked: false }, dinner: { text: "Fushimi Izakaya · grilled river fish and local sake after the sunset shrine hike", booked: false } },
  3:  { breakfast: { text: "Inoda Coffee Honten · legendary 1940 kissaten, flannel drip coffee and toast", booked: false }, lunch: { text: "Yudofu at Junsei · simmered silken tofu in the historic Nanzen-ji temple garden", booked: true  }, dinner: { text: "Kaiseki at Nakamura · 300-year-old culinary institution (est. 1716)", booked: true  } },
  4:  { breakfast: { text: "Sarasa Nishijin · café in a converted 1920s public bathhouse with heritage tiles", booked: false }, lunch: { text: "Nishiki Market street food · tamagoyaki, fresh yuba, and dashi skewers", booked: false }, dinner: { text: "Kikunoi Honten · 3-Michelin-star grand farewell kaiseki banquet", booked: true  } },
  5:  { breakfast: { text: "Arashiyama riverside bakery and pour-over coffee", booked: false }, lunch: { text: "Nakanoshima riverside café at Conrad Osaka", booked: false }, dinner: { text: "Kushikatsu Daruma Shinsekai · original 1929 crispy panko skewers", booked: true  } },
  6:  { breakfast: { text: "Conrad Osaka 58th-floor breakfast buffet", booked: false }, lunch: { text: "Rokko Mountain clubhouse lunch overlooking Osaka Bay", booked: false }, dinner: { text: "Kobe Beef Teppanyaki at Misono · certified A5 Tajima beef seared tableside", booked: true  } },
  7:  { breakfast: { text: "Conrad Osaka lounge espresso & pastries", booked: false }, lunch: { text: "Nara park teahouse · traditional persimmon-leaf sushi (kaki-no-ha zushi)", booked: false }, dinner: { text: "Okonomiyaki at Fukutaro · savory griddled cabbage pancake with pork belly", booked: false } },
  8:  { breakfast: { text: "Artisan bakery in Umeda", booked: false }, lunch: { text: "Kuromon Market seafood stalls · fresh uni, tuna, and grilled scallops", booked: false }, dinner: { text: "Koshien Stadium bento boxes & Hanshin-branded beer at the baseball game", booked: false } },
  9:  { breakfast: { text: "Ekiben on the Shinkansen speeding past Mount Fuji", booked: false }, lunch: { text: "Hakone-Yumoto buckwheat soba upon mountain arrival", booked: false }, dinner: { text: "Gora Kadan in-room Kaiseki banquet · twelve courses served on ancestral lacquerware", booked: true  } },
  10: { breakfast: { text: "Gora Kadan traditional ryokan breakfast in-room", booked: true  }, lunch: { text: "Owakudani black eggs & volcanic spring ramen", booked: false }, dinner: { text: "Gora Kadan second evening bespoke mountain kaiseki", booked: true  } },
  11: { breakfast: { text: "Bakery & Table Hakone terrace breakfast overlooking Lake Ashi", booked: false }, lunch: { text: "Shinjuku ramen bar upon Tokyo arrival", booked: false }, dinner: { text: "Ginza Hinoki Counter Sushi · seasonal omakase nigiri", booked: true  } },
  12: { breakfast: { text: "Tsukiji Outer Market · tamagoyaki and sea urchin breakfast", booked: false }, lunch: { text: "Tempura Daikokuya Asakusa (1887) · dark sesame oil tempura", booked: true  }, dinner: { text: "Sumida riverfront izakaya · grilled river fish and craft beer", booked: false } },
  13: { breakfast: { text: "Nihonbashi kissaten morning toast and siphon coffee", booked: false }, lunch: { text: "Kanda Yabu Soba (1880) · cold zarusoba with heritage dipping sauce", booked: false }, dinner: { text: "Cotton Club jazz lounge supper plates & wine", booked: false } },
  14: { breakfast: { text: "Aoyama café pour-over coffee and croissants", booked: false }, lunch: { text: "Maisen Tonkatsu Aoyama · crispy pork cutlet in converted bathhouse", booked: false }, dinner: { text: "Nonbei Yokocho · smoky yakitori skewers and cold Sapporo in Shibuya", booked: false } },
  15: { breakfast: { text: "Mitaka bakery morning set before Ghibli entry", booked: false }, lunch: { text: "Kichijoji Harmonica Yokocho · artisan ramen and gyoza counter", booked: false }, dinner: { text: "Bar High Five bespoke cocktails & Ginza small plates", booked: true  } },
  16: { breakfast: { text: "Ivy Place Daikanyama · buttermilk pancakes under the terrace trees", booked: false }, lunch: { text: "Nakameguro riverside soba and cold matcha", booked: false }, dinner: { text: "Roppongi Robata hearth dining · fresh Hokkaido seafood grilled over binchotan", booked: true  } },
  17: { breakfast: { text: "Shimokitazawa specialty coffee roastery and pastries", booked: false }, lunch: { text: "Shinjuku Isetan B2 gourmet food hall selections", booked: false }, dinner: { text: "Omoide Yokocho binchotan yakitori & Golden Gai nightcap", booked: false } },
  18: { breakfast: { text: "Shiseido Parlour Ginza · rooftop coffee and eggs", booked: false }, lunch: { text: "Rengatei Ginza (1900) · the original Japanese omurice", booked: false }, dinner: { text: "Pre/Post-Radiohead concert food · Saitama arena stalls & midnight Ginza ramen", booked: false } },
  19: { breakfast: { text: "Kimuraya Honten Ginza (est. 1869) · warm red bean anpan", booked: false }, lunch: { text: "Nakamura-ya Shinjuku (1927) · foundational Indo-Japanese curry", booked: false }, dinner: { text: "Haneda International Airport lounge before flight home", booked: false } },
};

export const dayMeta: Record<number, { title: string; lodging: string }> = {
  1:  { title: "Day 1: Arrival into the Ancient Capital",             lodging: "Hyatt Regency Kyoto" },
  2:  { title: "Day 2: Thousand Buddhas & the Vermillion Gates",       lodging: "Hyatt Regency Kyoto" },
  3:  { title: "Day 3: Silver Pavilion & 300-Year Kaiseki",            lodging: "Hyatt Regency Kyoto" },
  4:  { title: "Day 4: Zen Rocks, Kyoto Shiatsu & 3-Star Kikunoi",    lodging: "Hyatt Regency Kyoto" },
  5:  { title: "Day 5: Arashiyama, Osaka Castle & Dotonbori",          lodging: "Conrad Osaka" },
  6:  { title: "Day 6: Bayview Golf & Certified Kobe Beef",            lodging: "Conrad Osaka" },
  7:  { title: "Day 7: Ancient Nara Daibutsu, Deer & Vintage Osaka",   lodging: "Conrad Osaka" },
  8:  { title: "Day 8: Whisky Valley & Koshien Stadium",               lodging: "Conrad Osaka" },
  9:  { title: "Day 9: Mountain Mist, Onsen & Ryokan Shiatsu",        lodging: "Gora Kadan" },
  10: { title: "Day 10: Volcanic Vents & Open-Air Sculpture",          lodging: "Gora Kadan" },
  11: { title: "Day 11: Romancecar to Tokyo & Ginza Omakase",          lodging: "Hyatt Centric Ginza" },
  12: { title: "Day 12: Tsukiji Sashimi, Senso-ji & Sumida River",    lodging: "Hyatt Centric Ginza" },
  13: { title: "Day 13: Sumo at Dawn, Damascus Knives & Kanda Soba",   lodging: "Hyatt Centric Ginza" },
  14: { title: "Day 14: Meiji Shrine, Aoyama Gardens & Shibuya Night", lodging: "Hyatt Centric Ginza" },
  15: { title: "Day 15: Studio Ghibli, Inokashira & Bar High Five",    lodging: "Hyatt Centric Ginza" },
  16: { title: "Day 16: Daikanyama T-Site, Nakameguro & Mori Art",     lodging: "Hyatt Centric Ginza" },
  17: { title: "Day 17: Shimokitazawa Vinyl & Shinjuku After Dark",    lodging: "Hyatt Centric Ginza" },
  18: { title: "Day 18: Vintage Watches & Radiohead at Saitama Arena", lodging: "Hyatt Centric Ginza" },
  19: { title: "Day 19: Ginza Morning, Imperial Pond & Departure",     lodging: "Departure Outbound" },
};
