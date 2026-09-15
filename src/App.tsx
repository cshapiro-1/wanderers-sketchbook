"use client";
import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, MapControl, ControlPosition } from '@vis.gl/react-google-maps';
import { Plus, Trash, BookOpen, ChevronDown, ChevronUp, Edit3, Check } from 'lucide-react';

// ── Shared types, store, constants, data ──────────────────────────────────────
export type { Activity, ActivityType, Region } from '@/types';
export { useStore } from '@/store/ui';
import type { Activity, ActivityType, DayMeals, HotelAnchor, Reservation, UserEdits, DocEntry, BookItem, BookUrgency, BookCategory, HotelStop, Phrase, PhraseCategory } from '@/types';
import { useStore } from '@/store/ui';
import { regionColors, regionMap, hotelAnchors, REGION_HEROES, typeIcon, typeLabel, regionGroups, regionMap2 } from '@/constants';
import { activities, haikus, meals, dayMeta, _H5, _H7, _H5b, _genHaiku } from '@/data/activities';
import { restaurantPrices, restaurantNotes, activityPrices } from '@/data/dining';
import { hotelStops } from '@/data/hotels';
import { activityUrls } from '@/data/urls';
import { _phrases, _speak } from '@/data/phrases';
import { bookingItems } from '@/data/booking';
import { transits } from '@/data/transits';

// store, types, constants imported from ./store, ./types, ./constants

const AmbientLayer: React.FC = () => {
  const [fireflies, setFireflies] = useState<{id:number;left:string;top:string;size:string;duration:string}[]>([]);
  const [soots, setSoots] = useState<{id:number;left:string;duration:string}[]>([]);
  useEffect(() => {
    const fInterval = setInterval(() => {
      setFireflies(prev => {
        const next = [...prev, { id:Math.random(), left:`${Math.random()*95}vw`, top:`${40+Math.random()*50}vh`, size:`${3+Math.random()*4}px`, duration:`${5+Math.random()*7}s` }];
        if (next.length > 12) next.shift();
        return next;
      });
    }, 2500);
    const sInterval = setInterval(() => {
      if (Math.random() < 0.3) setSoots(prev => {
        const next = [...prev, { id:Math.random(), left:`${Math.random()*90}vw`, duration:`${8+Math.random()*6}s` }];
        if (next.length > 5) next.shift();
        return next;
      });
    }, 3500);
    return () => { clearInterval(fInterval); clearInterval(sInterval); };
  }, []);
  const fixed: React.CSSProperties = { position:'fixed', inset:0, pointerEvents:'none', overflow:'hidden', zIndex:0 };
  return (
    <div style={fixed}>
      <div style={{ position:'absolute', top:'2.5rem', width:'11rem', height:'4rem', opacity:0.3, background:'#ede6d8', borderRadius:'9999px', filter:'blur(24px)', animation:'cloudDrift 80s linear infinite' }} />
      <div style={{ position:'absolute', top:'11rem', width:'15rem', height:'5rem', opacity:0.2, background:'#ede6d8', borderRadius:'9999px', filter:'blur(24px)', animation:'cloudDrift 110s linear infinite', animationDelay:'-30s' }} />
      {fireflies.map(f => <div key={f.id} style={{ position:'absolute', borderRadius:'50%', background:'#e8a830', opacity:0, boxShadow:'0 0 8px #e8a830', left:f.left, top:f.top, width:f.size, height:f.size, animation:`fireflyFloat ${f.duration} ease-in-out infinite` }} />)}
      {soots.map(s => (
        <div key={s.id} style={{ position:'absolute', width:'12px', height:'12px', background:'#1e1208', borderRadius:'50%', opacity:0, display:'flex', alignItems:'center', justifyContent:'center', left:s.left, top:'-20px', animation:`sootFall ${s.duration} linear forwards` }}>
          <div style={{ position:'absolute', width:'3px', height:'3px', background:'white', borderRadius:'50%', left:'2px', top:'3px' }} />
          <div style={{ position:'absolute', width:'3px', height:'3px', background:'white', borderRadius:'50%', right:'2px', top:'3px' }} />
        </div>
      ))}
    </div>
  );
};

const Header: React.FC = () => {
  const { togglePhrasebook, toggleDocsPage, toggleHotels, toggleFlight, toggleRestaurants, toggleActivities, toggleBooking, toggleAIPlanner, rainMode, toggleRainMode, toggleCurrency, toggleTakkyubin } = useStore();
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>The Wanderer's Sketchbook</h1>
        <p>An 18-Day Journey Through Landscapes, Flavors, and Hidden Valleys</p>
      </div>
      <div className="header-actions">
        <div className="header-btns-desktop">
          <button className={`docs-trigger-btn ${rainMode ? 'active' : ''}`} onClick={toggleRainMode} title="Rain Mode: Weather Alternative Engine" style={{ background: rainMode ? '#5878a0' : undefined, color: rainMode ? '#fff' : undefined }}><span aria-hidden="true">{rainMode ? '🌧️' : '☀️'}</span><span className="btn-label">{rainMode ? ' Rain' : ' Sun'}</span></button>
          <button className="docs-trigger-btn" onClick={toggleCurrency} title="Live Currency & Points Burn"><span aria-hidden="true">💴</span><span className="btn-label"> Rates</span></button>
          <button className="docs-trigger-btn" onClick={toggleTakkyubin} title="Luggage Forwarding (Takkyubin)"><span aria-hidden="true">📦</span><span className="btn-label"> Luggage</span></button>
          <button className="docs-trigger-btn" onClick={downloadIcsCalendar} title="Export Itinerary to Calendar (.ics)"><span aria-hidden="true">📅</span><span className="btn-label"> Export</span></button>
          <button className="docs-trigger-btn" onClick={toggleDocsPage} title="Documents"><span aria-hidden="true">📎</span><span className="btn-label"> Docs</span></button>
          <button className="docs-trigger-btn" onClick={toggleHotels} title="Hotels"><span aria-hidden="true">🏨</span><span className="btn-label"> Hotels</span></button>
          <button className="docs-trigger-btn" onClick={toggleFlight} title="Flights"><span aria-hidden="true">✈</span><span className="btn-label"> Flights</span></button>
          <button className="docs-trigger-btn" onClick={toggleRestaurants} title="Restaurants"><span aria-hidden="true">🍜</span><span className="btn-label"> Dining</span></button>
          <button className="docs-trigger-btn" onClick={toggleActivities} title="Activities"><span aria-hidden="true">🗺</span><span className="btn-label"> Activities</span></button>
          <button className="docs-trigger-btn" onClick={toggleBooking} title="Booking Timeline"><span aria-hidden="true">📅</span><span className="btn-label"> Book</span></button>
          <button className="docs-trigger-btn ai-trigger-btn" onClick={toggleAIPlanner} title="AI Live Planner"><span aria-hidden="true">✦</span><span className="btn-label"> AI</span></button>
          <button className="pb-trigger-btn" onClick={togglePhrasebook} title="Japanese Phrasebook">言葉</button>
        </div>
        <div className="header-btns-mobile">
          <button className="docs-trigger-btn" onClick={toggleRainMode}>{rainMode ? '🌧️' : '☀️'}</button>
          <button className="docs-trigger-btn" onClick={toggleCurrency}>💴</button>
          <button className="docs-trigger-btn ai-trigger-btn" onClick={toggleAIPlanner}>✦ AI</button>
          <button className="pb-trigger-btn" onClick={togglePhrasebook}>言葉</button>
          <div style={{ position: 'relative' }}>
            <button className="mobile-menu-btn" onClick={() => setMenuOpen(v => !v)}>⋯</button>
            {menuOpen && (
              <div className="mobile-menu-dropdown" onClick={() => setMenuOpen(false)}>
                <button onClick={toggleHotels}>🏨 Hotels</button>
                <button onClick={toggleFlight}>✈ Flights</button>
                <button onClick={toggleRestaurants}>🍜 Dining</button>
                <button onClick={toggleActivities}>🗺 Activities</button>
                <button onClick={toggleBooking}>📅 Booking</button>
                <button onClick={toggleTakkyubin}>📦 Luggage (Takkyubin)</button>
                <button onClick={downloadIcsCalendar}>📅 Export to Calendar (.ics)</button>
                <button onClick={toggleDocsPage}>📎 Docs</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

const DayScrollVignette: React.FC<{ acts: Activity[]; day: number }> = ({ acts, day }) => {
  const region = regionMap2[day] || 'tokyo';
  const sH = 220;
  const n = acts.length || 1;
  const H = n * sH;
  const s = day;

  // ── Region palette: [ink, accent, faint] ──────────────────────────────────
  const palette: Record<string, [string, string, string]> = {
    'tokyo':     ['#3a2a1a', '#c87e18', '#b8906040'],
    'izu':       ['#1a3020', '#4a7848', '#4a784830'],
    'hakone':    ['#1a2030', '#5878a0', '#5878a030'],
    'lake-biwa': ['#102828', '#388888', '#38888830'],
    'osaka':     ['#2a1410', '#b84428', '#b8442828'],
    'kyoto':     ['#1e1428', '#7a4a88', '#7a4a8830'],
  };
  const [ink, accent, _glowRaw] = palette[region] ?? palette['tokyo'];
  const faint = ink + '88';

  // ── Region-specific vine path ──────────────────────────────────────────────
  const buildVine = (): string => {
    if (region === 'tokyo') {
      // Angular neon tube: sharp right-angle segments
      const pts: [number, number][] = [];
      for (let i = 0; i <= n * 5; i++) {
        const y = (i / (n * 5)) * H;
        const x = i % 2 === 0 ? 58 + (i % 4) * 8 : 72 + (i % 3) * 7;
        pts.push([x, y]);
      }
      return pts.reduce((p, [x, y], i, arr) => {
        if (i === 0) return `M${x} ${y}`;
        const [px, py] = arr[i - 1];
        // Go horizontal then vertical (neon tube bends)
        return `${p} L${x} ${py} L${x} ${y}`;
      }, '');
    }
    if (region === 'izu') {
      // River: lazy wide curves, meanders
      const vx = (t: number) => 62 + Math.sin(t * 1.4 + s * 0.7) * 24 + Math.cos(t * 2.8) * 8;
      const steps = n * 8;
      const pts = Array.from({ length: steps + 1 }, (_, i) => ({
        x: vx(i / steps * n * Math.PI * 2),
        y: (i / steps) * H,
      }));
      return pts.reduce((p, pt, i, arr) => {
        if (i === 0) return `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        const prev = arr[i - 1];
        const cy = (prev.y + pt.y) / 2;
        return `${p} C${prev.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }, '');
    }
    if (region === 'hakone') {
      // Mountain ridge: jagged rise/fall
      const pts: [number, number][] = [];
      for (let i = 0; i <= n * 6; i++) {
        const y = (i / (n * 6)) * H;
        const peak = i % 3 === 1 ? -18 : (i % 3 === 2 ? 12 : 0);
        const x = 68 + peak + Math.sin(i * 0.9 + s) * 6;
        pts.push([x, y]);
      }
      return pts.reduce((p, [x, y], i, arr) => {
        if (i === 0) return `M${x} ${y}`;
        const [px, py] = arr[i - 1];
        const mx = (x + px) / 2;
        return `${p} Q${mx} ${py} ${x} ${y}`;
      }, '');
    }
    if (region === 'lake-biwa') {
      // Calm wave: gentle sine
      const vx = (t: number) => 68 + Math.sin(t * 1.1 + s * 0.4) * 14 + Math.sin(t * 3.2) * 4;
      const steps = n * 8;
      const pts = Array.from({ length: steps + 1 }, (_, i) => ({
        x: vx(i / steps * n * Math.PI * 2),
        y: (i / steps) * H,
      }));
      return pts.reduce((p, pt, i, arr) => {
        if (i === 0) return `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        const prev = arr[i - 1];
        const cy = (prev.y + pt.y) / 2;
        return `${p} C${prev.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }, '');
    }
    if (region === 'osaka') {
      // Canal: two wavy parallels merged as single path with loops
      const vx = (t: number) => 65 + Math.sin(t * 1.6 + s * 0.8) * 16 + Math.sin(t * 0.5) * 10;
      const steps = n * 6;
      const pts = Array.from({ length: steps + 1 }, (_, i) => ({
        x: vx(i / steps * n * Math.PI * 2),
        y: (i / steps) * H,
      }));
      return pts.reduce((p, pt, i, arr) => {
        if (i === 0) return `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
        const prev = arr[i - 1];
        const cy = (prev.y + pt.y) / 2;
        return `${p} C${prev.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      }, '');
    }
    // kyoto: stepping stone path — vertical with slight sway
    const vx = (t: number) => 66 + Math.sin(t * 1.2 + s * 0.6) * 10;
    const steps = n * 6;
    const pts = Array.from({ length: steps + 1 }, (_, i) => ({
      x: vx(i / steps * n * Math.PI * 2),
      y: (i / steps) * H,
    }));
    return pts.reduce((p, pt, i, arr) => {
      if (i === 0) return `M${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      const prev = arr[i - 1];
      const cy = (prev.y + pt.y) / 2;
      return `${p} C${prev.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${cy.toFixed(1)},${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
    }, '');
  };

  const vinePath = buildVine();

  // ── Vine decoration per region ────────────────────────────────────────────
  // ── Per-activity vine decorations (colorful, activity-specific) ──────────
  // ── Title-specific vine decorations (Full bespoke SVG vignettes for all 18+ days)
  const getTitleDecor = (title: string, c1: string, c2: string, c3: string): React.ReactNode => {
    const tl = title.toLowerCase();
    const i = ink;
    const f = faint;

    // ── 1. Airports & Aviation (Haneda, Narita, KIX) ──────────────────────────
    if (tl.includes('airport') || tl.includes('narita') || tl.includes('haneda') || tl.includes('kix') || tl.includes('kansai international')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Airplane body */}
          <path d="M-18 0 Q-10 -3 0 -2 Q10 -1 18 0 Q10 1 0 2 Q-10 3 -18 0Z" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.2"/>
          {/* Wings */}
          <path d="M-4 -2 L-8 -15 L6 -12 L3 -2" fill={c2} fillOpacity="0.45" stroke={i} strokeWidth="1"/>
          <path d="M6 0 L4 9 L12 8 L10 0" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="0.8"/>
          {/* Tail */}
          <path d="M-14 0 L-18 -9 L-10 -8 L-12 0" fill={c3} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
          {/* Windows */}
          {[-4, 0, 4, 8].map(wx => <circle key={wx} cx={wx} cy={-1} r="1.1" fill={c1} stroke="none"/>)}
          {/* Runway / Jetstream */}
          <line x1="-14" y1="13" x2="14" y2="13" stroke={f} strokeWidth="1.5" strokeDasharray="3,3"/>
          <path d="M-18 16 Q-8 14 0 16 Q8 18 18 16" stroke={c3} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 2. Tokaido & Kyoto Shinkansen (Bullet Train) ──────────────────────────
    if (tl.includes('shinkansen') || tl.includes('bullet train') || tl.includes('nozomi') || tl.includes('hikari') || tl.includes('haruka')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Aerodynamic Shinkansen nose */}
          <path d="M-18 6 Q-6 6 8 4 Q18 2 22 -2 Q18 -5 6 -6 L-18 -6 Z" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          {/* Cockpit canopy */}
          <path d="M8 2 Q14 0 16 -3 Q10 -4 6 -3 Z" fill={c1} fillOpacity="0.7" stroke={i} strokeWidth="0.7"/>
          {/* Passenger windows */}
          {[-14, -8, -2].map(wx => (
            <rect key={wx} x={wx} y="-4" width="4" height="3" rx="0.5" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.5"/>
          ))}
          {/* Speed line & Blue racing stripe */}
          <path d="M-18 1 Q0 1 18 -1" stroke={c1} strokeWidth="1.2"/>
          {/* Rails & Speed motion */}
          <line x1="-22" y1="9" x2="22" y2="9" stroke={i} strokeWidth="1.1"/>
          {[-16, -6, 4, 14].map(sx => <line key={sx} x1={sx} y1="9" x2={sx - 3} y2="13" stroke={f} strokeWidth="0.8"/>)}
          {/* Distant Mt Fuji silhouette */}
          <path d="M8 -9 L14 -19 L20 -9" fill={f} fillOpacity="0.3" stroke={i} strokeWidth="0.7"/>
          <path d="M12 -15 Q14 -16 16 -15" stroke={i} strokeWidth="0.5"/>
        </g>
      );
    }

    // ── 3. Mountain & Scenic Railways (Romancecar, Tozan, Sagano) ─────────────
    if (tl.includes('tozan') || tl.includes('odakyu') || tl.includes('romancecar') || tl.includes('sagano') || tl.includes('scenic train')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Mountain gorge & ridge */}
          <path d="M-22 14 L-12 2 L-2 8 L10 -10 L22 4" stroke={f} strokeWidth="1"/>
          {/* Switchback railway track */}
          <path d="M-20 18 L-4 8 L12 14 L22 2" stroke={c2} strokeWidth="1.6"/>
          {/* Train car */}
          <rect x="-8" y="2" width="18" height="10" rx="1.5" fill={c1} fillOpacity="0.45" stroke={i} strokeWidth="1.1" transform="rotate(-15,1,7)"/>
          {/* Windows */}
          {[-4, 2, 8].map(wx => (
            <rect key={wx} x={wx} y="4" width="4" height="4" rx="0.5" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.5" transform="rotate(-15,1,7)"/>
          ))}
          {/* Cedar pines on mountain */}
          {[-18, 16].map(px => (
            <path key={px} d={`M${px} 12 L${px + 4} 4 L${px + 8} 12 Z`} fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.6"/>
          ))}
        </g>
      );
    }

    // ── 4. Hyatt Centric Ginza Tokyo ──────────────────────────────────────────
    if (tl.includes('centric') || (tl.includes('hyatt') && tl.includes('ginza'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Ginza modern boutique glass tower */}
          <rect x="-12" y="-22" width="24" height="38" rx="1" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.2"/>
          {/* Architectural glass grid */}
          {[0, 1, 2, 3, 4].map(row => (
            [0, 1, 2].map(col => (
              <rect key={`${row}-${col}`} x={-9 + col * 6} y={-19 + row * 6} width="4.5" height="4" rx="0.3"
                fill={c2} fillOpacity={(row + col) % 2 === 0 ? 0.6 : 0.15} stroke={i} strokeWidth="0.4"/>
            ))
          ))}
          {/* Entrance canopy & Ginza street flag */}
          <rect x="-14" y="11" width="28" height="5" rx="0.5" fill={c3} fillOpacity="0.5" stroke={i} strokeWidth="0.9"/>
          <line x1="-16" y1="16" x2="16" y2="16" stroke={i} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 5. Gora Kadan Hakone (Imperial Ryokan) ────────────────────────────────
    if (tl.includes('gora kadan') || (tl.includes('ryokan') && tl.includes('hakone'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Imperial villa hip roof */}
          <path d="M-20 2 L0 -14 L20 2" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1.3"/>
          <path d="M-22 0 L0 -16 L22 0" stroke={f} strokeWidth="0.8"/>
          {/* Traditional wooden villa frame */}
          <rect x="-16" y="2" width="32" height="16" fill={c2} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          {/* Shoji lattices */}
          {[-11, -3, 5].map(sx => (
            <g key={sx}>
              <rect x={sx} y="5" width="6" height="11" rx="0.3" stroke={i} strokeWidth="0.6"/>
              <line x1={sx + 3} y1="5" x2={sx + 3} y2="16" stroke={f} strokeWidth="0.3"/>
              <line x1={sx} y1="10" x2={sx + 6} y2="10" stroke={f} strokeWidth="0.3"/>
            </g>
          ))}
          {/* Hakone pine & mist */}
          <path d="M-20 18 Q-10 15 0 18 Q10 21 20 18" stroke={c3} strokeWidth="1"/>
        </g>
      );
    }

    // ── 6. Conrad Osaka (High-Rise Skyline) ───────────────────────────────────
    if (tl.includes('conrad') || (tl.includes('osaka') && tl.includes('hotel'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Twin modern high-rise skyscraper on Nakanoshima */}
          <rect x="-14" y="-24" width="12" height="42" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          <rect x="2" y="-18" width="12" height="36" fill={c2} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          {/* 40F Sky Lobby observation band */}
          <rect x="-15" y="-14" width="14" height="4" fill={c3} fillOpacity="0.7" stroke={i} strokeWidth="0.7"/>
          {/* River confluence base */}
          <path d="M-22 18 Q-8 14 0 18 Q10 22 22 18" stroke={c2} strokeWidth="1.2"/>
          <path d="M-22 22 Q-8 18 0 22 Q10 26 22 22" stroke={c2} strokeWidth="0.6"/>
        </g>
      );
    }

    // ── 7. Hyatt Regency Kyoto (Higashiyama Zen Hotel) ─────────────────────────
    if (tl.includes('hyatt regency') || (tl.includes('hyatt') && tl.includes('kyoto'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Japanese cedar slat facade */}
          <rect x="-18" y="-4" width="36" height="20" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          <path d="M-20 -4 L0 -14 L20 -4" fill={c2} fillOpacity="0.3" stroke={i} strokeWidth="1.2"/>
          {/* Vertical cedar lattice work */}
          {[-14, -10, -6, -2, 2, 6, 10, 14].map(lx => (
            <line key={lx} x1={lx} y1="-2" x2={lx} y2="14" stroke={f} strokeWidth="0.6"/>
          ))}
          {/* Zen garden rock & bamboo base */}
          <ellipse cx="-8" cy="18" rx="4" ry="2.5" fill={f} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
          <ellipse cx="6" cy="19" rx="5" ry="2" fill={f} fillOpacity="0.4" stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 8. High-End Ginza Sushi Counter (Saito, Sawada, Harutaka) ─────────────
    if (tl.includes('sushi') || tl.includes('saito') || tl.includes('sawada') || tl.includes('harutaka') || tl.includes('nigiri')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Hinoki wooden sushi counter */}
          <rect x="-20" y="8" width="40" height="6" rx="0.5" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1.1"/>
          {/* O-toro Nigiri sushi on geta block */}
          <ellipse cx="-2" cy="0" rx="10" ry="5.5" fill={c2} fillOpacity="0.6" stroke={i} strokeWidth="1.1"/>
          {/* Rice base underneath */}
          <path d="M-10 1 Q-2 6 6 1" stroke={i} strokeWidth="0.8" strokeDasharray="2,1.5"/>
          {/* Shoyu glaze brush stroke */}
          <path d="M-6 -2 Q0 -4 6 -2" stroke={c3} strokeWidth="1.2"/>
          {/* Wasabi leaf / garnish */}
          <path d="M12 -2 Q15 -7 18 -4 Q16 0 12 -2 Z" fill={c2} fillOpacity="0.6" stroke={i} strokeWidth="0.7"/>
          {/* Chopsticks resting */}
          <line x1="-16" y1="4" x2="16" y2="4" stroke={i} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 9. Studio Ghibli Museum (Totoro & Miyazaki Art) ───────────────────────
    if (tl.includes('ghibli') || tl.includes('mitaka') || tl.includes('miyazaki') || tl.includes('totoro')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Totoro / Ghibli silhouette */}
          <ellipse cx="0" cy="4" rx="13" ry="15" fill={c2} fillOpacity="0.3" stroke={i} strokeWidth="1.3"/>
          {/* Pointed ears */}
          <path d="M-8 -9 L-11 -21 L-4 -12" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.1"/>
          <path d="M8 -9 L11 -21 L4 -12" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.1"/>
          {/* Expressive eyes */}
          <circle cx="-5" cy="-1" r="3" fill="white" stroke={i} strokeWidth="0.9"/>
          <circle cx="5" cy="-1" r="3" fill="white" stroke={i} strokeWidth="0.9"/>
          <circle cx="-4" cy="-1" r="1.3" fill={i} stroke="none"/>
          <circle cx="6" cy="-1" r="1.3" fill={i} stroke="none"/>
          {/* Whiskers */}
          <line x1="-12" y1="2" x2="-19" y2="1" stroke={i} strokeWidth="0.8"/>
          <line x1="-12" y1="5" x2="-19" y2="7" stroke={i} strokeWidth="0.8"/>
          <line x1="12" y1="2" x2="19" y2="1" stroke={i} strokeWidth="0.8"/>
          <line x1="12" y1="5" x2="19" y2="7" stroke={i} strokeWidth="0.8"/>
          {/* Belly marks */}
          <path d="M-4 10 Q0 8 4 10" stroke={i} strokeWidth="1"/>
          <path d="M-6 13 Q0 11 6 13" stroke={i} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 10. Meiji Jingu Gyoen (Iris Gardens & Giant Torii) ────────────────────
    if (tl.includes('meiji') || tl.includes('jingu') || tl.includes('gyoen')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Grand wooden Torii Gate */}
          <line x1="-16" y1="16" x2="-16" y2="-10" stroke={c1} strokeWidth="2.2"/>
          <line x1="16" y1="16" x2="16" y2="-10" stroke={c1} strokeWidth="2.2"/>
          <line x1="-20" y1="-8" x2="20" y2="-8" stroke={c1} strokeWidth="2.4"/>
          <line x1="-17" y1="-4" x2="17" y2="-4" stroke={c1} strokeWidth="1.4"/>
          {/* Blooming Iris flowers around pond */}
          {[-8, 0, 8].map((ix, idx) => (
            <g key={ix} transform={`translate(${ix},${4 + (idx % 2) * 3})`}>
              <line x1="0" y1="10" x2="0" y2="0" stroke={c2} strokeWidth="1"/>
              <ellipse cx="0" cy="-2" rx="3.5" ry="5" fill={c3} fillOpacity="0.65" stroke={i} strokeWidth="0.7"/>
            </g>
          ))}
          {/* Pond water */}
          <path d="M-22 17 Q-10 14 0 17 Q10 20 22 17" stroke={c2} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 11. Yurakucho & Omoide Yokocho (Yakitori Alley under Tracks) ───────────
    if (tl.includes('yurakucho') || tl.includes('omoide') || tl.includes('yokocho') || tl.includes('yakitori')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Elevated railway brick arch */}
          <path d="M-20 -4 Q0 -16 20 -4 L20 18 L-20 18 Z" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.2"/>
          <path d="M-14 18 L-14 4 Q0 -4 14 4 L14 18" stroke={i} strokeWidth="1.1"/>
          {/* Skewered Yakitori */}
          {[-6, 0, 6].map(sk => (
            <g key={sk}>
              <line x1={sk} y1="-14" x2={sk} y2="12" stroke={i} strokeWidth="0.9"/>
              {[-8, -3, 2].map(sy => (
                <ellipse key={sy} cx={sk} cy={sy} rx="3" ry="2.2" fill={c2} fillOpacity="0.7" stroke={i} strokeWidth="0.6"/>
              ))}
            </g>
          ))}
          {/* Binchotan charcoal smoke curls */}
          <path d="M-4 -14 Q-8 -22 -4 -28" stroke={f} strokeWidth="0.8"/>
          <path d="M4 -14 Q8 -22 4 -28" stroke={f} strokeWidth="0.8"/>
          {/* Red izakaya lantern */}
          <ellipse cx="-15" cy="-2" rx="3.5" ry="5.5" fill={c3} fillOpacity="0.7" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 12. Bar High Five Ginza (Ueno's Signature Diamond Cocktail) ───────────
    if (tl.includes('high five') || tl.includes('cocktail') || (tl.includes('bar') && tl.includes('ginza'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Elegant crystal cocktail coupe */}
          <path d="M-15 -6 Q0 8 15 -6 Z" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          <line x1="-15" y1="-6" x2="15" y2="-6" stroke={i} strokeWidth="0.8"/>
          {/* Thin stem & base */}
          <line x1="0" y1="5" x2="0" y2="18" stroke={i} strokeWidth="1.3"/>
          <ellipse cx="0" cy="18" rx="8" ry="2" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1"/>
          {/* Hand-carved ice diamond sphere */}
          <polygon points="0,-12 5,-7 0,-2 -5,-7" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.8"/>
          {/* Citrus twist peel */}
          <path d="M12 -8 Q18 -12 14 -4" stroke={c1} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 13. Arashio Stable Sumo Morning Practice (Yokozuna & Dohyo) ───────────
    if (tl.includes('sumo') || tl.includes('arashio') || tl.includes('stable')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Circular Sand Dohyo Ring */}
          <ellipse cx="0" cy="10" rx="18" ry="8" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.3"/>
          <ellipse cx="0" cy="10" rx="14" ry="5.5" stroke={f} strokeWidth="0.7" strokeDasharray="3,2"/>
          {/* Yokozuna Torso & Mawashi belt */}
          <path d="M-8 4 Q-12 -6 -8 -14 Q0 -16 8 -14 Q12 -6 8 4 Z" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Topknot (Chonmage) */}
          <ellipse cx="0" cy="-17" rx="3.5" ry="3" fill={i} stroke="none"/>
          <path d="M-2 -19 Q0 -24 2 -19" stroke={i} strokeWidth="1.2"/>
          {/* Thick Mawashi belt & shimenawa rope */}
          <rect x="-9" y="-2" width="18" height="6" rx="1" fill={c3} fillOpacity="0.7" stroke={i} strokeWidth="1"/>
          {/* Salt purification toss */}
          {[-6, -2, 3, 7].map(sx => <circle key={sx} cx={sx + 4} cy={-10 + sx} r="0.9" fill="white" stroke={i} strokeWidth="0.4"/>)}
        </g>
      );
    }

    // ── 14. Akihabara Electric Town & Retro Games ──────────────────────────────
    if (tl.includes('akihabara') || tl.includes('electric town') || tl.includes('super potato')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Retro Game Boy / Handheld */}
          <rect x="-12" y="-18" width="24" height="36" rx="3" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.2"/>
          {/* Dot matrix screen */}
          <rect x="-8" y="-14" width="16" height="13" rx="1" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.9"/>
          {/* Pixel sprite in screen */}
          <rect x="-3" y="-9" width="6" height="4" rx="0.5" fill={i} stroke="none"/>
          {/* D-pad */}
          <line x1="-7" y1="6" x2="-1" y2="6" stroke={i} strokeWidth="2.2"/>
          <line x1="-4" y1="3" x2="-4" y2="9" stroke={i} strokeWidth="2.2"/>
          {/* A & B buttons */}
          <circle cx="4" cy="7" r="1.8" fill={c3} stroke={i} strokeWidth="0.6"/>
          <circle cx="7" cy="4" r="1.8" fill={c3} stroke={i} strokeWidth="0.6"/>
        </g>
      );
    }

    // ── 15. GIGO Akihabara Arcade (UFO Catcher & Taiko) ────────────────────────
    if (tl.includes('gigo') || tl.includes('arcade') || tl.includes('crane')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Crane / UFO Catcher Claw */}
          <line x1="0" y1="-22" x2="0" y2="-12" stroke={i} strokeWidth="1.5"/>
          <circle cx="0" cy="-10" r="3" fill={c1} stroke={i} strokeWidth="1"/>
          {/* 3 Prongs */}
          <path d="M-3 -9 Q-10 -4 -8 2" stroke={i} strokeWidth="1.2"/>
          <path d="M3 -9 Q10 -4 8 2" stroke={i} strokeWidth="1.2"/>
          {/* Prize plush / sphere */}
          <circle cx="0" cy="8" rx="8" ry="8" fill={c2} fillOpacity="0.5" stroke={i} strokeWidth="1.1"/>
          {/* Arcade cabinet glow */}
          <rect x="-16" y="-18" width="32" height="36" rx="2" stroke={f} strokeWidth="0.8" strokeDasharray="3,2"/>
        </g>
      );
    }

    // ── 16. Kanda Yabu Soba (Slate Buckwheat Noodles & Tokkuri) ────────────────
    if (tl.includes('soba') || tl.includes('yabu') || tl.includes('kanda')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Square bamboo seiro steamer tray */}
          <rect x="-15" y="0" width="30" height="16" rx="1" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.1"/>
          {/* Slate buckwheat noodles mound */}
          <ellipse cx="0" cy="4" rx="12" ry="7" fill={c2} fillOpacity="0.45" stroke={i} strokeWidth="0.9"/>
          {[-8, -3, 2, 7].map(nx => <path key={nx} d={`M${nx} 1 Q${nx + 2} 7 ${nx + 4} 3`} stroke={i} strokeWidth="0.7"/>)}
          {/* Tokkuri dipping sauce flask & cup */}
          <path d="M12 -12 Q10 -16 13 -18 L17 -18 Q20 -16 18 -12 Q21 -8 19 -3 Q16 1 12 -3 Z" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.8"/>
          {/* Chopsticks */}
          <line x1="-18" y1="-8" x2="2" y2="12" stroke={i} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 17. Kappabashi Knife Street (Artisan Damascus Blades) ──────────────────
    if (tl.includes('knife') || tl.includes('kappabashi')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Santoku knife blade with Damascus ripples */}
          <path d="M-18 4 L12 -8 Q20 -10 20 -4 Q18 2 12 3 L-18 8 Z" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          <path d="M-10 1 Q-4 -2 2 0 Q8 2 14 -3" stroke={f} strokeWidth="0.5"/>
          <path d="M-12 4 Q-6 2 0 3 Q6 5 12 0" stroke={f} strokeWidth="0.5"/>
          {/* Traditional wooden handle & rivets */}
          <rect x="-20" y="2" width="10" height="8" rx="1.5" fill={c1} fillOpacity="0.7" stroke={i} strokeWidth="1"/>
          {[-17, -14, -11].map(rx => <circle key={rx} cx={rx} cy="6" r="0.8" fill={i} stroke="none"/>)}
          {/* Whetstone base */}
          <rect x="-14" y="14" width="28" height="6" rx="0.5" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 18. Nekorobi Cat Café Asakusa ─────────────────────────────────────────
    if (tl.includes('cat') || tl.includes('nekorobi') || tl.includes('café') || tl.includes('cafe')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Curled sleeping cat body */}
          <ellipse cx="0" cy="4" rx="14" ry="10" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          {/* Head & ears */}
          <circle cx="8" cy="0" r="6" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          <polygon points="6,-5 9,-11 12,-4" fill={c2} stroke={i} strokeWidth="0.8"/>
          <polygon points="11,-4 14,-10 16,-3" fill={c2} stroke={i} strokeWidth="0.8"/>
          {/* Sleeping eye arc */}
          <path d="M8 0 Q10 2 12 0" stroke={i} strokeWidth="0.9"/>
          {/* Curled tail */}
          <path d="M-12 6 Q-18 2 -14 -4 Q-10 -4 -10 0" stroke={i} strokeWidth="1.2"/>
          {/* Whiskers */}
          <line x1="12" y1="2" x2="18" y2="1" stroke={i} strokeWidth="0.6"/>
          <line x1="12" y1="4" x2="18" y2="5" stroke={i} strokeWidth="0.6"/>
        </g>
      );
    }

    // ── 19. Tempura Daikokuya Asakusa ─────────────────────────────────────────
    if (tl.includes('tempura') || tl.includes('daikokuya')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Giant Crispy Battered Tiger Prawn */}
          <path d="M-12 12 Q-4 4 6 -2 Q14 -6 18 -14 Q14 -12 10 -6 Q2 2 -8 10 Z" fill={c1} fillOpacity="0.55" stroke={i} strokeWidth="1.2"/>
          {/* Prawn tail fan */}
          <path d="M18 -14 L22 -19 L19 -13 L23 -16" stroke={c3} strokeWidth="1.1"/>
          {/* Tempura crunchy texture */}
          {[-6, 0, 6].map(tx => <line key={tx} x1={tx} y1={2 - tx * 0.5} x2={tx + 3} y2={4 - tx * 0.5} stroke={f} strokeWidth="0.5"/>)}
          {/* Dipping sauce bowl with tensuyu & daikon */}
          <path d="M-18 8 Q-12 4 -6 8 Q-4 14 -12 14 Q-20 14 -18 8 Z" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 20. Cotton Club Marunouchi (Live Jazz & Brass) ─────────────────────────
    if (tl.includes('cotton club') || (tl.includes('jazz') && tl.includes('marunouchi'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Brass Saxophone silhouette */}
          <path d="M-8 -18 L-8 6 Q-8 14 0 14 Q8 14 8 6 L8 -2 Q8 -6 14 -6 Q18 -6 18 0 Q18 8 10 10" stroke={i} strokeWidth="1.3" fill={c1} fillOpacity="0.4"/>
          {/* Sax horn bell */}
          <ellipse cx="14" cy="-4" rx="4" ry="7" fill={c2} fillOpacity="0.6" stroke={i} strokeWidth="1"/>
          {/* Musical floating notes */}
          <path d="M-12 -6 L-12 -14 L-4 -16 L-4 -8" stroke={c3} strokeWidth="1"/>
          <ellipse cx="-13" cy="-5" rx="2" ry="1.5" fill={c3} stroke="none"/>
          <ellipse cx="-5" cy="-7" rx="2" ry="1.5" fill={c3} stroke="none"/>
        </g>
      );
    }

    // ── 21. Seiko Museum & Vintage Watches (Komehyo Shinjuku) ─────────────────
    if (tl.includes('seiko') || tl.includes('watch') || tl.includes('komehyo')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Precision watch case */}
          <circle cx="0" cy="0" r="14" fill={c2} fillOpacity="0.2" stroke={i} strokeWidth="1.4"/>
          <circle cx="0" cy="0" r="11" stroke={i} strokeWidth="0.7"/>
          {/* Hour markers */}
          {[0, 90, 180, 270].map(a => {
            const rad = (a * Math.PI) / 180;
            return (
              <line key={a} x1={(Math.cos(rad) * 7).toFixed(1)} y1={(Math.sin(rad) * 7).toFixed(1)}
                x2={(Math.cos(rad) * 10.5).toFixed(1)} y2={(Math.sin(rad) * 10.5).toFixed(1)} stroke={i} strokeWidth="1.4"/>
            );
          })}
          {/* Hands & Tourbillon balance */}
          <line x1="0" y1="2" x2="0" y2="-7" stroke={i} strokeWidth="1.4"/>
          <line x1="0" y1="2" x2="5" y2="-2" stroke={i} strokeWidth="1"/>
          <circle cx="0" cy="4" r="3" fill={c1} fillOpacity="0.5" stroke={i} strokeWidth="0.6"/>
          {/* Strap brackets */}
          <rect x="-5" y="-20" width="10" height="6" rx="1" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="0.8"/>
          <rect x="-5" y="14" width="10" height="6" rx="1" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 22. Rengatei Ginza (Original Omurice & Demi-Glace) ─────────────────────
    if (tl.includes('omurice') || tl.includes('rengatei')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Oval porcelain serving dish */}
          <ellipse cx="0" cy="8" rx="18" ry="9" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          {/* Silky Golden Omelette Dome */}
          <ellipse cx="0" cy="4" rx="13" ry="7.5" fill={c2} fillOpacity="0.65" stroke={i} strokeWidth="1.2"/>
          {/* Center cut slice */}
          <path d="M-10 4 Q0 1 10 4" stroke={i} strokeWidth="0.9"/>
          {/* Rich demi-glace sauce drizzle */}
          <path d="M-6 0 Q0 -3 6 0 Q10 4 4 8 Q-2 10 -6 0 Z" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="0.8"/>
          {/* Silver fork */}
          <line x1="-16" y1="-8" x2="-8" y2="12" stroke={i} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 23. Yasukuni Shrine & Yushukan (Memorial & Zero Fighter) ──────────────
    if (tl.includes('yasukuni') || tl.includes('yushukan')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Grand Bronze Torii Gate */}
          <line x1="-16" y1="16" x2="-16" y2="-2" stroke={i} strokeWidth="1.8"/>
          <line x1="16" y1="16" x2="16" y2="-2" stroke={i} strokeWidth="1.8"/>
          <line x1="-20" y1="0" x2="20" y2="0" stroke={i} strokeWidth="2"/>
          {/* Mitsubishi Zero fighter silhouette above */}
          <path d="M-10 -14 Q0 -18 10 -14 Q5 -11 0 -11 Q-5 -11 -10 -14 Z" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          <line x1="0" y1="-20" x2="0" y2="-8" stroke={i} strokeWidth="1.1"/>
          <circle cx="-4" cy="-14" r="1.5" fill={c3} stroke="none"/>
          <circle cx="4" cy="-14" r="1.5" fill={c3} stroke="none"/>
        </g>
      );
    }

    // ── 24. Pachinko Parlour Kabukicho ────────────────────────────────────────
    if (tl.includes('pachinko')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Pachinko frame & pins */}
          <rect x="-14" y="-18" width="28" height="36" rx="2" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.2"/>
          {/* Pin grid array */}
          {[-8, -3, 2, 7].map(px => (
            [-10, -4, 2, 8].map(py => (
              <circle key={`${px}-${py}`} cx={px} cy={py} r="0.6" fill={i} stroke="none"/>
            ))
          ))}
          {/* Cascading metallic balls */}
          {[-6, 0, 5].map((bx, bi) => (
            <circle key={bx} cx={bx} cy={-12 + bi * 8} r="2" fill={c2} fillOpacity="0.8" stroke={i} strokeWidth="0.6"/>
          ))}
          {/* Winning pocket */}
          <path d="M-4 12 Q0 16 4 12" stroke={c3} strokeWidth="1.5"/>
        </g>
      );
    }

    // ── 25. Kabukicho & Golden Gai (Neon & Tiny 6-Seat Bars) ───────────────────
    if (tl.includes('kabukicho') || tl.includes('golden gai')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Iconic Kabukicho red gateway arch */}
          <rect x="-16" y="-16" width="32" height="24" rx="2" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.3"/>
          <rect x="-12" y="-12" width="24" height="16" rx="1" fill={c2} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
          {/* Golden Gai narrow bar doorway */}
          <rect x="-10" y="6" width="8" height="14" rx="0.5" stroke={i} strokeWidth="1"/>
          <rect x="2" y="6" width="8" height="14" rx="0.5" stroke={i} strokeWidth="1"/>
          {/* Glowing lantern */}
          <ellipse cx="0" cy="0" rx="3" ry="5" fill={c3} fillOpacity="0.8" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 26. Nezu Museum Gardens (Bamboo Path & Irises) ────────────────────────
    if (tl.includes('nezu')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Bamboo wall & strolling path */}
          {[-16, -10, 10, 16].map(bx => (
            <g key={bx}>
              <line x1={bx} y1="-16" x2={bx} y2="16" stroke={c2} strokeWidth="1.6"/>
              {[-8, 0, 8].map(by => <line key={by} x1={bx - 2} y1={by} x2={bx + 2} y2={by} stroke={i} strokeWidth="0.6"/>)}
            </g>
          ))}
          {/* Traditional stone garden lantern (Ishidoro) */}
          <rect x="-4" y="-8" width="8" height="6" rx="0.5" fill={c1} fillOpacity="0.6" stroke={i} strokeWidth="1"/>
          <path d="M-6 -8 L0 -14 L6 -8 Z" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          <rect x="-2" y="-2" width="4" height="16" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="0.9"/>
          {/* Stepping stone path */}
          <ellipse cx="0" cy="18" rx="6" ry="2.5" fill={f} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 27. Shibuya Scramble Crossing ─────────────────────────────────────────
    if (tl.includes('shibuya') || tl.includes('scramble')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Diagonal pedestrian zebra crossing stripes */}
          {[-12, -6, 0, 6, 12].map(lx => (
            <line key={lx} x1={lx - 6} y1="-12" x2={lx + 6} y2="16" stroke={c2} strokeWidth="2.8" strokeOpacity="0.6"/>
          ))}
          {/* Bustling crowd dots */}
          {[[-8, -2], [-2, 4], [4, -4], [8, 6], [0, 12]].map(([cx, cy], ci) => (
            <circle key={ci} cx={cx} cy={cy} r="1.8" fill={c1} stroke={i} strokeWidth="0.6"/>
          ))}
          {/* Towering neon billboards */}
          <rect x="-18" y="-20" width="8" height="16" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
          <rect x="10" y="-22" width="9" height="18" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 28. Nakamura-ya Shinjuku (Historic 1927 Curry) ────────────────────────
    if (tl.includes('curry') || tl.includes('nakamura')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Classic stainless Aladdin curry gravy boat */}
          <path d="M-12 4 Q-16 -4 -6 -6 Q6 -8 16 -2 Q20 2 12 6 Q0 8 -12 4 Z" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Spout pouring aromatic curry */}
          <path d="M16 -2 Q22 4 18 10" stroke={c3} strokeWidth="1.5"/>
          {/* Steamed rice mound */}
          <ellipse cx="-2" cy="12" rx="14" ry="7" fill="white" fillOpacity="0.7" stroke={i} strokeWidth="1"/>
          {/* Fukujinzuke red pickles */}
          <ellipse cx="6" cy="10" rx="3" ry="1.5" fill={c2} stroke="none"/>
        </g>
      );
    }

    // ── 29. Shinjuku Gyoen National Garden ────────────────────────────────────
    if (tl.includes('shinjuku gyoen') || (tl.includes('gyoen') && tl.includes('shinjuku'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Traditional teahouse pavilion & wisteria trellis */}
          <path d="M-16 -4 L0 -14 L16 -4" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.2"/>
          <rect x="-12" y="-4" width="24" height="14" fill={c2} fillOpacity="0.2" stroke={i} strokeWidth="1"/>
          {/* Scenic arched wooden bridge */}
          <path d="M-18 14 Q0 6 18 14" stroke={c3} strokeWidth="1.8"/>
          {/* Garden pond reflection & weeping branches */}
          <path d="M-20 18 Q0 15 20 18" stroke={c2} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 30. Shinjuku Jazz Kissa & Listening Bar (Vinyl & Whisky) ──────────────
    if (tl.includes('jazz') || tl.includes('kissa') || tl.includes('vinyl') || tl.includes('listening bar')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Turntable & spinning vinyl LP */}
          <circle cx="-6" cy="0" r="14" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.3"/>
          {[5, 8, 11].map(r => <circle key={r} cx="-6" cy="0" r={r} stroke={i} strokeWidth="0.4" strokeOpacity="0.6"/>)}
          <circle cx="-6" cy="0" r="3" fill={c1} stroke={i} strokeWidth="0.7"/>
          {/* Turntable tonearm */}
          <line x1="8" y1="-14" x2="3" y2="4" stroke={i} strokeWidth="1.3"/>
          <circle cx="8" cy="-14" r="2.5" fill={c2} stroke={i} strokeWidth="0.8"/>
          {/* Whisky tumbler with spherical ice */}
          <rect x="10" y="2" width="9" height="12" rx="1" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.9"/>
          <circle cx="14.5" cy="8" r="3" fill="white" fillOpacity="0.7" stroke={i} strokeWidth="0.5"/>
        </g>
      );
    }

    // ── 31. Gyoza Standing Bar (Pan-Fried with Crispy Skirt) ───────────────────
    if (tl.includes('gyoza')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Cast iron pan / plate */}
          <ellipse cx="0" cy="8" rx="18" ry="9" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.1"/>
          {/* Row of 3 crispy-bottomed pleated gyoza */}
          {[-8, 0, 8].map(gx => (
            <g key={gx}>
              <path d={`M${gx - 5} 4 Q${gx} -4 ${gx + 5} 4 Q${gx + 3} 9 ${gx - 3} 9 Z`} fill={c2} fillOpacity="0.7" stroke={i} strokeWidth="1"/>
              {/* Pleats on top */}
              <line x1={gx - 2} y1="-1" x2={gx - 1} y2="3" stroke={i} strokeWidth="0.6"/>
              <line x1={gx + 2} y1="-1" x2={gx + 1} y2="3" stroke={i} strokeWidth="0.6"/>
            </g>
          ))}
          {/* Crispy golden lace skirt */}
          <path d="M-14 8 Q0 12 14 8" stroke={c3} strokeWidth="1.4" strokeDasharray="3,1"/>
        </g>
      );
    }

    // ── 32. Hakone Open-Air Museum (Henry Moore Sculptures) ───────────────────
    if (tl.includes('open-air') || (tl.includes('museum') && tl.includes('hakone'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Monumental abstract sculpture */}
          <path d="M-12 14 Q-16 2 -10 -6 Q-4 -14 2 -10 Q8 -4 4 6 Q0 14 2 16" fill={c1} fillOpacity="0.45" stroke={i} strokeWidth="1.3"/>
          <circle cx="8" cy="-4" r="7" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1"/>
          {/* Stone pedestal */}
          <rect x="-14" y="14" width="28" height="5" rx="0.5" fill={c3} fillOpacity="0.5" stroke={i} strokeWidth="0.9"/>
          {/* Surrounding mountain ridge */}
          <path d="M-22 18 L-14 10 L-4 14 L8 6 L18 12 L22 18" stroke={f} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 33. Gora Kadan Morning Onsen (Rotenburo Mist) ─────────────────────────
    if (tl.includes('onsen') || tl.includes('bath') || tl.includes('springs')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Natural stone outdoor onsen bath */}
          <ellipse cx="0" cy="8" rx="17" ry="8" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.3"/>
          <ellipse cx="0" cy="8" rx="13" ry="5.5" stroke={f} strokeWidth="0.6" strokeDasharray="2,2"/>
          {/* Rising hot mineral steam curls */}
          {[-8, -2, 4, 10].map(sx => (
            <path key={sx} d={`M${sx} 4 Q${sx - 4} -4 ${sx} -12`} stroke={f} strokeWidth="0.9"/>
          ))}
          {/* Cedar wooden bucket & towel */}
          <rect x="10" y="0" width="7" height="6" rx="0.5" fill={c1} fillOpacity="0.6" stroke={i} strokeWidth="0.8"/>
          {/* Distant morning mountain */}
          <path d="M-16 -8 L-8 -18 L0 -8" stroke={f} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 34. Owakudani Volcanic Vents & Black Eggs (Kuro-tamago) ────────────────
    if (tl.includes('owakudani') || tl.includes('volcanic')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Volcanic crater ridge */}
          <path d="M-22 12 Q-12 4 0 8 Q12 0 22 8" stroke={i} strokeWidth="1.2"/>
          {/* Sulfur steam plumes */}
          {[-10, 0, 10].map(vx => (
            <path key={vx} d={`M${vx} 8 Q${vx - 3} 0 ${vx} -8 Q${vx + 3} -16 ${vx} -22`} stroke={c3} strokeWidth="1.1"/>
          ))}
          {/* Volcanic black eggs (Kuro-tamago) in wire basket */}
          {[-5, 0, 5].map((ex, ei) => (
            <ellipse key={ex} cx={ex} cy={14 - ei * 2} rx="3.5" ry="4.5" fill="#1a1410" stroke={i} strokeWidth="0.8"/>
          ))}
          {/* Mt Fuji on horizon */}
          <path d="M8 -8 L15 -20 L22 -8" fill={f} fillOpacity="0.25" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 35. Nakanoshima Riverside Walk Osaka ──────────────────────────────────
    if (tl.includes('nakanoshima') || (tl.includes('riverside') && tl.includes('osaka'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* River stone arch bridge */}
          <path d="M-22 6 Q0 -4 22 6" stroke={i} strokeWidth="1.4"/>
          {[-14, -6, 2, 10, 18].map(bx => <line key={bx} x1={bx} y1="6" x2={bx} y2="12" stroke={i} strokeWidth="0.8"/>)}
          {/* Flowing river reflections */}
          <path d="M-22 14 Q-8 11 0 14 Q10 17 22 14" stroke={c2} strokeWidth="1.2"/>
          <path d="M-22 18 Q-8 15 0 18 Q10 21 22 18" stroke={c2} strokeWidth="0.6"/>
          {/* Riverside willows & lanterns */}
          <path d="M-16 4 Q-20 -4 -16 -12" stroke={c1} strokeWidth="1"/>
        </g>
      );
    }

    // ── 36. Kushikatsu Daruma Shinsekai (No Double Dipping!) ──────────────────
    if (tl.includes('kushikatsu') || tl.includes('daruma') || tl.includes('shinsekai')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Communal metal sauce vat */}
          <rect x="2" y="-2" width="16" height="16" rx="1.5" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          <line x1="4" y1="2" x2="16" y2="2" stroke={f} strokeWidth="0.5"/>
          {/* Golden breaded skewers */}
          {[-12, -7, -2].map((kx, ki) => (
            <g key={kx}>
              <line x1={kx} y1="-18" x2={kx} y2="10" stroke={i} strokeWidth="1"/>
              <ellipse cx={kx} cy={-8 + ki * 4} rx="3" ry="4" fill={c2} fillOpacity="0.8" stroke={i} strokeWidth="0.7"/>
            </g>
          ))}
          {/* Raw green cabbage wedge */}
          <path d="M-18 6 Q-14 0 -8 4 Q-6 10 -12 12 Z" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 37. Rokko Kokusai Golf Club (Kobe Panoramic Course) ───────────────────
    if (tl.includes('golf') || tl.includes('rokko')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Rolling fairway on mountain ridge */}
          <path d="M-22 10 Q-8 2 4 6 Q14 10 22 4" stroke={i} strokeWidth="1.2"/>
          <path d="M-22 16 Q0 10 22 14" stroke={f} strokeWidth="0.7"/>
          {/* Flagstick & fluttering pin flag */}
          <line x1="8" y1="-16" x2="8" y2="8" stroke={i} strokeWidth="1.1"/>
          <polygon points="8,-16 18,-11 8,-6" fill={c1} stroke={i} strokeWidth="0.8"/>
          {/* Golf ball near hole */}
          <circle cx="3" cy="7" r="1.8" fill="white" stroke={i} strokeWidth="0.6"/>
          {/* Driver club */}
          <line x1="-14" y1="-16" x2="2" y2="7" stroke={i} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 38. Kobe Kitano District & Weathercock House ──────────────────────────
    if (tl.includes('kitano') || tl.includes('nankinmachi')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* European Victorian brick residence (Kazamidori-no-Yakata) */}
          <rect x="-14" y="-4" width="28" height="20" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          <polygon points="-16,-4 0,-16 16,-4" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Weathercock rooster on spire */}
          <line x1="0" y1="-16" x2="0" y2="-24" stroke={i} strokeWidth="1"/>
          <path d="M-3 -22 Q0 -26 4 -22 Q2 -20 0 -22" fill={c3} stroke={i} strokeWidth="0.7"/>
          {/* Steamed pork bun from Chinatown */}
          <ellipse cx="12" cy="14" rx="4.5" ry="3" fill="white" fillOpacity="0.8" stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 39. Kobe Beef Teppanyaki Misono (Sizzling A5 Wagyu) ───────────────────
    if (tl.includes('kobe beef') || tl.includes('teppanyaki') || tl.includes('misono') || tl.includes('wagyu')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Heavy iron teppan griddle */}
          <rect x="-20" y="8" width="40" height="5" rx="0.5" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.1"/>
          {/* Marbled A5 Wagyu beef cubes */}
          {[-10, -2, 6].map(bx => (
            <rect key={bx} x={bx} y="0" width="6" height="6" rx="0.8" fill={c2} fillOpacity="0.75" stroke={i} strokeWidth="0.8"/>
          ))}
          {/* Crispy golden garlic chips */}
          {[-8, 0, 8].map(gx => <ellipse key={gx} cx={gx} cy="-4" rx="2.2" ry="1.2" fill={c3} stroke={i} strokeWidth="0.5"/>)}
          {/* Chef's metal spatula */}
          <line x1="16" y1="-12" x2="11" y2="4" stroke={i} strokeWidth="1.2"/>
          <rect x="8" y="2" width="7" height="4" rx="0.5" fill={c1} fillOpacity="0.5" stroke={i} strokeWidth="0.7" transform="rotate(-30,11,4)"/>
        </g>
      );
    }

    // ── 40. Suntory Yamazaki Distillery (Copper Stills & Casks) ───────────────
    if (tl.includes('suntory') || tl.includes('yamazaki') || tl.includes('distillery')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Majestic Copper Swan-Neck Pot Still */}
          <path d="M-14 16 Q-18 10 -16 4 Q-12 -2 -8 0 Q-4 2 -6 8 Q-4 16 -6 16 Z" fill={c1} fillOpacity="0.5" stroke={i} strokeWidth="1.2"/>
          <path d="M-10 2 Q-6 -6 -6 -14 Q-4 -18 4 -16" stroke={i} strokeWidth="1.1"/>
          {/* Charred White Oak Whisky Barrel */}
          <ellipse cx="10" cy="6" rx="8" ry="10" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.1"/>
          {[-4, 0, 4].map(by => <line key={by} x1="2" y1={6 + by} x2="18" y2={6 + by} stroke={f} strokeWidth="0.5"/>)}
          {/* Tasting glass */}
          <path d="M-18 -4 L-16 4 L-10 4 L-8 -4 Z" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 41. Kuromon Ichiba Market Osaka ───────────────────────────────────────
    if (tl.includes('kuromon') || tl.includes('ichiba') || tl.includes('market')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Market arcade glass roof */}
          <path d="M-22 -4 Q0 -12 22 -4" stroke={i} strokeWidth="1.3"/>
          <line x1="-20" y1="-3" x2="-20" y2="18" stroke={i} strokeWidth="0.8"/>
          <line x1="20" y1="-3" x2="20" y2="18" stroke={i} strokeWidth="0.8"/>
          {/* Giant hanging market lantern */}
          <ellipse cx="0" cy="0" rx="6" ry="8" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="1"/>
          {/* Fresh Uni (Sea Urchin in shell) */}
          <circle cx="-10" cy="12" r="5" fill={c1} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
          {[0, 60, 120, 180, 240, 300].map(a => {
            const rad = (a * Math.PI) / 180;
            return <line key={a} x1={-10 + Math.cos(rad) * 4} y1={12 + Math.sin(rad) * 4} x2={-10 + Math.cos(rad) * 7} y2={12 + Math.sin(rad) * 7} stroke={i} strokeWidth="0.6"/>;
          })}
        </g>
      );
    }

    // ── 42. Fukutaro Okonomiyaki Osaka ────────────────────────────────────────
    if (tl.includes('okonomiyaki') || tl.includes('fukutaro')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Sizzling cabbage pancake */}
          <ellipse cx="0" cy="6" rx="15" ry="10" fill={c1} fillOpacity="0.45" stroke={i} strokeWidth="1.2"/>
          {/* Japanese mayo lattice */}
          <path d="M-10 4 Q-5 0 0 4 Q5 8 10 4" stroke="white" strokeWidth="1.4" fill="none"/>
          <path d="M-10 8 Q-5 4 0 8 Q5 12 10 8" stroke="white" strokeWidth="1.4" fill="none"/>
          {/* Dancing bonito flakes (Katsuobushi) */}
          {[[-6, 2], [0, -2], [6, 2]].map(([bx, by], bi) => (
            <path key={bi} d={`M${bx - 3} ${by} Q${bx} ${by - 4} ${bx + 3} ${by}`} stroke={c2} strokeWidth="0.9"/>
          ))}
          {/* Metal teko spatula */}
          <line x1="16" y1="-8" x2="10" y2="8" stroke={i} strokeWidth="1.3"/>
          <rect x="8" y="6" width="7" height="4" rx="0.5" fill={c3} stroke={i} strokeWidth="0.7" transform="rotate(-30,11,8)"/>
        </g>
      );
    }

    // ── 43. Nara: Todai-ji Daibutsu & Bowing Sika Deer ────────────────────────
    if (tl.includes('nara') || tl.includes('todai-ji') || tl.includes('deer')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Sika Deer with majestic antlers */}
          <ellipse cx="-8" cy="6" rx="7" ry="5.5" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.1"/>
          <circle cx="-8" cy="-6" r="3.5" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          {/* Antlers */}
          <path d="M-10 -9 L-14 -18 M-12 -14 L-8 -15" stroke={i} strokeWidth="0.9"/>
          <path d="M-6 -9 L-3 -17 M-5 -13 L-1 -14" stroke={i} strokeWidth="0.9"/>
          {/* Todai-ji Great Buddha Hall roofline */}
          <polygon points="2,-4 14,-14 26,-4" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          <rect x="4" y="-4" width="20" height="16" fill={c2} fillOpacity="0.2" stroke={i} strokeWidth="1"/>
          <circle cx="14" cy="2" r="3" fill={c3} fillOpacity="0.7" stroke="none"/>
        </g>
      );
    }

    // ── 44. Dotonbori Canal Walk (Glico Man & Neon) ───────────────────────────
    if (tl.includes('dotonbori')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Glico Running Man silhouette */}
          <circle cx="-10" cy="-14" r="3" fill={c1} stroke={i} strokeWidth="0.9"/>
          <line x1="-10" y1="-11" x2="-10" y2="-3" stroke={i} strokeWidth="1.2"/>
          <path d="M-10 -9 L-16 -5 M-10 -9 L-4 -5" stroke={i} strokeWidth="1.1"/>
          <path d="M-10 -3 L-15 4 M-10 -3 L-5 2" stroke={i} strokeWidth="1.1"/>
          {/* Giant mechanical crab claw */}
          <path d="M6 -10 Q14 -14 18 -8 Q16 -4 10 -6 Z" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="0.9"/>
          <path d="M12 -6 Q18 -2 16 2" stroke={i} strokeWidth="0.9"/>
          {/* Canal water with neon reflections */}
          <path d="M-22 14 Q-8 11 0 14 Q10 17 22 14" stroke={c2} strokeWidth="1.2"/>
          <line x1="-12" y1="16" x2="-6" y2="20" stroke={c1} strokeWidth="0.8"/>
          <line x1="4" y1="16" x2="10" y2="20" stroke={c3} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 45. Osaka Castle & Nishinomaru Garden ─────────────────────────────────
    if (tl.includes('osaka castle') || tl.includes('nishinomaru')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* 3-Tier Main Keep */}
          <rect x="-14" y="6" width="28" height="10" fill={c2} fillOpacity="0.3" stroke={i} strokeWidth="1"/>
          <rect x="-11" y="0" width="22" height="8" fill={c2} fillOpacity="0.25" stroke={i} strokeWidth="0.9"/>
          <rect x="-8" y="-6" width="16" height="8" fill={c2} fillOpacity="0.2" stroke={i} strokeWidth="0.8"/>
          {/* Curved gabled roofs */}
          <path d="M-16 6 L0 0 L16 6" fill={c1} fillOpacity="0.45" stroke={i} strokeWidth="1.1"/>
          <path d="M-13 0 L0 -6 L13 0" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          <path d="M-10 -6 L0 -12 L10 -6" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="0.9"/>
          {/* Golden Shachihoko fish ornament */}
          <path d="M-8 -12 Q-10 -16 -6 -14" stroke={c3} strokeWidth="1"/>
          <path d="M8 -12 Q10 -16 6 -14" stroke={c3} strokeWidth="1"/>
          {/* Stone moat foundation */}
          <path d="M-20 18 L-16 12 L16 12 L20 18" fill={c3} fillOpacity="0.3" stroke={i} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 46. Amerika-mura Shinsaibashi ────────────────────────────────────────
    if (tl.includes('amerika') || tl.includes('shinsaibashi')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Vintage American Denim Jacket */}
          <path d="M-12 -12 L-4 -16 L4 -16 L12 -12 L16 -4 L10 0 L10 12 L-10 12 L-10 0 L-16 -4 Z" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Collar & brass buttons */}
          <path d="M-4 -16 L0 -10 L4 -16" stroke={i} strokeWidth="1"/>
          {[-4, 2, 8].map(by => <circle key={by} cx="0" cy={by} r="0.8" fill={c3} stroke="none"/>)}
          {/* Peace on Earth / street art motif */}
          <circle cx="0" cy="18" r="3.5" stroke={c2} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 47. Wanaka Takoyaki Shinsaibashi ──────────────────────────────────────
    if (tl.includes('takoyaki') || tl.includes('wanaka')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Traditional wooden boat tray */}
          <path d="M-18 10 Q0 16 18 10 L16 4 Q0 10 -16 4 Z" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1"/>
          {/* 3 Hot Takoyaki spheres */}
          {[-10, 0, 10].map(tx => (
            <g key={tx}>
              <circle cx={tx} cy="2" r="5.5" fill={c2} fillOpacity="0.75" stroke={i} strokeWidth="1.1"/>
              {/* Octopus piece core */}
              <circle cx={tx} cy="2" r="1.5" fill={c3} stroke="none"/>
            </g>
          ))}
          {/* Dancing bonito flakes & steam */}
          <path d="M-8 -6 Q-4 -12 0 -6" stroke={c3} strokeWidth="0.9"/>
          <path d="M2 -6 Q6 -12 10 -6" stroke={c3} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 48. Hanshin Tigers at Koshien Stadium (Baseball Frenzy) ───────────────
    if (tl.includes('hanshin') || tl.includes('koshien') || tl.includes('baseball') || tl.includes('tigers')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Crossed wooden baseball bats */}
          <line x1="-16" y1="16" x2="16" y2="-12" stroke={i} strokeWidth="1.4"/>
          <line x1="16" y1="16" x2="-16" y2="-12" stroke={i} strokeWidth="1.4"/>
          {/* Official baseball with red seams */}
          <circle cx="0" cy="0" r="8" fill="white" stroke={i} strokeWidth="1.2"/>
          <path d="M-4 -6 Q-2 0 -4 6" stroke={c3} strokeWidth="0.9"/>
          <path d="M4 -6 Q2 0 4 6" stroke={c3} strokeWidth="0.9"/>
          {/* Hanshin Tigers striped cheer horn / jet balloon */}
          <path d="M-8 -16 L-14 -22 L-10 -24 L-4 -18 Z" fill={c2} fillOpacity="0.8" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 49. Sanjusangen-do (1,001 Gilded Kannon Statues) ───────────────────────
    if (tl.includes('sanjusangen') || tl.includes('kannon')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Long wooden temple hall facade */}
          <rect x="-20" y="2" width="40" height="14" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          <path d="M-22 2 L0 -8 L22 2" stroke={i} strokeWidth="1.2"/>
          {/* Serried ranks of golden Kannon halos */}
          {[-12, -6, 0, 6, 12].map(kx => (
            <g key={kx}>
              <circle cx={kx} cy="-1" r="3.5" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="0.7"/>
              <ellipse cx={kx} cy="7" rx="2" ry="4" fill={c3} fillOpacity="0.5" stroke="none"/>
            </g>
          ))}
        </g>
      );
    }

    // ── 50. Higashiyama: Sannen-zaka, Ninenzaka & Yasaka Pagoda ───────────────
    if (tl.includes('sannen') || tl.includes('ninenzaka') || (tl.includes('higashiyama') && !tl.includes('obanzai'))) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Five-Story Yasaka Pagoda silhouette */}
          {[0, 1, 2, 3, 4].map(tier => (
            <g key={tier}>
              <rect x={-8 + tier * 1.5} y={-18 + tier * 6.5} width={16 - tier * 3} height={5.5} fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="0.8"/>
              <path d={`M${-10 + tier * 1.5} ${-18 + tier * 6.5} L0 ${-22 + tier * 6.5} L${10 - tier * 1.5} ${-18 + tier * 6.5}`} fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.9"/>
            </g>
          ))}
          <line x1="0" y1="-22" x2="0" y2="-26" stroke={i} strokeWidth="0.9"/>
          {/* Sloping stone-paved machiya street */}
          <path d="M-22 18 L22 12" stroke={i} strokeWidth="1.2"/>
          {[-14, -6, 4, 14].map(sx => <ellipse key={sx} cx={sx} cy={16 - sx * 0.15} rx="3" ry="1.5" fill={f} stroke={i} strokeWidth="0.5"/>)}
        </g>
      );
    }

    // ── 51. Fushimi Inari Taisha (Endless Torii Tunnel & Kitsune) ──────────────
    if (tl.includes('fushimi inari') || tl.includes('inari')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Receding tunnel of vermillion Torii Gates */}
          {[-8, -4, 0].map((tz, idx) => {
            const w = 18 - idx * 4;
            const h = 24 - idx * 5;
            return (
              <g key={tz}>
                <line x1={-w} y1={h - 10} x2={-w} y2={-h + 10} stroke={c3} strokeWidth={1.8 - idx * 0.3}/>
                <line x1={w} y1={h - 10} x2={w} y2={-h + 10} stroke={c3} strokeWidth={1.8 - idx * 0.3}/>
                <line x1={-w - 3} y1={-h + 12} x2={w + 3} y2={-h + 12} stroke={c3} strokeWidth={2 - idx * 0.3}/>
              </g>
            );
          })}
          {/* Stone Kitsune fox messenger holding key */}
          <path d="M-14 10 Q-16 6 -14 2 Q-10 0 -8 4 Q-6 10 -10 12 Z" fill={c1} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 52. Obanzai Kyoto Home Cooking ────────────────────────────────────────
    if (tl.includes('obanzai')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Lacquered service tray */}
          <rect x="-20" y="8" width="40" height="5" rx="1" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1"/>
          {/* Trio of handcrafted ceramic small bowls */}
          {[-12, 0, 12].map(bx => (
            <g key={bx}>
              <path d={`M${bx - 5} 8 Q${bx - 6} 2 ${bx - 4} -2 Q${bx} -4 ${bx + 4} -2 Q${bx + 6} 2 ${bx + 5} 8 Z`} fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
              {/* Seasonal simmered dish garnish */}
              <circle cx={bx} cy="2" r="1.5" fill={c3} stroke="none"/>
            </g>
          ))}
          {/* Bamboo chopsticks */}
          <line x1="-16" y1="4" x2="16" y2="4" stroke={i} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 53. Ginkaku-ji Silver Pavilion & Kogetsudai Sand Cone ─────────────────
    if (tl.includes('ginkaku') || tl.includes('silver pavilion')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Two-tiered Silver Pavilion */}
          <rect x="-12" y="2" width="24" height="12" fill={c2} fillOpacity="0.3" stroke={i} strokeWidth="1.1"/>
          <rect x="-9" y="-7" width="18" height="10" fill={c2} fillOpacity="0.25" stroke={i} strokeWidth="1"/>
          <path d="M-14 2 L0 -4 L14 2" stroke={i} strokeWidth="1.1"/>
          <path d="M-11 -7 L0 -13 L11 -7" stroke={i} strokeWidth="0.9"/>
          {/* Kogetsudai Moon-viewing sand cone */}
          <polygon points="-22,14 -18,2 -14,14" fill={c1} fillOpacity="0.55" stroke={i} strokeWidth="1"/>
          <path d="M-20 14 Q-18 6 -16 14" stroke={f} strokeWidth="0.6"/>
          {/* Moss garden pond */}
          <path d="M-12 16 Q0 19 14 16" stroke={c3} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 54. Philosopher's Path (Tetsugaku-no-Michi Canal) ──────────────────────
    if (tl.includes('philosopher')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Stone canal path */}
          {[-14, -7, 0, 7, 14].map(sx => (
            <ellipse key={sx} cx={sx} cy={12} rx="4" ry="2" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="0.7"/>
          ))}
          {/* Flowing stone canal alongside */}
          <path d="M-20 17 Q-8 14 0 17 Q10 20 20 17" stroke={c3} strokeWidth="1.2"/>
          {/* Overhanging cherry & hydrangea boughs */}
          <path d="M-16 10 L-16 -6 L-22 -14 M-16 -6 L-8 -12" stroke={i} strokeWidth="1.2"/>
          <path d="M12 8 L12 -6 L18 -16 M12 -6 L4 -12" stroke={i} strokeWidth="1.2"/>
          {/* Blossoms */}
          {[[-20, -14], [-8, -12], [18, -16], [4, -12]].map(([bx, by], bi) => (
            <circle key={bi} cx={bx} cy={by} r="2.5" fill={c2} fillOpacity="0.7" stroke={i} strokeWidth="0.5"/>
          ))}
        </g>
      );
    }

    // ── 55. Nanzen-ji Sanmon & Roman Aqueduct (Suirokaku) ─────────────────────
    if (tl.includes('nanzen') || tl.includes('aqueduct')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Massive wooden Sanmon gate roof */}
          <path d="M-18 -4 L0 -14 L18 -4" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1.3"/>
          <rect x="-14" y="-4" width="28" height="12" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1"/>
          {/* Red-brick Roman Aqueduct arches (Suirokaku) */}
          {[-12, 0, 12].map(ax => (
            <path key={ax} d={`M${ax - 5} 18 L${ax - 5} 10 Q${ax} 6 ${ax + 5} 10 L${ax + 5} 18`} fill={c3} fillOpacity="0.5" stroke={i} strokeWidth="0.9"/>
          ))}
          <line x1="-18" y1="18" x2="18" y2="18" stroke={i} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 56. Heian Shrine & Okazaki Garden ─────────────────────────────────────
    if (tl.includes('heian') || tl.includes('okazaki')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Colossal Crimson Torii Gate */}
          <line x1="-16" y1="16" x2="-16" y2="-12" stroke={c3} strokeWidth="2.4"/>
          <line x1="16" y1="16" x2="16" y2="-12" stroke={c3} strokeWidth="2.4"/>
          <line x1="-20" y1="-10" x2="20" y2="-10" stroke={c3} strokeWidth="2.6"/>
          {/* Covered bridge over garden pond */}
          <path d="M-14 10 Q0 4 14 10" stroke={c1} strokeWidth="1.5"/>
          <rect x="-6" y="2" width="12" height="6" rx="0.5" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
          {/* Weeping wisteria / cherry branch */}
          <path d="M12 -8 Q18 -4 14 4" stroke={c2} strokeWidth="1"/>
        </g>
      );
    }

    // ── 57. Yudofu at Junsei (Simmering Silken Nanzen-ji Tofu) ─────────────────
    if (tl.includes('yudofu') || tl.includes('junsei') || tl.includes('tofu')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Clay nabe pot */}
          <path d="M-14 8 Q-16 0 -14 -8 Q-8 -14 0 -14 Q8 -14 14 -8 Q16 0 14 8 Z" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.2"/>
          {/* Pure silken tofu blocks in broth */}
          <rect x="-8" y="-6" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.85" stroke={i} strokeWidth="0.8"/>
          <rect x="1" y="-4" width="7" height="6" rx="0.5" fill="white" fillOpacity="0.85" stroke={i} strokeWidth="0.8"/>
          {/* Kombu kelp ribbon in clear dashi */}
          <path d="M-6 4 Q0 0 6 4" stroke={c2} strokeWidth="1.2"/>
          {/* Rising steam */}
          <path d="M-3 -14 Q-5 -22 -3 -26" stroke={f} strokeWidth="0.8"/>
          <path d="M3 -14 Q5 -22 3 -26" stroke={f} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 58. Pontocho Alley & Kamo River Terraces (Kawayuka) ────────────────────
    if (tl.includes('pontocho') || tl.includes('kamo river')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Narrow lantern-lit alleyway */}
          <rect x="-18" y="-12" width="10" height="28" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1"/>
          <rect x="8" y="-12" width="10" height="28" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1"/>
          {/* Red paper lanterns */}
          <ellipse cx="-13" cy="-4" rx="3.5" ry="5.5" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="0.8"/>
          <ellipse cx="13" cy="-4" rx="3.5" ry="5.5" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="0.8"/>
          {/* Kamo River flowing underneath wooden terrace */}
          <path d="M-22 18 Q-8 15 0 18 Q10 21 22 18" stroke={c2} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 59. Ryoan-ji Zen Garden (15 Mysterious Stones) ─────────────────────────
    if (tl.includes('ryoan') || tl.includes('zen garden')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Ancient clay oil-stained wall */}
          <rect x="-22" y="-18" width="44" height="4" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="0.9"/>
          {/* Raked white sand ripples */}
          {[-12, -6, 0, 6, 12, 17].map(ly => (
            <path key={ly} d={`M-22 ${ly} Q-10 ${ly - 2} 0 ${ly} Q10 ${ly + 2} 22 ${ly}`} stroke={f} strokeWidth="0.7"/>
          ))}
          {/* 5 Stone Clusters (The 15 Stones) */}
          {[[-14, 2], [-4, -5], [4, 1], [12, -3], [17, 7]].map(([sx, sy], si) => (
            <g key={si}>
              <ellipse cx={sx} cy={sy} rx={3 + (si % 2)} ry={2.2} fill={c2} fillOpacity="0.65" stroke={i} strokeWidth="1"/>
              <path d={`M${(sx as number) - 5} ${(sy as number) + 3} Q${sx} ${(sy as number) + 5} ${(sx as number) + 5} ${(sy as number) + 3}`} stroke={f} strokeWidth="0.5"/>
            </g>
          ))}
        </g>
      );
    }

    // ── 60. Kinkaku-ji Golden Pavilion (Reflected in Pond) ────────────────────
    if (tl.includes('kinkaku') || tl.includes('golden pavilion')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* 3-Tier Gilded Pavilion */}
          <rect x="-14" y="2" width="28" height="10" fill={c1} fillOpacity="0.75" stroke={i} strokeWidth="1.1"/>
          <rect x="-11" y="-6" width="22" height="9" fill={c1} fillOpacity="0.7" stroke={i} strokeWidth="1"/>
          <rect x="-8" y="-14" width="16" height="9" fill={c1} fillOpacity="0.65" stroke={i} strokeWidth="0.9"/>
          {/* Sweeping gilded eaves */}
          <path d="M-16 2 L0 -3 L16 2" fill={c2} fillOpacity="0.5" stroke={i} strokeWidth="1"/>
          <path d="M-13 -6 L0 -11 L13 -6" fill={c2} fillOpacity="0.45" stroke={i} strokeWidth="0.9"/>
          <path d="M-10 -14 L0 -19 L10 -14" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
          {/* Phoenix rooftop spire */}
          <line x1="0" y1="-21" x2="0" y2="-19" stroke={i} strokeWidth="0.9"/>
          {/* Kyoko-chi Mirror Pond ripples */}
          <path d="M-20 15 Q0 12 20 15" stroke={c3} strokeWidth="1"/>
          <path d="M-14 18 Q0 21 14 18" stroke={c1} strokeWidth="0.6" strokeOpacity="0.6"/>
        </g>
      );
    }

    // ── 61. Daitoku-ji Zen Sub-Temples (Daisen-in) ─────────────────────────────
    if (tl.includes('daitoku')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Zen sub-temple veranda & raked stone waterfall */}
          <rect x="-16" y="2" width="32" height="18" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          <path d="M-18 2 L0 -8 L18 2" stroke={i} strokeWidth="1.2"/>
          {/* Dry landscape karesansui stone arrangement */}
          <polygon points="-8,16 -5,6 -2,16" fill={c2} stroke={i} strokeWidth="0.9"/>
          <polygon points="2,16 6,4 10,16" fill={c2} stroke={i} strokeWidth="0.9"/>
          {/* Concentric raked sand rings */}
          <ellipse cx="0" cy="18" rx="14" ry="4" stroke={f} strokeWidth="0.6"/>
        </g>
      );
    }

    // ── 62. Nishiki Market (Kyoto's 400-Year Kitchen) ─────────────────────────
    if (tl.includes('nishiki')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Iconic narrow 5-block canopy */}
          <path d="M-20 -6 Q0 -14 20 -6" stroke={i} strokeWidth="1.3"/>
          <rect x="-18" y="-6" width="36" height="24" fill={c1} fillOpacity="0.15" stroke={i} strokeWidth="0.9"/>
          {/* Dango sweet rice skewer */}
          <line x1="-8" y1="-14" x2="-8" y2="8" stroke={i} strokeWidth="0.9"/>
          {[-6, -1, 4].map((dy, di) => (
            <circle key={di} cx="-8" cy={dy} r="2.4" fill={c2} fillOpacity="0.75" stroke={i} strokeWidth="0.6"/>
          ))}
          {/* Fresh Yuba (tofu skin) rolls & pickled vegetables */}
          <rect x="2" y="-2" width="12" height="8" rx="1" fill={c3} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
        </g>
      );
    }

    // ── 63. Traditional Kaiseki at Nakamura / Kikunoi ─────────────────────────
    if (tl.includes('kaiseki') || tl.includes('kikunoi') || tl.includes('nakamura') || tl.includes('kappo')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Lacquered Hinoki counter & presentation tray */}
          <rect x="-20" y="6" width="40" height="5" rx="0.5" fill={c1} fillOpacity="0.35" stroke={i} strokeWidth="1.1"/>
          {/* Multi-tier lacquered jubako box */}
          {[-10, 0, 10].map((jx) => (
            <g key={jx}>
              <path d={`M${jx - 4} 6 Q${jx - 5} 0 ${jx - 3} -4 Q${jx} -5 ${jx + 3} -4 Q${jx + 5} 0 ${jx + 4} 6 Z`} fill={c2} fillOpacity="0.5" stroke={i} strokeWidth="0.8"/>
              {/* Hassun seasonal garnish / maple leaf */}
              <circle cx={jx} cy="-2" r="1.2" fill={c3} stroke="none"/>
            </g>
          ))}
          {/* Ceramic sake carafe (Tokkuri) */}
          <path d="M-18 -2 Q-20 -6 -18 -12 Q-14 -16 -10 -12 Q-8 -6 -10 -2 Z" fill={c3} fillOpacity="0.4" stroke={i} strokeWidth="0.8"/>
          {/* Chef slicing knife (Yanagiba) */}
          <line x1="8" y1="-14" x2="18" y2="4" stroke={i} strokeWidth="1.2"/>
        </g>
      );
    }

    // ── 64. Takagamine Tea Ceremony (Matcha Chasen & Chawan) ───────────────────
    if (tl.includes('tea ceremony') || tl.includes('takagamine') || tl.includes('matcha')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Textured Raku ceramic tea bowl (Chawan) */}
          <path d="M-14 4 Q-16 -4 -12 -10 Q0 -14 12 -10 Q16 -4 14 4 Z" fill={c1} fillOpacity="0.45" stroke={i} strokeWidth="1.2"/>
          {/* Frothy emerald matcha green tea */}
          <ellipse cx="0" cy="-6" rx="10" ry="4" fill={c2} fillOpacity="0.85" stroke={i} strokeWidth="0.8"/>
          {/* Bamboo Chasen whisk standing in bowl */}
          <path d="M-3 -6 L-5 -18 Q0 -22 5 -18 L3 -6" stroke={c3} strokeWidth="1"/>
          <line x1="0" y1="-18" x2="0" y2="-6" stroke={c3} strokeWidth="0.8"/>
          {/* Wagashi sweet on cedar paper */}
          <ellipse cx="14" cy="8" rx="4" ry="2.5" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 65. Gion Twilight Walk (Geiko, Machiya & Willows) ──────────────────────
    if (tl.includes('gion') || tl.includes('geiko') || tl.includes('maiko')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Historic Machiya wooden latticework */}
          <rect x="-18" y="-8" width="10" height="26" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="0.9"/>
          <rect x="8" y="-4" width="12" height="22" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="0.9"/>
          {/* Red paper lantern on eave */}
          <ellipse cx="0" cy="-6" rx="5" ry="8" fill={c3} fillOpacity="0.75" stroke={i} strokeWidth="1"/>
          <line x1="0" y1="-14" x2="0" y2="-12" stroke={i} strokeWidth="0.8"/>
          {/* Trailing willow branch sprig */}
          <path d="M18 -10 Q22 0 16 12 M18 -4 Q24 4 18 16" stroke={c2} strokeWidth="0.9"/>
          {/* Cobblestone pavement */}
          {[-12, -4, 4, 12].map(sx => <ellipse key={sx} cx={sx} cy="20" rx="3.5" ry="1.5" fill={f} stroke={i} strokeWidth="0.5"/>)}
        </g>
      );
    }

    // ── 66. Tenryu-ji & Arashiyama Bamboo Grove ───────────────────────────────
    if (tl.includes('tenryu') || tl.includes('bamboo') || tl.includes('arashiyama')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Towering vertical Bamboo culms */}
          {[-14, -6, 2, 10, 18].map((bx, bi) => (
            <g key={bx}>
              <rect x={bx} y={-20 + (bi % 2) * 4} width="5" height="38" rx="2" fill={c2} fillOpacity="0.45" stroke={i} strokeWidth="1"/>
              {[-10, -2, 6, 14].map(by => <line key={by} x1={bx} y1={by} x2={bx + 5} y2={by} stroke={i} strokeWidth="0.5"/>)}
            </g>
          ))}
          {/* Zen garden pond & borrowed mountains */}
          <ellipse cx="0" cy="18" rx="18" ry="6" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1"/>
        </g>
      );
    }

    // ── 67. Okochi Sanso Villa & Garden (Arashiyama Vista) ────────────────────
    if (tl.includes('okochi') || tl.includes('sanso')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Hillside teahouse terrace */}
          <rect x="-14" y="0" width="28" height="16" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          <path d="M-18 0 L0 -14 L18 0" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Oi River gorge panorama backdrop */}
          <path d="M-22 4 L-14 -6 L-6 0 L2 -12 L10 -4 L20 4" stroke={f} strokeWidth="0.8"/>
          {/* Stone lantern on mossy ledge */}
          <rect x="-10" y="14" width="4" height="6" rx="0.5" fill={c3} stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 68. Clay-Pot Crab Dinner (Matsuba Donabe) ─────────────────────────────
    if (tl.includes('clay') || tl.includes('crab') || tl.includes('donabe')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Heavy earthenware donabe clay pot */}
          <path d="M-14 8 Q-16 0 -14 -6 Q-8 -12 0 -12 Q8 -12 14 -6 Q16 0 14 8 Z" fill={c1} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Domed clay lid with steam vent */}
          <path d="M-12 -6 Q0 -16 12 -6" fill={c2} fillOpacity="0.5" stroke={i} strokeWidth="1.1"/>
          <circle cx="0" cy="-16" r="2.5" fill={c2} stroke={i} strokeWidth="0.8"/>
          {/* Steam curling from lid */}
          <path d="M-3 -16 Q-5 -24 -3 -30" stroke={f} strokeWidth="0.9"/>
          <path d="M3 -16 Q5 -24 3 -30" stroke={f} strokeWidth="0.9"/>
          {/* Succulent Matsuba snow crab claw */}
          <path d="M8 -4 Q14 -8 18 -4 Q16 0 12 -2 Z" fill={c3} fillOpacity="0.8" stroke={i} strokeWidth="0.9"/>
        </g>
      );
    }

    // ── 69. Nijo Castle (Nightingale Floors & Karamon Gate) ───────────────────
    if (tl.includes('nijo')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Imperial Karamon Gate gilded roof */}
          <rect x="-16" y="2" width="32" height="16" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          <path d="M-18 2 L0 -12 L18 2" fill={c2} fillOpacity="0.35" stroke={i} strokeWidth="1.2"/>
          {/* Nightingale floor squeaking wood planks */}
          <path d="M-14 12 Q-7 9 0 12 Q7 15 14 12" stroke={f} strokeWidth="0.8" strokeDasharray="3,1.5"/>
          {/* Tokugawa Golden Screen Tiger motif */}
          <rect x="-6" y="4" width="12" height="8" rx="0.5" fill={c3} fillOpacity="0.6" stroke={i} strokeWidth="0.6"/>
        </g>
      );
    }

    // ── 70. Kyoto Imperial Palace Grounds (Kyoto Gosho) ───────────────────────
    if (tl.includes('imperial palace') || tl.includes('gosho')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Imperial Gate (Kenreimon) */}
          <rect x="-18" y="0" width="36" height="18" fill={c1} fillOpacity="0.2" stroke={i} strokeWidth="1.1"/>
          <path d="M-20 0 L0 -12 L20 0" fill={c2} fillOpacity="0.3" stroke={i} strokeWidth="1.2"/>
          {/* Imperial Chrysanthemum crest motif */}
          <circle cx="0" cy="-4" r="3" fill={c3} stroke={i} strokeWidth="0.7"/>
          {/* Ancient black pine trees & gravel expanse */}
          <path d="M-14 -2 L-14 -12 L-20 -6" stroke={i} strokeWidth="0.8"/>
          <circle cx="-16" cy="-12" r="4.5" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="0.7"/>
        </g>
      );
    }

    // ── 71. Fushimi Sake District & Gekkeikan Brewery ─────────────────────────
    if (tl.includes('sake') || tl.includes('gekkeikan') || tl.includes('brewery')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Traditional white-walled Kura storehouse */}
          <rect x="-16" y="-6" width="32" height="22" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          <path d="M-18 -6 L0 -18 L18 -6" fill={c2} fillOpacity="0.4" stroke={i} strokeWidth="1.2"/>
          {/* Green cedar ball (Sugidama) hanging from eave */}
          <circle cx="-10" cy="-2" r="4.5" fill={c2} fillOpacity="0.8" stroke={i} strokeWidth="0.8"/>
          <line x1="-10" y1="-6" x2="-10" y2="-2" stroke={i} strokeWidth="0.8"/>
          {/* Horikawa willow canal & wooden boat */}
          <path d="M-22 18 Q-8 15 0 18 Q10 21 22 18" stroke={c3} strokeWidth="1.1"/>
        </g>
      );
    }

    // ── 72. Default Fallbacks by Activity Type ────────────────────────────────
    if (tl.includes('hotel') || tl.includes('inn') || tl.includes('stay')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <rect x="-10" y="-18" width="20" height="32" fill={c1} fillOpacity="0.25" stroke={i} strokeWidth="1.1"/>
          {[0, 1, 2, 3].map(row => (
            [0, 1].map(col => (
              <rect key={`${row}-${col}`} x={-7 + col * 8} y={-14 + row * 6} width="4.5" height="3.5" rx="0.3" fill={c2} fillOpacity="0.6" stroke={i} strokeWidth="0.4"/>
            ))
          ))}
          <line x1="-14" y1="14" x2="14" y2="14" stroke={i} strokeWidth="0.9"/>
        </g>
      );
    }

    if (tl.includes('restaurant') || tl.includes('dining') || tl.includes('food') || tl.includes('dinner') || tl.includes('lunch')) {
      return (
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M-14 4 Q-16 -4 -14 -12 Q-8 -18 0 -18 Q8 -18 14 -12 Q16 -4 14 4 Z" fill={c1} fillOpacity="0.3" stroke={i} strokeWidth="1.2"/>
          <path d="M-8 -4 Q-4 -8 0 -4 Q4 0 8 -4" stroke={c3} strokeWidth="1" fill="none"/>
          <path d="M-2 -18 Q-4 -24 -2 -28" stroke={f} strokeWidth="0.8"/>
          <path d="M4 -18 Q6 -24 4 -28" stroke={f} strokeWidth="0.8"/>
        </g>
      );
    }

    // Final Elegant Fallback: Torii & Mountain
    return (
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-16 14 L-6 2 L4 8 L14 -6 L22 14" stroke={f} strokeWidth="0.9"/>
        <line x1="-10" y1="14" x2="-10" y2="0" stroke={c1} strokeWidth="1.4"/>
        <line x1="10" y1="14" x2="10" y2="0" stroke={c1} strokeWidth="1.4"/>
        <line x1="-14" y1="2" x2="14" y2="2" stroke={c1} strokeWidth="1.6"/>
      </g>
    );
  };

  const VineDecor = () => {
    return <>
      {acts.map((act, si) => {
        const vy = si * sH + sH * 0.82;
        const side = si % 2 === 0 ? 1 : -1;
        const vxHere = (region === 'tokyo')
          ? (si % 2 === 0 ? 58 + (si % 4) * 8 : 72 + (si % 3) * 7)
          : 68 + Math.sin((si * 3 + 4) / (n * 6) * n * Math.PI * 2 + s * 0.6) * 16;
        const dx = vxHere + side * 30;
        const t = act.type || 'nature';
        const tokyoColors: Record<string, string[]> = {
          transit:    ['#e8c040', '#4a80c8', '#c8c8d0'],
          hotel:      ['#e89030', '#c0c8d8', '#f8e8a0'],
          restaurant: ['#e8603a', '#f8d860', '#c04828'],
          museum:     ['#40c8d8', '#e840b0', '#e8b030'],
          nature:     ['#60b848', '#a8d888', '#f8e8b0'],
          shop:       ['#e84080', '#40c8d8', '#f8e040'],
        };
        const izuColors: Record<string, string[]> = {
          transit:    ['#4080b8', '#a8d0e8', '#f8f0e0'],
          hotel:      ['#e8a848', '#c0d8e8', '#f8e8d0'],
          restaurant: ['#c83828', '#f0c060', '#8ab878'],
          nature:     ['#e8a0b0', '#60a848', '#a8d8c0'],
          museum:     ['#c83828', '#b0a880', '#e8d8b0'],
          shop:       ['#c84038', '#f8d060', '#60a090'],
        };
        const hakoneColors: Record<string, string[]> = {
          transit:    ['#b0c8e0', '#f8f8f8', '#6888a8'],
          hotel:      ['#f8f8ff', '#5878a0', '#e8c080'],
          restaurant: ['#f8f8ff', '#e8a848', '#5878a0'],
          nature:     ['#e87030', '#f8c040', '#b0c8e0'],
          museum:     ['#88a0b8', '#c8d8e8', '#e8b860'],
          shop:       ['#5878a0', '#e8d8b0', '#c0d0e0'],
        };
        const biwaColors: Record<string, string[]> = {
          transit:    ['#388888', '#a0d8d8', '#f0f8f8'],
          hotel:      ['#388888', '#c8e8e8', '#f0e8c0'],
          restaurant: ['#388888', '#e8c060', '#f8f0e0'],
          nature:     ['#388888', '#a8d8c0', '#f8f0e0'],
          museum:     ['#388888', '#b0a880', '#c8e8e8'],
          shop:       ['#388888', '#f8d060', '#a0d0d0'],
        };
        const osakaColors: Record<string, string[]> = {
          transit:    ['#4060a0', '#a0b8d8', '#f8e0a0'],
          hotel:      ['#b84428', '#f8e0a0', '#4060a0'],
          restaurant: ['#e87030', '#f8c840', '#c83828'],
          museum:     ['#808080', '#b84428', '#e8e0d0'],
          shop:       ['#e8a030', '#c83828', '#f8e8a0'],
          nature:     ['#c83828', '#e8c040', '#4060a0'],
        };
        const kyotoColors: Record<string, string[]> = {
          transit:    ['#c83020', '#f8e8d0', '#60a040'],
          hotel:      ['#e8a030', '#f8e8d0', '#7a4a88'],
          restaurant: ['#50a040', '#c83020', '#f8e8c0'],
          museum:     ['#c83020', '#708040', '#e8d0b0'],
          nature:     ['#e8a0b0', '#c83020', '#60a040'],
          shop:       ['#7a4a88', '#c83020', '#f8d060'],
        };
        const regionPalettes: Record<string, Record<string, string[]>> = {
          'tokyo': tokyoColors, 'izu': izuColors, 'hakone': hakoneColors,
          'lake-biwa': biwaColors, 'osaka': osakaColors, 'kyoto': kyotoColors,
        };
        const pal = (regionPalettes[region] ?? tokyoColors)[t] ?? ['#e8a030', '#60a848', '#4a6eb8'];
        const [c1, c2, c3] = pal;
        return (
          <g key={si} transform={`translate(${dx.toFixed(1)},${vy.toFixed(1)})`}>
            {getTitleDecor(act.title, c1, c2, c3)}
          </g>
        );
      })}
    </>;
  };

  // ── Vine decorative overlays per region ───────────────────────────────────
  const vineStroke1 = region === 'tokyo' ? accent : faint;
  const vineW1 = region === 'tokyo' ? 1.4 : 1.6;
  const vineW2 = 0.6;
  const vineDash = region === 'tokyo' ? '12,4,6,4' : (region === 'kyoto' ? '20,10,5,10' : '30,8,12,8');

  return (
    <svg
      viewBox={`0 0 140 ${H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vine / path */}
      <path d={vinePath} stroke={vineStroke1} strokeWidth={vineW1} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d={vinePath} stroke={ink} strokeWidth={vineW2} fill="none" strokeLinecap="round" strokeDasharray={vineDash} />

      {/* Region-specific vine decoration */}
      <VineDecor />

    </svg>
  );
};





// ── RAIN MODE ALTERNATIVE SANCTUARIES ─────────────────────────────────────────
const RAIN_ALTERNATIVES: Record<number, { title: string; area: string; desc: string; icon: string }> = {
  1:  { title: "Sanjusangen-do 1,001 Golden Statues & Kyoto Station Atrium", area: "Higashiyama", desc: "An endless 120-meter indoor hall of gilded 12th-century deities directly across from the Hyatt Regency.", icon: "✨" },
  2:  { title: "Teramachi & Shinkyogoku Covered Historic Shotengai", area: "Central Kyoto", desc: "Miles of historic covered arcade streets lined with 300-year-old tea shops, woodblock print dealers, and ramen counters.", icon: "🏮" },
  3:  { title: "Kyoto National Museum of Modern Art & Hosomi Museum", area: "Okazaki", desc: "Two premier cultural spaces right by Heian Shrine with indoor Japanese gardens and sheltered teahouses.", icon: "🖼️" },
  4:  { title: "Kennin-ji Zen Hall & RIRAKU Indoor Spa Sanctuary", area: "Gion / Higashiyama", desc: "Twin dragon ceilings on cedar tatami, followed by a warm camellia oil Shiatsu acupressure session.", icon: "💆" },
  5:  { title: "Nakanoshima Museum of Art & Whity Umeda Labyrinth", area: "Osaka", desc: "Modern black-box museum next to the Conrad, connected to Osaka's endless covered underground shopping city.", icon: "🎨" },
  6:  { title: "Kobe City Museum & Sannomiya Center Gai Covered Arcade", area: "Kobe", desc: "A 600-meter weatherproof covered shopping street with tea salons, retro kissaten, and sheltered teppanyaki.", icon: "🛍️" },
  7:  { title: "Todai-ji Great Buddha Hall & Shinsaibashi Covered Arcade", area: "Nara / Osaka", desc: "The world's largest wooden building protects the 15m bronze Daibutsu, followed by 2km of covered Shinsaibashi shopping.", icon: "🪷" },
  8:  { title: "Yamazaki Indoor Tasting Lounge & Kuromon Arcade", area: "Yamazaki / Namba", desc: "Suntory whisky museum, library of single malts, and Kuromon Market's 300 sheltered food stalls.", icon: "🥃" },
  9:  { title: "In-Room Onsen Soaking & Tatami Shiatsu", area: "Gora Kadan", desc: "Watch the mountain rain drift across imperial cedar pines from your private thermal bath with hot green tea and in-room massage.", icon: "♨️" },
  10: { title: "Pola Museum of Art & Hakone Open-Air Picasso Hall", area: "Hakone", desc: "A subterranean glass museum nestled inside a beech forest featuring Monet, Renoir, and sheltered sculpture pavilions.", icon: "🏛️" },
  11: { title: "Ginza Six & Mitsukoshi Depachika", area: "Ginza", desc: "Skip the rain outside by exploring Ginza's underground luxury food halls — gourmet pastries, seasonal fruit, and warm dashi broth counters.", icon: "🏬" },
  12: { title: "Tokyo Skytree Solamachi & Sumida Aquarium", area: "East Tokyo", desc: "Over 300 covered shops, dining halls, and indoor ocean galleries beneath Tokyo Skytree.", icon: "🦈" },
  13: { title: "Akihabara Radio Kaikan & Kanda Soba", area: "Akihabara / Kanda", desc: "Multi-floor indoor retro electronics cathedrals, vinyl listening rooms, and historic 1880 sheltered dining.", icon: "🎮" },
  14: { title: "Omotesando Hills & Covered Cat Street Arcades", area: "Harajuku / Omotesando", desc: "Tadao Ando's spiral Omotesando Hills complex, sheltered boutique cafes, and Kengo Kuma's Nezu Museum.", icon: "☕" },
  15: { title: "Studio Ghibli Museum & Harmonica Yokocho Arcades", area: "Mitaka / Kichijoji", desc: "Hayao Miyazaki's whimsical indoor animation mansion followed by covered post-war alleyways in Kichijoji.", icon: "🎨" },
  16: { title: "Daikanyama T-Site & Roppongi Hills Mori Art Museum", area: "Daikanyama / Roppongi", desc: "Sheltered architectural bookstore labyrinth followed by 53rd-floor contemporary art galleries overlooking the skyline.", icon: "📚" },
  17: { title: "Isetan Shinjuku B1/B2 Food Hall & Seiko Museum", area: "Shinjuku / Ginza", desc: "Japan's most celebrated subterranean food market followed by Grand Seiko horology gallery floors under glass.", icon: "🍰" },
  18: { title: "Saitama Super Arena Indoor Arena & Shinjuku Komehyo", area: "Saitama / Shinjuku", desc: "Massive state-of-the-art indoor arena complex for Radiohead, preceded by covered luxury vintage watch galleries.", icon: "🎸" },
  19: { title: "Haneda Airport International Sky Lounge & Shopping Arcades", area: "Transit", desc: "Completely sheltered transit via Keikyu express straight into the airport observation deck and lounge.", icon: "🚄" },
};

// ── CALENDAR (.ICS) EXPORTER ──────────────────────────────────────────────────
const downloadIcsCalendar = () => {
  const events = [
    { title: "Flight to Kansai Airport (Arrive KIX)", start: "20270528T140000Z", end: "20270528T170000Z", desc: "Clear customs and board the Haruka Express direct to Kyoto", loc: "Kansai International Airport, Osaka" },
    { title: "Check-in: Hyatt Regency Kyoto", start: "20270528T173000Z", end: "20270528T183000Z", desc: "4-Night Stay in Higashiyama booked with World of Hyatt Points", loc: "644-2 Sanjusangendo Mawaricho, Higashiyama, Kyoto" },
    { title: "Kaiseki at Nakamura (1716)", start: "20270530T193000Z", end: "20270530T220000Z", desc: "300-year-old 3-star culinary institution near Nishiki", loc: "Nishiki, Kyoto" },
    { title: "Traditional Shiatsu Massage at RIRAKU Spa", start: "20270531T153000Z", end: "20270531T170000Z", desc: "90-minute meridian acupressure & camellia oil bodywork", loc: "Hyatt Regency Kyoto, Higashiyama" },
    { title: "Kikunoi Honten Farewell Kaiseki", start: "20270531T200000Z", end: "20270531T230000Z", desc: "17-Course Capstone Kaiseki in Gion with master Yoshihiro Murata", loc: "459 Shimokawaracho, Higashiyama, Kyoto" },
    { title: "Check-in: Conrad Osaka", start: "20270601T133000Z", end: "20270601T150000Z", desc: "4-Night 5-Star Stay on Nakanoshima island (58th floor)", loc: "3-2-4 Nakanoshima, Kita Ward, Osaka" },
    { title: "Mt. Rokko Championship Golf & Kobe Beef at Misono", start: "20270602T083000Z", end: "20270602T210000Z", desc: "18 holes overlooking Osaka Bay followed by certified A5 Tajima Kobe beef", loc: "Rokko Kokusai Golf Club / Kobe" },
    { title: "Ancient Nara Daytrip (Daibutsu & Sika Deer)", start: "20270603T090000Z", end: "20270603T160000Z", desc: "Todai-ji 15m bronze Buddha, 1,200 bowing deer in Nara Park, Kasuga Taisha", loc: "Nara Park, Nara" },
    { title: "Suntory Yamazaki Tasting & Koshien Stadium Baseball", start: "20270604T100000Z", end: "20270604T213000Z", desc: "VIP Single Malt whisky tour & Hanshin Tigers baseball game", loc: "Yamazaki / Koshien Stadium" },
    { title: "Check-in: Gora Kadan (Hakone)", start: "20270605T150000Z", end: "20270605T160000Z", desc: "Relais & Châteaux imperial ryokan, private onsen & in-room tatami Shiatsu", loc: "1300 Gora, Hakone, Kanagawa" },
    { title: "Check-in: Hyatt Centric Ginza Tokyo", start: "20270607T133000Z", end: "20270607T150000Z", desc: "8-Night Stay in Ginza booked with World of Hyatt Points", loc: "6-6-7 Ginza, Chuo City, Tokyo" },
    { title: "Ginza Hinoki Counter Sushi Omakase", start: "20270607T193000Z", end: "20270607T213000Z", desc: "Intimate 8-seat seasonal omakase nigiri", loc: "Ginza, Tokyo" },
    { title: "Studio Ghibli Museum & Bar High Five", start: "20270611T110000Z", end: "20270611T223000Z", desc: "Miyazaki animation museum in Mitaka & bespoke cocktails with Ueno-san", loc: "Mitaka / Ginza, Tokyo" },
    { title: "Radiohead — Live at Saitama Super Arena", start: "20270614T180000Z", end: "20270614T220000Z", desc: "Headline June 2027 arena tour. 30 min direct train via JR Ueno-Tokyo Line from Ginza", loc: "Saitama Super Arena, Saitama" },
    { title: "Haneda Airport (HND) Flight Home", start: "20270615T163000Z", end: "20270615T200000Z", desc: "Direct Keikyu express to Haneda Terminal 3 for international departure", loc: "Haneda Airport, Tokyo" },
  ];

  let ics = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Wanderers Sketchbook//Japan 2027//EN\nCALSCALE:GREGORIAN\nMETHOD:PUBLISH\nX-WR-CALNAME:Wanderers Japan Itinerary 2027\n";
  events.forEach(e => {
    ics += "BEGIN:VEVENT\nSUMMARY:" + e.title + "\nDESCRIPTION:" + e.desc + "\nLOCATION:" + e.loc + "\nDTSTART:" + e.start + "\nDTEND:" + e.end + "\nSTATUS:CONFIRMED\nEND:VEVENT\n";
  });
  ics += "END:VCALENDAR";

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'wanderers_japan_itinerary_2027.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};


// ── TAKKYUBIN LUGGAGE FORWARDING MODAL ────────────────────────────────────────
const TakkyubinModal: React.FC = () => {
  const { takkyubinOpen, toggleTakkyubin } = useStore();
  const [copied, setCopied] = React.useState(false);
  if (!takkyubinOpen) return null;

  const copyAddress = () => {
    navigator.clipboard.writeText("〒530-0005 大阪府大阪市北区中之島3-2-4 コンラッド大阪 フロント気付 (宿泊者: Collin Shapiro, チェックイン: 6月4日) TEL: 06-6222-0111");
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">📦 Takkyubin Luggage Dispatch Voucher</h2>
          <p className="docs-page-sub">Day 6 Departure · Forward bags from Tokyo to Conrad Osaka (Hands-Free to Hakone!)</p>
        </div>
        <button className="docs-close-btn" onClick={toggleTakkyubin}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
        <div style={{ background: "rgba(200,126,24,0.08)", border: "2px dashed #c87e18", borderRadius: "12px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#c87e18", textTransform: "uppercase", letterSpacing: "1px" }}>Recipient Address / お届け先</span>
            <button onClick={copyAddress} style={{ padding: "6px 12px", background: copied ? "#4a8a4a" : "#3a2a1a", color: "#fff", border: "none", borderRadius: "6px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
              {copied ? "✓ Copied to Clipboard" : "📋 Copy Japanese Text"}
            </button>
          </div>
          <div style={{ background: "#fff", padding: "16px", borderRadius: "8px", border: "1px solid #d0c8b8", fontFamily: "monospace", fontSize: "14px", lineHeight: "1.6", color: "#1e1208" }}>
            <strong>〒530-0005</strong><br/>
            <strong>大阪府大阪市北区中之島3-2-4</strong><br/>
            <strong>コンラッド大阪 フロント気付</strong><br/>
            <span>宿泊者代表: Collin Shapiro</span><br/>
            <span>チェックイン予定日: 2027年6月4日</span><br/>
            <span>TEL: 06-6222-0111</span>
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "12px", border: "1px solid #d0c8b8", padding: "18px" }}>
          <h4 style={{ fontSize: "15px", fontWeight: 700, color: "#1e1208", marginBottom: "10px" }}>🗣️ Show This to the Hotel Concierge / Front Desk:</h4>
          <div style={{ background: "#f8f4ec", padding: "14px", borderRadius: "8px", borderLeft: "4px solid #c87e18", marginBottom: "12px" }}>
            <div style={{ fontSize: "16px", fontWeight: 700, color: "#1e1208", marginBottom: "4px" }}>
              「大阪のホテルへ荷物の配送（宅急便）をお願いできますか？6月4日にチェックイン予定です。」
            </div>
            <div style={{ fontSize: "12.5px", color: "#7a6a5a", fontStyle: "italic" }}>
              &quot;Osaka no hoteru e nimotsu no haisou (takkyubin) o onegai dekimasu ka? Roku-gatsu yokka ni chekkuin yotei desu.&quot;
            </div>
            <div style={{ fontSize: "12px", color: "#4a3a2a", marginTop: "4px" }}>
              (Translation: Could you please arrange luggage forwarding to our Osaka hotel? We check in on June 4th.)
            </div>
          </div>
          <div style={{ fontSize: "12.5px", color: "#6a5a4a", lineHeight: "1.5" }}>
            💡 <strong>Estimated Cost:</strong> ~¥2,200–¥2,800 ($15–$18) per large suitcase. Deliveries sent on Day 6 morning will arrive reliably on Day 7 or Day 8 morning directly inside your Conrad Osaka room.
          </div>
        </div>
      </div>
    </div>
  );
};

// ── CURRENCY & POINTS BURN TRACKER MODAL ──────────────────────────────────────
const CurrencyBurnModal: React.FC = () => {
  const { currencyOpen, toggleCurrency, jpyRate, setJpyRate } = useStore();
  const [usdVal, setUsdVal] = React.useState("100");
  const [jpyVal, setJpyVal] = React.useState("15500");

  if (!currencyOpen) return null;

  const handleUsdChange = (v: string) => {
    setUsdVal(v);
    const n = parseFloat(v) || 0;
    setJpyVal(Math.round(n * jpyRate).toString());
  };

  const handleJpyChange = (v: string) => {
    setJpyVal(v);
    const n = parseFloat(v) || 0;
    setUsdVal((n / jpyRate).toFixed(2));
  };

  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">💴 Live Currency & Points Burn Tracker</h2>
          <p className="docs-page-sub">Exchange Rate: 1 USD = {jpyRate} JPY · 220k Hyatt Points Portfolio</p>
        </div>
        <button className="docs-close-btn" onClick={toggleCurrency}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "12px", border: "1px solid #d0c8b8", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e1208" }}>💱 Real-Time Calculator</h3>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#7a6a5a" }}>
              <span>Rate:</span>
              <input type="number" value={jpyRate} onChange={e => setJpyRate(parseFloat(e.target.value) || 155)} style={{ width: "60px", padding: "3px 6px", borderRadius: "4px", border: "1px solid #d0c8b8", fontSize: "12px", fontWeight: 600 }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: "12px", alignItems: "center" }}>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#7a6a5a", textTransform: "uppercase" }}>US Dollar ($ USD)</label>
              <input type="number" value={usdVal} onChange={e => handleUsdChange(e.target.value)} style={{ width: "100%", padding: "10px", fontSize: "18px", fontWeight: 700, borderRadius: "8px", border: "1.5px solid #c87e18", background: "#fff", marginTop: "4px" }} />
            </div>
            <span style={{ fontSize: "20px", color: "#999", marginTop: "16px" }}>⇄</span>
            <div>
              <label style={{ fontSize: "11px", fontWeight: 600, color: "#7a6a5a", textTransform: "uppercase" }}>Japanese Yen (¥ JPY)</label>
              <input type="number" value={jpyVal} onChange={e => handleJpyChange(e.target.value)} style={{ width: "100%", padding: "10px", fontSize: "18px", fontWeight: 700, borderRadius: "8px", border: "1.5px solid #4a7848", background: "#fff", marginTop: "4px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", marginTop: "14px", flexWrap: "wrap" }}>
            {[1000, 5000, 10000, 30000, 50000].map(amt => (
              <button key={amt} onClick={() => handleJpyChange(amt.toString())} style={{ padding: "4px 10px", borderRadius: "16px", border: "1px solid #d0c8b8", background: "#f8f4ec", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                ¥{amt.toLocaleString()} (~${Math.round(amt / jpyRate)})
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: "rgba(255,255,255,0.7)", borderRadius: "12px", border: "1px solid #d0c8b8", padding: "20px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#1e1208", marginBottom: "14px" }}>💳 220k Hyatt Points Portfolio Allocation</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8f4ec", borderRadius: "8px", borderLeft: "4px solid #c87e18" }}>
              <div>
                <strong style={{ color: "#1e1208" }}>Tokyo (5 Nights): Hyatt Centric Ginza</strong>
                <div style={{ fontSize: "12px", color: "#7a6a5a" }}>Cat 7 · 30,000 pts/night × 5 nights</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#c87e18" }}>150,000 pts</div>
                <div style={{ fontSize: "11px", color: "#4a8a4a" }}>$0 Cash (Saved ~$2,500)</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8f4ec", borderRadius: "8px", borderLeft: "4px solid #5878a0" }}>
              <div>
                <strong style={{ color: "#1e1208" }}>Hakone (2 Nights): Gora Kadan</strong>
                <div style={{ fontSize: "12px", color: "#7a6a5a" }}>Relais & Chateaux Luxury Ryokan (Kaiseki included)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#5878a0" }}>0 pts</div>
                <div style={{ fontSize: "11px", color: "#7a6a5a" }}>$2,400 Cash ($1,200/nt)</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8f4ec", borderRadius: "8px", borderLeft: "4px solid #b84428" }}>
              <div>
                <strong style={{ color: "#1e1208" }}>Osaka (5 Nights): Conrad Osaka</strong>
                <div style={{ fontSize: "12px", color: "#7a6a5a" }}>5-Star Hilton Luxury Skyline (40F Sky Lobby)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#b84428" }}>0 pts</div>
                <div style={{ fontSize: "11px", color: "#7a6a5a" }}>~$1,900 Cash (~$380/nt)</div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#f8f4ec", borderRadius: "8px", borderLeft: "4px solid #7a4a88" }}>
              <div>
                <strong style={{ color: "#1e1208" }}>Kyoto (6 Nights): Hyatt Place / Regency Kyoto</strong>
                <div style={{ fontSize: "12px", color: "#7a6a5a" }}>Cat 3 (12k pts/nt) or Cat 6 (25k pts/nt)</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 700, color: "#7a4a88" }}>72,000 pts</div>
                <div style={{ fontSize: "11px", color: "#4a8a4a" }}>$0 Cash (Saved ~$1,500)</div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #e0d8c8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "12px", color: "#7a6a5a" }}>Total Hyatt Points Used: <strong>222,000 pts</strong></div>
              <div style={{ fontSize: "12px", color: "#4a8a4a" }}>Estimated Value Generated: <strong>~$4,000+ USD (~3.2¢/pt)</strong></div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#999", fontWeight: 600 }}>Est. Out-of-Pocket Hotels</div>
              <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e1208" }}>~$4,300 USD</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── RAIN MODE ALTERNATIVE CARD ────────────────────────────────────────────────
const RainModeDayCard: React.FC<{ day: number }> = ({ day }) => {
  const alt = RAIN_ALTERNATIVES[day];
  if (!alt) return null;
  return (
    <div style={{ background: "linear-gradient(135deg, rgba(88,120,160,0.15) 0%, rgba(60,90,130,0.08) 100%)", border: "1.5px solid #5878a060", borderRadius: "8px", padding: "14px 16px", display: "flex", gap: "14px", alignItems: "flex-start", margin: "0 0 16px" }}>
      <span style={{ fontSize: "24px", flexShrink: 0 }}>{alt.icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
          <span style={{ fontSize: "10px", fontFamily: "var(--font-display)", letterSpacing: "1.2px", textTransform: "uppercase", color: "#5878a0", fontWeight: 700 }}>🌧️ Rain Mode Sanctuary Alternative</span>
          <span style={{ fontSize: "11px", color: "#888" }}>· {alt.area}</span>
        </div>
        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1e1208", marginBottom: "4px" }}>{alt.title}</div>
        <div style={{ fontSize: "12.5px", color: "#4a5a6a", lineHeight: "1.45" }}>{alt.desc}</div>
      </div>
    </div>
  );
};

const ActivityItem: React.FC<{ activity: any; index: number; transit?: { icon: string; mode: string; time: string } }> = ({ activity, index, transit }) => {
  const { activeDay, editMode, userEdits, updateActivityEdit, updateNoteEdit, selectedActivity, selectActivity, hoverActivity, doneActivities, toggleDone } = useStore();
  const dayHaikus = haikus[activeDay] || [];
  const savedKey = `${activeDay}_${index}`;
  const isSelected = selectedActivity?.key === savedKey;
  const editedTitle = userEdits.activities[savedKey]?.title;
  const editedDesc = userEdits.activities[savedKey]?.description;
  const displayTitle = editedTitle !== undefined ? editedTitle : activity.title;
  const isOptional = activity.optional === true;
  const isDone = doneActivities[savedKey] === true;
  const displayHaiku = editedDesc !== undefined ? editedDesc : (dayHaikus[index] || "");
  const editedNote = userEdits.activities[savedKey]?.note;
  const displayNote = editedNote !== undefined ? editedNote : (activity.desc || "");

  const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${activity.lat},${activity.lng}`;

  const typeColor = TYPE_COLORS[activity.type] || 'var(--rc)';
  return (
    <>
      {transit && (
        <div className="transit-divider">
          <div className="transit-divider-line" />
          <div className="transit-divider-body">
            <span className="transit-divider-icon">{transit.icon}</span>
            <span className="transit-divider-mode">{transit.mode}</span>
            <span className="transit-divider-time">{transit.time}</span>
          </div>
          <div className="transit-divider-line" />
        </div>
      )}
      <div
      className="timeline-item"
      style={{
        cursor: editMode ? 'default' : 'pointer',
        borderLeft: `3px solid ${TYPE_COLORS[activity.type] || 'var(--rc)'}${isSelected ? '' : '90'}`,
        background: isSelected ? `${TYPE_BG[activity.type] || 'rgba(0,0,0,0.04)'}` : TYPE_BG[activity.type] || 'transparent',
        opacity: isDone ? 0.48 : 1,
        transition: 'border-left 0.2s, background 0.2s, opacity 0.3s, transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease',
        paddingLeft: '12px',
      }}
      onMouseEnter={() => { if (!editMode) hoverActivity(savedKey); }}
      onMouseLeave={() => { if (!editMode) hoverActivity(null); }}
      onClick={() => {
          if (!editMode) {
            selectActivity(savedKey, activity.lat, activity.lng);
            if (window.innerWidth <= 900) {
              setTimeout(() => {
                document.querySelector('.map-pane-wrapper')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }, 150);
            }
          }
        }}
    >
      <div className="timeline-item-main">
      <span className="timeline-bullet" style={{
        background: TYPE_COLORS[activity.type] || 'var(--rc)',
        borderColor: TYPE_COLORS[activity.type] || 'var(--rc)',
        color: '#fff',
        fontSize: '10px',
      }}>
        {({'hotel':'🏨','restaurant':'🍜','museum':'🏛','shop':'🛍','transit':'🚄','nature':'🌿'} as Record<string,string>)[activity.type] ?? '●'}
      </span>
      <span className="timeline-time">{activity.time}</span>
      {activity.duration && <span className="activity-duration-badge">{activity.duration}</span>}
      <span className="activity-cat" style={{ color: TYPE_COLORS[activity.type] || 'var(--rc)', background: `${TYPE_BG[activity.type] || 'rgba(0,0,0,0.04)'}`, padding: '2px 7px', borderRadius: '3px', opacity: 1 }}>{({'hotel':'Hotel','restaurant':'Dining','museum':'Culture','shop':'Shopping','transit':'Transit','nature':'Nature'} as Record<string,string>)[activity.type] ?? activity.type}</span>
      <h3
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={(e) => updateActivityEdit(activeDay, index, 'title', e.currentTarget.innerText)}
        className="timeline-title focus:outline-none"
        style={{ color: isSelected ? 'var(--rc)' : undefined, textDecoration: isDone ? 'line-through' : 'none' }}
      >
        {displayTitle}
      </h3>
{isOptional && <span className="optional-badge">if energy allows</span>}
      {isSelected && (
      <div className="timeline-item-body">
      <p
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={(e) => updateNoteEdit(activeDay, index, e.currentTarget.innerText)}
        className="timeline-note focus:outline-none"
      >
        {displayNote}
      </p>
      <p
        contentEditable={editMode}
        suppressContentEditableWarning
        onBlur={(e) => updateActivityEdit(activeDay, index, 'description', e.currentTarget.innerText)}
        className="timeline-desc focus:outline-none"
      >
        {displayHaiku}
      </p>
      {editMode && (
        <button
          className="haiku-regen-btn"
          title="Regenerate haiku"
          onClick={(e) => {
            e.stopPropagation();
            updateActivityEdit(activeDay, index, 'description', _genHaiku(displayTitle + String(activeDay) + String(index)));
          }}
        >🎋 new haiku</button>
      )}
      {!editMode && (
        <>
        <a href={navUrl} target="_blank" rel="noopener noreferrer" className="navigate-btn"
          onClick={e => e.stopPropagation()}>
          ↗ Navigate
        </a>
        {activityUrls[activity.title] && (
          <a
            href={activityUrls[activity.title]}
            target="_blank"
            rel="noopener noreferrer"
            className="navigate-btn website-btn"
            onClick={e => e.stopPropagation()}
          >
            🌐 Website
          </a>
        )}
        <button
          className={`done-stamp-btn${isDone ? ' done-stamp-btn--done' : ''}`}
          onClick={(e) => { e.stopPropagation(); toggleDone(savedKey); }}
        >
          {isDone ? '✓ Done' : '◯ Mark done'}
        </button>
        </>
      )}
      </div>
      )}
      </div>

    </div>
  </>
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
  hotel:      '#b8681a',
  restaurant:  '#b83428',
  museum:      '#3858a8',
  shop:        '#2a7868',
  transit:     '#5878a8',
  nature:      '#3a7838',
};
const TYPE_BG: Record<string,string> = {
  hotel:      'rgba(184,104,26,0.08)',
  restaurant:  'rgba(184,52,40,0.07)',
  museum:      'rgba(56,88,168,0.07)',
  shop:        'rgba(42,120,104,0.07)',
  transit:     'rgba(88,120,168,0.06)',
  nature:      'rgba(58,120,56,0.07)',
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

  // Pace metric: based on experience count + time spread, excluding pure transit/hotel
  const experienceStops = stops.filter(s => s.type !== 'hotel' && s.type !== 'transit');
  const transitStops    = stops.filter(s => s.type === 'transit');
  const expCount = experienceStops.length;
  const expHours = experienceStops.map(s => s.h).sort((a, b) => a - b);
  const gaps = expHours.slice(0, -1).map((h, i) => expHours[i + 1] - h);
  const maxGap = gaps.length > 0 ? Math.max(...gaps) : 0;
  const tightGaps = gaps.filter(g => g <= 1.5).length;
  const timeSpan = expHours.length > 1 ? expHours[expHours.length - 1] - expHours[0] : 0;
  const hasMajorTransit = transitStops.some(s => s.title.includes('Shinkansen') || s.title.includes('Haruka') || s.title.includes('Express'));
  const hasLongBreak = maxGap >= 6;
  const pace = hasLongBreak
    ? (expCount >= 5 ? 'active' : 'relaxed')
    : (expCount >= 5 || (expCount >= 4 && tightGaps >= 2) || timeSpan >= 12)
    ? 'packed'
    : (expCount >= 3 || timeSpan >= 9 || (expCount >= 2 && hasMajorTransit))
    ? 'active'
    : 'relaxed';
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

// ── Inline Phrasebook ────────────────────────────────────────────────────────

const PhrasebookInline: React.FC = () => {
  const [openCat, setOpenCat] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="pbi-wrap">
      <div className="pbi-tabs">
        {_phrases.map(({ cat }) => (
          <button
            key={cat}
            className={`pbi-tab ${openCat === cat ? 'active' : ''}`}
            onClick={() => setOpenCat(openCat === cat ? null : cat)}
          >{cat}</button>
        ))}
      </div>
      {openCat && (() => {
        const items = _phrases.find(p => p.cat === openCat)?.items || [];
        return (
          <div className="pbi-grid">
            {items.map((p, i) => {
              const id = `pbi_${openCat}_${i}`;
              return (
                <div key={id} className="pbi-card">
                  <span className="pbi-jp">{p.jp}</span>
                  <span className="pbi-rom">{p.rom}</span>
                  <span className="pbi-en">{p.en}</span>
                  <button className="pbi-speak" onClick={() => _speak(p.jp)} title="Hear pronunciation">🔊</button>
                  <button className="pbi-copy" onClick={() => copy(p.jp, id)} title="Copy">
                    {copied === id ? '✓' : '⿻'}
                  </button>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
};

// ── Phrasebook ─────────────────────────────────────────────────────────────
interface ReturnOption { icon: string; mode: string; time: string; note?: string; }
interface ReturnTransitData { options: ReturnOption[]; warning?: string; }

const returnTransits: Record<number, ReturnTransitData> = {
  1:  { options: [
        { icon:'🚶', mode:'Walk along Chuo-dori back to hotel', time:'~5 min', note:'Same block' },
      ]},
  2:  { options: [
        { icon:'🚶', mode:'Walk via Ginza', time:'~15 min' },
        { icon:'🚇', mode:'Hibiya Line 1 stop from Hibiya to Ginza', time:'~8 min', note:'Until ~12:30am' },
        { icon:'🚕', mode:'Taxi from Yurakucho', time:'~8 min', note:'¥1,000–1,400' },
      ]},
  3:  { options: [
        { icon:'🚇', mode:'Asakusa Line → Higashi-Ginza', time:'~25 min', note:'Until ~12:30am' },
        { icon:'🚕', mode:'Taxi from Asakusa', time:'~25 min', note:'¥2,500–3,500' },
        { icon:'🚗', mode:'Uber (available in Tokyo, book via app)', time:'~25 min' },
      ]},
  4:  { warning:'Trains end ~12:30am — Midnight Ramen finishes around 2am. Taxi or Uber only.',
        options: [
        { icon:'🚕', mode:'Taxi from Shinjuku (stand outside Kabukicho)', time:'~20 min', note:'¥3,000–4,000' },
        { icon:'🚗', mode:'Uber or GO taxi app (pre-book before leaving ramen)', time:'~20 min', note:'Same price, no language barrier' },
      ]},
  5:  { options: [
        { icon:'🚇', mode:'Marunouchi Line → Ginza-itchome', time:'~15 min', note:'Until ~12:30am' },
        { icon:'🚕', mode:'Taxi from Shinjuku-sanchome', time:'~18 min', note:'¥2,000–3,000' },
        { icon:'🚗', mode:'Uber', time:'~18 min' },
      ]},
  8:  { options: [
        { icon:'🚇', mode:'Osaka Metro Tanimachi Line → Nakanoshima area', time:'~20 min', note:'Until ~12:30am' },
        { icon:'🚕', mode:'Taxi from Shinsekai', time:'~20 min', note:'¥1,500–2,500' },
      ]},
  9:  { options: [
        { icon:'🚂', mode:'JR/Hanshin from Sannomiya → Osaka, Metro to Nakanoshima', time:'~50 min', note:'Last train ~12:30am' },
        { icon:'🚕', mode:'Taxi from Kobe Sannomiya', time:'~45 min', note:'¥6,000–9,000' },
        { icon:'🚗', mode:'Uber (book ahead — limited in Kobe)', time:'~45 min' },
      ]},
  10: { options: [
        { icon:'🚇', mode:'Osaka Metro from Shinsaibashi to Nakanoshima', time:'~15 min', note:'Until ~12:30am' },
        { icon:'🚕', mode:'Taxi from Namba', time:'~15 min', note:'¥1,500–2,000' },
      ]},
  11: { options: [
        { icon:'🚶', mode:'Walk through Namba / Nishi-Nihonbashi', time:'~20 min' },
        { icon:'🚇', mode:'Metro from Nipponbashi → 2 stops', time:'~10 min', note:'Early afternoon, trains plentiful' },
      ]},
  12: { options: [
        { icon:'🚂', mode:'Hanshin Main Line → Osaka-Namba, Metro to Conrad', time:'~45 min', note:'Post-game crowds — expect wait' },
        { icon:'🚕', mode:'Taxi from Koshien (queue outside stadium)', time:'~50 min', note:'¥5,000–8,000' },
        { icon:'🚗', mode:'Uber (pre-book 10 min before game ends)', time:'~45 min' },
      ]},
  13: { options: [
        { icon:'🚕', mode:'Taxi from Higashiyama', time:'~12 min', note:'¥1,200–1,800' },
        { icon:'🚶', mode:'Walk downhill along Higashiyama-dori', time:'~25 min' },
        { icon:'🚌', mode:'Kyoto City Bus 206 toward Kyoto Station', time:'~20 min', note:'Last bus check before going' },
      ]},
  14: { options: [
        { icon:'🚕', mode:'Taxi from Nanzen-ji', time:'~15 min', note:'¥1,500–2,000' },
        { icon:'🚶', mode:'Walk downhill (pleasant in June evening)', time:'~30 min' },
      ]},
  15: { options: [
        { icon:'🚕', mode:'Taxi from Nishiki area', time:'~12 min', note:'¥1,200–1,800' },
        { icon:'🚶', mode:'Walk south on Karasuma-dori', time:'~20 min' },
      ]},
  16: { warning:'Late return from Gion (~11pm) — taxis plentiful at this hour, no need to rush.',
        options: [
        { icon:'🚕', mode:'Taxi from Hanamikoji (stand on Shijo-dori)', time:'~10 min', note:'¥1,000–1,500, very easy' },
        { icon:'🚶', mode:'Walk along Gojo-dori', time:'~20 min' },
        { icon:'🚗', mode:'Uber (available in Kyoto)', time:'~10 min' },
      ]},
  18: { warning:'Final night — early Haruka Express tomorrow morning. Home by midnight.',
        options: [
        { icon:'🚕', mode:'Taxi from Gion (corner of Hanamikoji)', time:'~10 min', note:'¥1,000–1,500' },
        { icon:'🚶', mode:'Walk via Shijo → Kawaramachi → Shichijo', time:'~20 min' },
        { icon:'🚗', mode:'Uber (pre-book for peace of mind)', time:'~10 min' },
      ]},
};

const ReturnTransitCard: React.FC<{ data: ReturnTransitData; hotelName: string }> = ({ data, hotelName }) => {
  const { activeDay } = useStore();
  const color = regionColors[regionMap[activeDay]];
  return (
    <div style={{ marginTop: '4px', borderTop: '1px dashed var(--paper-fold)', paddingTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
        <span style={{ fontSize: '13px' }}>🏨</span>
        <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.67rem', fontWeight: 700, letterSpacing: '1.8px', textTransform: 'uppercase', color }}>Return to {hotelName}</span>
      </div>
      {data.warning && (
        <div style={{ fontSize: '11px', color: '#b83020', fontWeight: 600, marginBottom: '8px', padding: '6px 10px', background: 'rgba(184,48,32,0.06)', borderRadius: '5px', borderLeft: '3px solid #b83020' }}>
          ⚠ {data.warning}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {data.options.map((opt, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', padding: '7px 10px', background: 'rgba(0,0,0,0.025)', borderRadius: '5px' }}>
            <span style={{ fontSize: '15px', flexShrink: 0 }}>{opt.icon}</span>
            <span style={{ flex: 1, color: 'var(--ink)', lineHeight: 1.4 }}>{opt.mode}</span>
            <span style={{ fontVariantNumeric: 'tabular-nums', color, fontWeight: 600, flexShrink: 0, fontSize: '11px' }}>{opt.time}</span>
            {opt.note && <span style={{ fontSize: '10px', color: 'var(--ink-fade)', flexShrink: 0, maxWidth: '90px', textAlign: 'right', lineHeight: 1.3 }}>{opt.note}</span>}
          </div>
        ))}
      </div>
    </div>
  );
};


const JournalPane: React.FC = () => {
  const { activeDay, doneActivities, openStory, aiSuggestions, rainMode } = useStore();
  const region = regionMap[activeDay];
  const color = regionColors[region];
  const hero = REGION_HEROES[region] || REGION_HEROES.tokyo;

  const [animClass, setAnimClass] = React.useState('');
  const [scrollPct, setScrollPct] = React.useState(0);
  const prevDayRef = React.useRef(activeDay);

  React.useEffect(() => {
    const wrapper = document.querySelector('.journal-pane-wrapper') as HTMLElement;
    if (!wrapper) return;
    wrapper.scrollTop = 0;
    setScrollPct(0);
    if (prevDayRef.current === activeDay) return;
    const fwd = activeDay > prevDayRef.current;
    prevDayRef.current = activeDay;
    setAnimClass(fwd ? 'day-slide-fwd' : 'day-slide-back');
    const t = setTimeout(() => setAnimClass(''), 380);
    return () => clearTimeout(t);
  }, [activeDay]);

  React.useEffect(() => {
    const wrapper = document.querySelector('.journal-pane-wrapper') as HTMLElement;
    if (!wrapper) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = wrapper;
      setScrollPct(scrollHeight <= clientHeight ? 0 : (scrollTop / (scrollHeight - clientHeight)) * 100);
    };
    wrapper.addEventListener('scroll', onScroll, { passive: true });
    return () => wrapper.removeEventListener('scroll', onScroll);
  }, []);
  const metadata = dayMeta[activeDay];

  const _acts = activities[activeDay] || [];

  return (
    <div className="journal-pane" style={{ '--rc': color } as React.CSSProperties}>
      <div className="scroll-progress-wrap"><div className="scroll-progress-fill" style={{ width: `${scrollPct}%` }} /></div>
      <div className={animClass} style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '96px' }}>
        <div className="region-hero" style={{ background: hero.gradient }}>
          <span className="region-tag">{region} Region</span>
          <h2 className="day-title"><span style={{ color }}>〜</span> {metadata.title}</h2>
          <p className="region-hero-tagline">{hero.tagline}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="lodging-badge-row" style={{ marginBottom: 0 }}>
            <span className="lodging-badge">LODGING</span>
            <span className="lodging-name">{metadata.lodging}</span>
          </div>
          <button className="story-play-btn" onClick={() => openStory(activeDay)} title="Story Mode">
            <span className="story-play-icon">▶</span><span className="story-play-label">Story</span>
          </button>
          </div>
        </div>
        {rainMode && <RainModeDayCard day={activeDay} />}

        {/* Compact schedule timeline */}
        <div className="schedule-timeline-wrap" style={{ padding: '14px 16px 10px', background: 'rgba(0,0,0,0.025)', borderRadius: '5px', border: '1px solid var(--paper-fold)' }}>
          <DayScheduleTimeline day={activeDay} color={color} />
        </div>
        {(() => {
          const totalActs = _acts.length;
          const doneCount = _acts.filter((_: any, i: number) => doneActivities[`${activeDay}_${i}`]).length;
          if (doneCount === 0) return null;
          const pct = (doneCount / totalActs) * 100;
          return (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-display)', letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--ink-fade)', marginBottom: '5px' }}>
                <span>{doneCount} of {totalActs} completed</span>
                <span style={{ color }}>{Math.round(pct)}%</span>
              </div>
              <div style={{ height: '3px', background: 'var(--paper-fold)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
              </div>
            </div>
          );
        })()}
        <PhrasebookInline />
        <div className="day-scroll-layout">
          <div className="timeline-container">
            {hotelAnchors[activeDay] && (() => {
              const hotel = hotelAnchors[activeDay]!;
              const outbound = transits[activeDay]?.[0];
              return (
                <div style={{ marginBottom: '16px', padding: '10px 14px', background: 'rgba(0,0,0,0.025)', borderRadius: '7px', border: '1px solid var(--paper-fold)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '18px', flexShrink: 0 }}>🏨</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color, fontFamily: 'var(--font-display)', marginBottom: '2px' }}>Departing from</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hotel.name}</div>
                  </div>
                  {outbound && (
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '12px', color: 'var(--ink-light)' }}>{outbound.icon} {outbound.mode}</div>
                      <div style={{ fontSize: '11px', color, fontWeight: 600, marginTop: '2px' }}>{outbound.time}</div>
                    </div>
                  )}
                </div>
              );
            })()}
            {_acts.map((act: any, idx: number) => (
              <ActivityItem key={idx} activity={act} index={idx}
                transit={idx > 0 ? (transits[activeDay]?.[idx] ?? undefined) : undefined} />
            ))}
            {aiSuggestions[activeDay]?.map((act, idx) => (
              <div key={`ai_${idx}`} className="ai-timeline-item" style={{ borderColor: `${color}60` }}>
                <span className="ai-timeline-badge" style={{ background: color }}>✦ AI</span>
                <ActivityItem activity={act} index={9000 + idx} />
              </div>
            ))}
            {returnTransits[activeDay] && hotelAnchors[activeDay] && (
              <ReturnTransitCard data={returnTransits[activeDay]} hotelName={hotelAnchors[activeDay]!.name} />
            )}
          </div>
          
        </div>
        <MealsSection />
        <ReservationsPanel />
      </div>
    </div>
  );
};

const getPinIconUrl = (type: string, color: string, num?: number, done = false) => {
  if (done) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36"><path d="M14 2C9.03 2 5 6.03 5 11c0 6.56 9 23 9 23s9-16.44 9-23c0-4.97-4.03-9-9-9z" fill="#b0a898" stroke="#fff" stroke-width="0.8"/><text x="14" y="12" font-size="11" font-family="Georgia,serif" fill="#fff" text-anchor="middle" dominant-baseline="middle">✓</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }
  const label = num !== undefined ? `<text x="12" y="13" font-size="8" font-family="Georgia,serif" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">${num}</text>` : '';
  const isHotel = type === 'hotel';
  const pinColor = isHotel ? '#7a3018' : color;
  const svg = isHotel
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36"><path d="M14 2C9.03 2 5 6.03 5 11c0 6.56 9 23 9 23s9-16.44 9-23c0-4.97-4.03-9-9-9z" fill="${pinColor}" stroke="#fff" stroke-width="1"/><text x="14" y="12" font-size="9" font-family="Georgia,serif" font-weight="bold" fill="#fff" text-anchor="middle" dominant-baseline="middle">H</text></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 36" width="28" height="36"><path d="M14 2C9.03 2 5 6.03 5 11c0 6.56 9 23 9 23s9-16.44 9-23c0-4.97-4.03-9-9-9z" fill="${pinColor}" stroke="#fff" stroke-width="0.8"/>${label}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const StoryOverlay: React.FC = () => {
  const { storyDay, storyStep, closeStory, setStoryStep } = useStore();
  const googleMap = useMap('travel_map');
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [dir, setDir] = React.useState<'fwd' | 'back'>('fwd');
  const [animKey, setAnimKey] = React.useState(0);
  const touchStartX = React.useRef<number | null>(null);
  const flyInDoneRef = React.useRef(false);

  const acts: any[] = storyDay !== null ? ((activities as any)[storyDay] || []) : [];
  const act = acts[storyStep] ?? null;
  const region = storyDay !== null ? (regionMap[storyDay] || 'tokyo') : 'tokyo';
  const color = regionColors[region];
  const hero = REGION_HEROES[region] || REGION_HEROES.tokyo;

  // ── Cinematic fly-in when story opens ──────────────────────────────────────
  const REGION_CENTERS: Record<string, {lat:number;lng:number}> = {
    tokyo:  {lat:35.68,  lng:139.77},
    hakone: {lat:35.25,  lng:139.10},
    osaka:  {lat:34.70,  lng:135.50},
    kyoto:  {lat:35.01,  lng:135.77},
  };
  React.useEffect(() => {
    if (storyDay === null) { flyInDoneRef.current = false; return; }
    if (flyInDoneRef.current || !googleMap || !act) return;
    flyInDoneRef.current = true;
    const g = (window as any).google;
    const city = REGION_CENTERS[region] || {lat:35.68, lng:139.77};
    const target = { lat: act.lat, lng: act.lng };
    // Kick off sequence
    setTimeout(() => {
      g?.maps?.event?.trigger(googleMap, 'resize');
      googleMap.setCenter({lat:36.2, lng:138.0});
      googleMap.setZoom(5); googleMap.setTilt(0);
    }, 50);
    setTimeout(() => {
      googleMap.panTo(city);
      _animVal(5, 10, 800, z => googleMap.setZoom(z));
    }, 300);
    setTimeout(() => {
      googleMap.panTo(target);
      _animVal(10, 15.5, 900, z => googleMap.setZoom(z), () => googleMap.setTilt(45));
    }, 1200);
  }, [storyDay]);

  const goTo = React.useCallback((step: number, d: 'fwd' | 'back') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setDir(d);
    setAnimKey(k => k + 1);
    setStoryStep(step);
  }, [setStoryStep]);
  const goNext = React.useCallback(() => {
    if (storyStep < acts.length - 1) goTo(storyStep + 1, 'fwd');
    else closeStory();
  }, [storyStep, acts.length, goTo, closeStory]);
  const goPrev = React.useCallback(() => {
    if (storyStep > 0) goTo(storyStep - 1, 'back');
  }, [storyStep, goTo]);

  React.useEffect(() => {
    if (!act || storyDay === null) return;
    if (googleMap && act.lat && act.lng) { googleMap.panTo({ lat: act.lat, lng: act.lng }); googleMap.setZoom(15); }
    timerRef.current = setTimeout(goNext, 6000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [storyStep, storyDay]);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeStory();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [goNext, goPrev, closeStory]);

  if (storyDay === null || !act) return null;

  const price = act.type === 'restaurant'
    ? (restaurantPrices as any)[act.title]
    : (activityPrices as any)[act.title];

  const storyTypeIcon: Record<string, string> = { hotel: '🏨', restaurant: '🍜', museum: '🏛', shop: '🛍', transit: '🚄', nature: '🌿' };
  const storyTypeLabel: Record<string, string> = { hotel: 'Hotel', restaurant: 'Dining', museum: 'Culture', shop: 'Shopping', transit: 'Transit', nature: 'Nature' };

  const typeBg: Record<string, string> = {
    hotel: '#130a02', restaurant: '#120305', museum: '#060a14',
    shop: '#0e0512', transit: '#05080f', nature: '#030d06',
  };
  const typeAccent: Record<string, string> = {
    hotel: '#d4952a', restaurant: '#c84040', museum: '#6890c0',
    shop: '#c87890', transit: '#6890c8', nature: '#5a9a5a',
  };
  const bg = typeBg[act.type] ?? '#0a0804';
  const accent = typeAccent[act.type] ?? color;
  const padded = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="story-overlay"
      style={{ '--story-bg': bg, '--story-accent': accent } as React.CSSProperties}
      onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={e => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 50) { dx < 0 ? goNext() : goPrev(); }
        touchStartX.current = null;
      }}
    >
      {/* Top strip: progress + header floats over map */}
      <div className="story-top-strip">
        <div className="story-progress">
          {acts.map((_: any, i: number) => (
            <div key={i} className="story-seg-wrap" onClick={() => goTo(i, i > storyStep ? 'fwd' : 'back')}>
              <div className={`story-seg${i < storyStep ? ' done' : i === storyStep ? ' active' : ''}`}
                style={i === storyStep ? { '--story-color': accent } as React.CSSProperties : {}} />
            </div>
          ))}
        </div>
        <div className="story-header">
          <div className="story-day-meta">
            <span className="story-day-label" style={{ color: accent }}>Day {storyDay}&nbsp;&nbsp;·&nbsp;&nbsp;{region.charAt(0).toUpperCase() + region.slice(1)}</span>
            <span className="story-tagline">{hero.tagline}</span>
          </div>
          <button className="story-close" onClick={closeStory}>✕</button>
        </div>
      </div>

      {/* Transparent window — map shows through here */}
      <div className="story-map-window" />

      {/* Gradient fade from transparent to type-bg */}
      <div className="story-fade" />

      {/* Bottom content panel */}
      <div key={`${storyDay}_${storyStep}_${animKey}`} className={`story-content story-content--${dir}`}>

        {/* Type badge row */}
        <div className="story-type-row">
          <span className="story-type-badge" style={{ color: accent, borderColor: `${accent}50`, background: `${accent}15` }}>
            <span className="story-type-icon-sm">{storyTypeIcon[act.type] ?? '📍'}</span>
            {storyTypeLabel[act.type] ?? act.type}
          </span>
          <span className="story-time-chip">{act.time}{act.duration ? `  ·  ${act.duration}` : ''}</span>
        </div>

        {/* Title */}
        <h2 className="story-title" style={{ '--title-glow': `${accent}30` } as React.CSSProperties}>
          {act.title}
        </h2>

        {/* Description */}
        <div className="story-desc-wrap">
          <p className="story-desc">{act.desc}</p>
          <div className="story-desc-fade" style={{ background: `linear-gradient(transparent, ${bg})` }} />
        </div>

        {/* Meta + Nav row */}
        <div className="story-bottom-row">
          <div className="story-meta-pills">
            {price !== undefined && price > 0 && (
              <span className="story-pill" style={{ color: accent, borderColor: `${accent}50`, background: `${accent}15` }}>💴 ${price}/pp</span>
            )}
            {price === 0 && <span className="story-pill story-pill--free">✓ Free</span>}
            {(act as any).optional && <span className="story-pill story-pill--opt">Optional</span>}
          </div>
          <div className="story-nav">
            <button className="story-nav-btn" onClick={goPrev} disabled={storyStep === 0}>‹</button>
            <span className="story-counter">
              <span style={{ color: accent }}>{padded(storyStep + 1)}</span>
              <span className="story-counter-dot"> · </span>
              <span>{padded(acts.length)}</span>
            </span>
            <button className="story-nav-btn" onClick={goNext}>
              {storyStep === acts.length - 1 ? '✕' : '›'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


const MapEngine: React.FC<{ activeDay: number; tilt3d?: boolean }> = ({ activeDay }) => {
  const googleMap = useMap('travel_map');
  const { selectedActivity, hoveredActivityKey, doneActivities } = useStore();
  const [markerData, setMarkerData] = useState<Array<{ marker: any; iw: any; lat: number; lng: number; actKey: string; originalIconUrl: string }>>([]);
  const [polyline, setPolyline] = useState<any>(null);
  const [transitLines, setTransitLines] = useState<any[]>([]);
  const openIwRef = React.useRef<any>(null);
  const animFrameRef = React.useRef<number>(0);

  useEffect(() => {
    if (!googleMap) return;
    const google = (window as any).google;
    if (!google) return;

    markerData.forEach(({ marker }) => marker.setMap(null));
    if (polyline) polyline.setMap(null);
    transitLines.forEach(p => p.setMap(null));
    setTransitLines([]);
    if (openIwRef.current) { openIwRef.current.close(); openIwRef.current = null; }
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    const dayActs = activities[activeDay] || [];
    const hotel = hotelAnchors[activeDay];
    const pathCoordinates: any[] = [];
    const bounds = new google.maps.LatLngBounds();
    const newMarkerData: typeof markerData = [];


    // Track segments with type for transit styling
    interface MapSeg { from: {lat:number;lng:number}; to: {lat:number;lng:number}; kind: 'normal'|'transit'|'longhaul'; }
    const mapSegs: MapSeg[] = [];
    const coordTypes: string[] = [];
    const coordTitles: string[] = [];

    let pinSeq = 0;
    const addPin = (
      loc: { lat: number; lng: number },
      title: string, type: string, color: string,
      isHotelPin = false, actKey = '',
      extra: { time?: string; duration?: string; desc?: string } = {}
    ) => {
      bounds.extend(loc);
      pathCoordinates.push(loc);
      const seq = isHotelPin ? undefined : ++pinSeq;
      const iconUrl = getPinIconUrl(type, color, seq);
      const marker = new google.maps.Marker({
        position: loc, map: googleMap, title,
        icon: { url: iconUrl, scaledSize: new google.maps.Size(28, 36) }
      });
      const icon = typeIcon[type] || '📍';
      const label = typeLabel[type] || type;
      const rawDesc = extra.desc || '';
      const shortDesc = rawDesc.substring(0, 130);
      const isCut = rawDesc.length > 130;
      const escapedTitle = title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const escapedDesc = shortDesc.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
      const iwContent = `<div style="font-family:Georgia,serif;max-width:230px;padding:10px 13px;line-height:1.5;color:#2a1a0a">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:15px">${icon}</span>
          <span style="font-size:9px;font-weight:700;letter-spacing:1.8px;text-transform:uppercase;color:#9a8870;font-family:sans-serif">${label}</span>
        </div>
        <div style="font-size:13px;font-weight:700;margin-bottom:4px">${escapedTitle}</div>
        ${extra.time ? `<div style="font-size:10px;color:#8a7a68;font-family:sans-serif;margin-bottom:6px">${extra.time}${extra.duration ? ' · ' + extra.duration : ''}</div>` : ''}
        ${escapedDesc ? `<div style="font-size:11px;color:#5a4a38;line-height:1.55">${escapedDesc}${isCut ? '…' : ''}</div>` : ''}
      </div>`;
      const iw = new google.maps.InfoWindow({ content: iwContent });
      marker.addListener('click', () => {
        if (openIwRef.current) openIwRef.current.close();
        iw.open(googleMap, marker);
        openIwRef.current = iw;
      });
      newMarkerData.push({ marker, iw, lat: loc.lat, lng: loc.lng, actKey, originalIconUrl: iconUrl });
    };

    if (hotel) {
      addPin({ lat: hotel.lat, lng: hotel.lng }, hotel.name, 'hotel', '#b83020', true, 'hotel');
      coordTypes.push('hotel'); coordTitles.push(hotel.name);
    }
    dayActs.forEach((act: any, i: number) => {
      addPin(
        { lat: act.lat, lng: act.lng }, act.title, act.type, '#c87e18', false, `${activeDay}_${i}`,
        { time: act.time, duration: act.duration, desc: act.desc }
      );
      coordTypes.push(act.type); coordTitles.push(act.title);
    });
    if (hotel && hotel.loop) {
      pathCoordinates.push({ lat: hotel.lat, lng: hotel.lng });
      coordTypes.push('hotel'); coordTitles.push(hotel.name);
    }

    // Build typed segments for transit styling
    for (let i = 0; i < pathCoordinates.length - 1; i++) {
      const t = coordTypes[i + 1] || coordTypes[i];
      const title = coordTitles[i + 1] || '';
      const isLong = t === 'transit' && (
        title.includes('Shinkansen') || title.includes('Haruka') ||
        title.includes('Express') || title.includes('Odakyu')
      );
      mapSegs.push({ from: pathCoordinates[i], to: pathCoordinates[i + 1], kind: t === 'transit' ? (isLong ? 'longhaul' : 'transit') : 'normal' });
    }

    setMarkerData(newMarkerData);

    if (pathCoordinates.length > 1) {
      const segColor = regionColors[regionMap[activeDay]] || '#c87e18';
      // Normal animated path (transit segments drawn transparently so only normal segments show)
      const normalPath = pathCoordinates.filter((_, i) =>
        i === 0 || mapSegs[i - 1]?.kind === 'normal'
      );
      const newPolyline = new google.maps.Polyline({
        path: [],
        strokeColor: segColor,
        strokeOpacity: 0.5,
        strokeWeight: 2.5,
        geodesic: true,
        icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 0.85, scale: 3, strokeColor: segColor }, offset: '0', repeat: '14px' }],
        map: googleMap,
      });
      setPolyline(newPolyline);

      // Transit overlays — dashed, styled by kind, drawn immediately
      const newTransitLines: any[] = [];
      mapSegs.forEach(seg => {
        if (seg.kind === 'normal') return;
        const isLong = seg.kind === 'longhaul';
        const segColor = isLong ? '#c84428' : '#4a80c8';
        const tl = new google.maps.Polyline({
          path: [seg.from, seg.to],
          strokeOpacity: 0,
          strokeWeight: isLong ? 4 : 2.5,
          geodesic: true,
          icons: [{
            icon: {
              path: 'M 0,-1 0,1',
              strokeOpacity: 0.9,
              scale: isLong ? 5 : 3,
              strokeColor: segColor,
              strokeWeight: isLong ? 3 : 2,
            },
            offset: '0',
            repeat: isLong ? '20px' : '13px',
          }],
          map: googleMap,
        });
        newTransitLines.push(tl);
      });
      setTransitLines(newTransitLines);

      const totalPath = [...pathCoordinates];
      const duration = 1800;
      const startTime = performance.now();
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
      const animatePath = (now: number) => {
        const t = Math.min((now - startTime) / duration, 1);
        const e = easeOut(t);
        const len = totalPath.length - 1;
        const pos = e * len;
        const idx = Math.floor(pos);
        const frac = pos - idx;
        const partial = totalPath.slice(0, idx + 1);
        if (idx < len) {
          partial.push({
            lat: totalPath[idx].lat + (totalPath[idx + 1].lat - totalPath[idx].lat) * frac,
            lng: totalPath[idx].lng + (totalPath[idx + 1].lng - totalPath[idx].lng) * frac,
          });
        }
        // Only animate normal segments
        const partialNormal = partial.filter((_, i) => i === 0 || mapSegs[i - 1]?.kind === 'normal');
        newPolyline.setPath(partialNormal.length > 1 ? partialNormal : partial);
        if (t < 1) { animFrameRef.current = requestAnimationFrame(animatePath); }
      };
      animFrameRef.current = requestAnimationFrame(animatePath);
    }
    if (pathCoordinates.length > 0) {
      const savedMap = googleMap;
      const savedBounds = bounds;
      setTimeout(() => savedMap.fitBounds(savedBounds, 60), 250);
    }
  }, [activeDay, googleMap]);

  useEffect(() => {
    if (!googleMap) return;
    const google = (window as any).google;
    if (!google) return;
    markerData.forEach(({ marker, actKey }) => {
      if (hoveredActivityKey && actKey === hoveredActivityKey) {
        marker.setAnimation(google.maps.Animation.BOUNCE);
      } else {
        if (marker.getAnimation() !== null) marker.setAnimation(null);
      }
    });
  }, [hoveredActivityKey, markerData]);

  useEffect(() => {
    markerData.forEach(({ marker, actKey, originalIconUrl }) => {
      const isDone = actKey && actKey !== 'hotel' && doneActivities[actKey];
      marker.setIcon({ url: isDone ? getPinIconUrl('', '', undefined, true) : originalIconUrl, scaledSize: new (window as any).google.maps.Size(28, 36) });
    });
  }, [doneActivities, markerData]);

  useEffect(() => {
    if (!googleMap || !selectedActivity) return;
    const google = (window as any).google;
    if (!google) return;
    const { lat, lng } = selectedActivity;
    const startCenter = googleMap.getCenter();
    if (!startCenter) { googleMap.panTo({ lat, lng }); googleMap.setZoom(15); return; }
    const startLat = startCenter.lat();
    const startLng = startCenter.lng();
    const startZoom = googleMap.getZoom() ?? 11;
    const targetZoom = 15;
    const midZoom = Math.max(9, Math.min(startZoom, targetZoom) - 2);
    const duration = 2200;
    const startTime = performance.now();
    const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const easeOut = (t: number) => 1 - Math.pow(1 - t, 2);
    const easeIn = (t: number) => t * t * t;
    const animate = (now: number) => {
      const t = Math.min((now - startTime) / duration, 1);
      const panE = easeInOut(t);
      const zoom = t < 0.4
        ? startZoom + (midZoom - startZoom) * easeOut(t / 0.4)
        : midZoom + (targetZoom - midZoom) * easeIn((t - 0.4) / 0.6);
      googleMap.moveCamera({
        center: { lat: startLat + (lat - startLat) * panE, lng: startLng + (lng - startLng) * panE },
        zoom,
      });
      if (t < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
    if (openIwRef.current) { openIwRef.current.close(); openIwRef.current = null; }
    markerData.forEach(({ marker, iw, actKey }) => {
      if (actKey === selectedActivity.key) {
        setTimeout(() => {
          if (openIwRef.current !== iw) { iw.open(googleMap, marker); openIwRef.current = iw; }
        }, 1800);
      }
    });
  }, [selectedActivity]);

  return null;
};

const PARCHMENT_MAP_STYLE: any[] = [
  { elementType: 'geometry', stylers: [{ saturation: -42 }, { lightness: 8 }, { gamma: 1.05 }] },
  { featureType: 'water', stylers: [{ color: '#a8bfcc' }, { saturation: -25 }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#e8d4a0' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#f2e4c0' }] },
  { featureType: 'road.local', elementType: 'geometry', stylers: [{ color: '#f8f0de' }] },
  { featureType: 'landscape.natural', stylers: [{ color: '#ede4d0' }] },
  { featureType: 'landscape.man_made', stylers: [{ color: '#e8dcc8' }] },
  { featureType: 'poi.park', stylers: [{ color: '#cad8b8' }] },
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#c8b888' }, { weight: 1.5 }] },
  { featureType: 'administrative', elementType: 'labels.text.fill', stylers: [{ color: '#7a5a38' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#5a3c1e' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4a6878' }] },
];

const MapPane: React.FC = () => {
  const { activeDay } = useStore();
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [tilt3d, setTilt3d] = useState(false);
  const [fading, setFading] = useState(false);
  const prevDayRef = React.useRef(activeDay);
  React.useEffect(() => {
    if (prevDayRef.current !== activeDay) {
      setFading(true);
      prevDayRef.current = activeDay;
      const t = setTimeout(() => setFading(false), 1100);
      return () => clearTimeout(t);
    }
  }, [activeDay]);
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Map
        id="travel_map"
        defaultCenter={{ lat: 35.6762, lng: 139.6503 }}
        defaultZoom={11}
        mapTypeId={mapType}
        styles={mapType === 'roadmap' ? PARCHMENT_MAP_STYLE : undefined}
        disableDefaultUI={true}
        zoomControl={true}
        gestureHandling="greedy"
        clickableIcons={false}
        style={{ width: '100%', height: '100%' }}
      >
        <MapEngine activeDay={activeDay} tilt3d={tilt3d} />
        <MapControl position={ControlPosition.TOP_RIGHT}>
          <div className="map-controls-overlay">
            <button onClick={() => setMapType('roadmap')} className={`map-control-btn ${mapType === 'roadmap' ? 'active' : ''}`}>Sketch Map</button>
            <button onClick={() => setMapType('hybrid')} className={`map-control-btn ${mapType === 'hybrid' ? 'active' : ''}`}>Satellite</button>
          </div>
        </MapControl>
      </Map>
      {fading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
          background: 'var(--paper)',
          animation: 'mapDayFade 1.1s ease-out forwards',
        }} />
      )}
    </div>
  );
};



const PhrasebookDrawer: React.FC = () => {
  const { phrasebookOpen, togglePhrasebook } = useStore();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [openCat, setOpenCat] = React.useState<string>('Greetings');

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(id);
    setTimeout(() => setCopied(null), 1500);
  };

  if (!phrasebookOpen) return null;
  return (
    <>
      <div className="pb-backdrop" onClick={togglePhrasebook} />
      <div className="pb-drawer">
        <div className="pb-header">
          <span className="pb-title">言葉 — Phrasebook</span>
          <button className="pb-close" onClick={togglePhrasebook}>✕</button>
        </div>
        <div className="pb-body">
          {_phrases.map(({ cat, items }) => (
            <div key={cat} className="pb-category">
              <button
                className={`pb-cat-btn ${openCat === cat ? 'open' : ''}`}
                onClick={() => setOpenCat(openCat === cat ? '' : cat)}
              >
                {cat} <span className="pb-cat-arrow">{openCat === cat ? '▲' : '▼'}</span>
              </button>
              {openCat === cat && (
                <div className="pb-items">
                  {items.map((p, i) => {
                    const id = `${cat}_${i}`;
                    return (
                      <div key={id} className="pb-item">
                        <div className="pb-jp">{p.jp}</div>
                        <div className="pb-rom">{p.rom}</div>
                        <div className="pb-en">{p.en}</div>
                        <button className="pb-speak" onClick={() => _speak(p.jp)} title="Hear pronunciation">🔊</button>
                        <button
                          className="pb-copy"
                          onClick={() => copy(p.jp, id)}
                          title="Copy Japanese"
                        >{copied === id ? '✓' : '⿻'}</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};


// ── Documents Page ───────────────────────────────────────────────────────────



// ── Shared activity row ───────────────────────────────────────────────────────
const ActivityRow: React.FC<{ act: any; day: number; price?: number; note?: string }> = ({ act, day, price, note }) => {
  const region = regionMap[day];
  const color = regionColors[region];
  return (
    <div style={{ display: 'flex', gap: '14px', padding: '14px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', background: 'rgba(255,255,255,0.5)' }}>
      <div style={{ flexShrink: 0, textAlign: 'center', minWidth: '38px' }}>
        <div style={{ fontSize: '18px' }}>{typeIcon[act.type] ?? '📍'}</div>
        <div style={{ fontSize: '10px', fontWeight: 700, color: color, textTransform: 'uppercase', letterSpacing: '0.4px', marginTop: '2px' }}>Day {day}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#1e1208', letterSpacing: '-0.2px' }}>{act.title}</div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'baseline', flexShrink: 0 }}>
            {note
              ? <span style={{ fontSize: '11px', color: '#4a8a4a', fontStyle: 'italic' }}>{note}</span>
              : price !== undefined && <span style={{ fontSize: '13px', fontWeight: 700, color: color }}>{price === 0 ? 'Free' : `$${price}/pp`}</span>
            }
            <span style={{ fontSize: '11px', color: '#aaa' }}>{act.time}</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: color, fontWeight: 600, marginTop: '1px', marginBottom: '5px' }}>
          {region.charAt(0).toUpperCase() + region.slice(1)} · {typeLabel[act.type] ?? act.type}
        </div>
        <p style={{ fontSize: '12.5px', color: '#5a4a3a', lineHeight: '1.55', margin: 0 }}>{act.desc}</p>
      </div>
    </div>
  );
};

// ── Restaurants Panel ─────────────────────────────────────────────────────────
const RestaurantsPanel: React.FC = () => {
  const { restaurantsOpen, toggleRestaurants } = useStore();
  if (!restaurantsOpen) return null;
  const rows: { day: number; act: any }[] = [];
  Object.entries(activities).forEach(([d, acts]) => {
    (acts as any[]).forEach(act => {
      if (act.type === 'restaurant') rows.push({ day: Number(d), act });
    });
  });
  rows.sort((a, b) => a.day - b.day || 0);
  const totalPerPerson = rows.reduce((s, { act }) => s + (restaurantPrices[act.title] ?? 0), 0);
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">🍜 Dining Itinerary</h2>
          <p className="docs-page-sub">{rows.length} meals across 18 days · est. per person</p>
        </div>
        <button className="docs-close-btn" onClick={toggleRestaurants}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.map(({ day, act }, i) => (
          <ActivityRow key={i} act={act} day={day}
            price={restaurantPrices[act.title]}
            note={restaurantNotes[act.title]}
          />
        ))}
      </div>
      <div style={{ borderTop: '2px solid rgba(0,0,0,0.08)', padding: '14px 24px', background: 'rgba(248,244,236,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#7a6a5a' }}>{rows.length} meals · est. dining per person</div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e1208', textAlign: 'right' }}>${totalPerPerson.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#aaa', textAlign: 'right' }}>${(totalPerPerson * 2).toLocaleString()} for 2</div>
        </div>
      </div>
    </div>
  );
};

// ── Activities Panel ──────────────────────────────────────────────────────────
const ActivitiesPanel: React.FC = () => {
  const { activitiesOpen, toggleActivities } = useStore();
  const [filter, setFilter] = React.useState<string>('all');
  if (!activitiesOpen) return null;
  const rows: { day: number; act: any }[] = [];
  Object.entries(activities).forEach(([d, acts]) => {
    (acts as any[]).forEach(act => {
      if (!['restaurant', 'hotel'].includes(act.type)) rows.push({ day: Number(d), act });
    });
  });
  rows.sort((a, b) => a.day - b.day);
  const types = ['all', ...Array.from(new Set(rows.map(r => r.act.type)))];
  const filtered = filter === 'all' ? rows : rows.filter(r => r.act.type === filter);
  const filteredTotal = filtered.reduce((s, { act }) => s + (activityPrices[act.title] ?? 0), 0);
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">🗺 Activities</h2>
          <p className="docs-page-sub">{filtered.length} of {rows.length} experiences · est. per person</p>
        </div>
        <button className="docs-close-btn" onClick={toggleActivities}>✕ Close</button>
      </div>
      <div style={{ display: 'flex', gap: '8px', padding: '10px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setFilter(t)} style={{
            padding: '4px 12px', borderRadius: '20px', border: '1.5px solid',
            borderColor: filter === t ? '#3a2a1a' : '#d0c8b8',
            background: filter === t ? '#3a2a1a' : 'transparent',
            color: filter === t ? '#f8f4ec' : '#7a6a5a',
            fontSize: '12px', fontWeight: 600, cursor: 'pointer',
            textTransform: 'capitalize', fontFamily: 'inherit',
          }}>
            {t === 'all' ? `All (${rows.length})` : `${typeIcon[t] ?? ''} ${typeLabel[t] ?? t}`}
          </button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {filtered.map(({ day, act }, i) => (
          <ActivityRow key={i} act={act} day={day} price={activityPrices[act.title]} />
        ))}
      </div>
      <div style={{ borderTop: '2px solid rgba(0,0,0,0.08)', padding: '14px 24px', background: 'rgba(248,244,236,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#7a6a5a' }}>{filtered.length} experiences · est. per person</div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e1208', textAlign: 'right' }}>${filteredTotal.toLocaleString()}</div>
          <div style={{ fontSize: '11px', color: '#aaa', textAlign: 'right' }}>${(filteredTotal * 2).toLocaleString()} for 2</div>
        </div>
      </div>
    </div>
  );
};


// ── Booking Timeline Panel ────────────────────────────────────────────────────



const URGENCY_META: Record<string, { label:string; color:string; bg:string }> = {
  now:  { label:'Book Now',          color:'#c03828', bg:'#fff0ed' },
  dec:  { label:'By Dec 2026',       color:'#b85a10', bg:'#fff5e8' },
  feb:  { label:'By Feb 2027',       color:'#7a6010', bg:'#fffbe8' },
  apr:  { label:'By Apr 2027',       color:'#3a6830', bg:'#eef5e8' },
  may:  { label:'By May 2027',       color:'#2a6858', bg:'#e8f5f2' },
  walk: { label:'Walk-in / Day-of',  color:'#7a7a7a', bg:'#f5f5f5' },
};

const BookingPanel: React.FC = () => {
  const { bookingOpen, toggleBooking } = useStore();
  const [booked, setBooked] = React.useState<Record<string,boolean>>(() =>
    JSON.parse(localStorage.getItem('wanderer_booked_v1') || '{}')
  );
  const [filter, setFilter] = React.useState<BookUrgency | 'all'>('all');
  if (!bookingOpen) return null;

  const toggleBooked = (key: string) => {
    setBooked(prev => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('wanderer_booked_v1', JSON.stringify(next));
      return next;
    });
  };

  const urgencyOrder: BookUrgency[] = ['now', 'dec', 'feb', 'apr', 'may', 'walk'];
  const filtered = filter === 'all' ? bookingItems : bookingItems.filter(i => i.urgency === filter);
  const grouped = urgencyOrder.map(u => ({ urgency: u, items: filtered.filter(i => i.urgency === u) })).filter(g => g.items.length > 0);
  const totalItems = bookingItems.length;
  const bookedCount = bookingItems.filter(i => booked[i.key]).length;

  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">📅 Booking Timeline</h2>
          <p className="docs-page-sub">Trip: May 28 – Jun 15, 2027 · Today: Jun 21, 2026 · {bookedCount}/{totalItems} confirmed</p>
        </div>
        <button className="docs-close-btn" onClick={toggleBooking}>✕ Close</button>
      </div>
      <div style={{ display: 'flex', gap: '6px', padding: '10px 20px', borderBottom: '1px solid rgba(0,0,0,0.06)', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => setFilter('all')} style={{ padding: '4px 12px', borderRadius: '20px', border: '1.5px solid', borderColor: filter === 'all' ? '#3a2a1a' : '#d0c8b8', background: filter === 'all' ? '#3a2a1a' : 'transparent', color: filter === 'all' ? '#f8f4ec' : '#7a6a5a', fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>All ({totalItems})</button>
        {urgencyOrder.map(u => {
          const meta = URGENCY_META[u];
          const count = bookingItems.filter(i => i.urgency === u).length;
          return <button key={u} onClick={() => setFilter(u)} style={{ padding: '4px 12px', borderRadius: '20px', border: `1.5px solid ${filter === u ? meta.color : '#d0c8b8'}`, background: filter === u ? meta.color : 'transparent', color: filter === u ? '#fff' : meta.color, fontSize: '12px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>{meta.label} ({count})</button>;
        })}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {grouped.map(({ urgency: u, items }) => {
          const meta = URGENCY_META[u];
          return (
            <div key={u}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '0.72rem', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: meta.color }}>{meta.label}</span>
                <div style={{ flex: 1, height: '1px', background: `${meta.color}30` }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {items.map(item => {
                  const isDone = booked[item.key];
                  return (
                    <div key={item.key} style={{ background: isDone ? 'rgba(0,0,0,0.03)' : meta.bg, borderRadius: '10px', border: `1.5px solid ${isDone ? '#d0c8b8' : meta.color}30`, padding: '14px 16px', opacity: isDone ? 0.55 : 1, transition: 'opacity 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '18px', flexShrink: 0 }}>{item.icon}</span>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1e1208', textDecoration: isDone ? 'line-through' : 'none' }}>{item.name}</div>
                            <div style={{ fontSize: '10px', color: meta.color, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '1px' }}>{item.dayRef} · {item.category}</div>
                          </div>
                        </div>
                        <button onClick={() => toggleBooked(item.key)} style={{ flexShrink: 0, padding: '4px 12px', borderRadius: '12px', border: `1.5px solid ${isDone ? '#4a8a4a' : meta.color}`, background: isDone ? '#eef5e8' : 'transparent', color: isDone ? '#4a8a4a' : meta.color, fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}>
                          {isDone ? '✓ Booked' : 'Mark booked'}
                        </button>
                      </div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: meta.color, marginBottom: '5px', fontStyle: 'italic' }}>⏰ {item.bookBy}</div>
                      <p style={{ fontSize: '12px', color: '#5a4a38', lineHeight: '1.6', margin: 0 }}>{item.how}</p>
                      {item.note && <div style={{ marginTop: '8px', padding: '6px 10px', background: `${meta.color}15`, borderRadius: '6px', fontSize: '11px', color: meta.color, fontWeight: 600 }}>⚠ {item.note}</div>}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '2px solid rgba(0,0,0,0.08)', padding: '14px 24px', background: 'rgba(248,244,236,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#7a6a5a' }}>{bookedCount} confirmed · {totalItems - bookedCount} remaining</div>
        <div style={{ height: '6px', width: '160px', background: 'var(--paper-fold)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(bookedCount / totalItems) * 100}%`, background: '#4a8a4a', transition: 'width 0.4s ease', borderRadius: '3px' }} />
        </div>
      </div>
    </div>
  );
};

// ── Hotels Panel ─────────────────────────────────────────────────────────────

const HotelsPanel: React.FC = () => {
  const { hotelsOpen, toggleHotels } = useStore();
  const [confirmations, setConfirmations] = React.useState<Record<string, string>>({});
  if (!hotelsOpen) return null;
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">🏨 Hotel Itinerary</h2>
          <p className="docs-page-sub">4 properties · 18 nights · May 28 – Jun 15, 2027</p>
        </div>
        <button className="docs-close-btn" onClick={toggleHotels}>✕ Close</button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px 24px 8px' }}>
        {hotelStops.map((stop, i) => {
          const regionKey = ({'Tokyo':'tokyo','Hakone':'hakone','Osaka':'osaka','Kyoto':'kyoto'} as Record<string,string>)[stop.city] || 'tokyo';
    const color = regionColors[regionKey];
          const subtotal = stop.perNight * stop.nights;
          return (
            <div key={i} style={{ background: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: `2px solid ${color}30`, overflow: 'hidden' }}>
              <div style={{ borderLeft: `4px solid ${color}`, padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: '#1e1208', letterSpacing: '-0.3px' }}>{stop.name}</div>
                    <div style={{ fontSize: '12px', color: color, fontWeight: 600, marginTop: '2px' }}>{stop.city}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: color }}>${subtotal.toLocaleString()}</div>
                    <div style={{ fontSize: '11px', color: '#aaa' }}>${stop.perNight.toLocaleString()} × {stop.nights} nights</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '20px', margin: '10px 0 8px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600 }}>Check-in</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a1a0a' }}>{stop.checkIn}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#999', fontWeight: 600 }}>Check-out</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#2a1a0a' }}>{stop.checkOut}</div>
                  </div>
                </div>
                <p style={{ fontSize: '12.5px', color: '#5a4a3a', lineHeight: '1.5', margin: '0 0 12px' }}>{stop.note}</p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="text" placeholder="Confirmation number"
                    value={confirmations[`hotel_${i}`] || ''}
                    onChange={e => setConfirmations(prev => ({ ...prev, [`hotel_${i}`]: e.target.value }))}
                    style={{ flex: 1, fontSize: '13px', padding: '6px 10px', borderRadius: '6px', border: '1.5px solid #d0c8b8', background: 'rgba(255,255,255,0.8)', outline: 'none', fontFamily: 'inherit' }}
                  />
                  {confirmations[`hotel_${i}`] && <span style={{ fontSize: '11px', color: '#4a8a4a', fontWeight: 600 }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: '2px solid rgba(0,0,0,0.08)', padding: '14px 24px', background: 'rgba(248,244,236,0.9)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '13px', color: '#7a6a5a' }}>17 nights · 4 properties · est. accommodation</div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e1208' }}>
          ${hotelStops.reduce((s, h) => s + h.perNight * h.nights, 0).toLocaleString()}
        </div>
      </div>
    </div>
  );
};

// ── Flight Panel ──────────────────────────────────────────────────────────────
const flightLegs = [
  {
    label: 'Outbound',
    airline: 'ANA — All Nippon Airways (Star Alliance 5-Star)',
    flight: 'NH 11',
    route: 'ORD → NRT',
    from: "Chicago O'Hare (ORD)",
    to: 'Tokyo Narita (NRT)',
    departs: '11:20 AM',
    arrives: '02:15 PM +1',
    date: 'Thu, May 13, 2027',
    arrivalDate: 'Fri, May 14, 2027',
    duration: '12h 55m · Nonstop',
    cabin: 'Premium Economy (38" Pitch · Lounge Access · 2-4-2)',
    terminal: 'ORD Terminal 1 (Star Alliance) · NRT Terminal 1',
    color: '#c87e18',
  },
  {
    label: 'Return',
    airline: 'ANA — All Nippon Airways (Star Alliance 5-Star)',
    flight: 'NH 12',
    route: 'NRT → ORD',
    from: 'Tokyo Narita (NRT)',
    to: "Chicago O'Hare (ORD)",
    departs: '05:00 PM',
    arrives: '02:45 PM',
    date: 'Mon, May 31, 2027',
    arrivalDate: 'Mon, May 31, 2027',
    duration: '11h 45m · Nonstop',
    cabin: 'Premium Economy (38" Pitch · Lounge Access · 2-4-2)',
    terminal: 'NRT Terminal 1 · ORD Terminal 1 (Star Alliance)',
    color: '#7a4a88',
  },
];

const FlightPanel: React.FC = () => {
  const { flightOpen, toggleFlight } = useStore();
  const [notes, setNotes] = React.useState<Record<number, string>>({});
  if (!flightOpen) return null;
  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">✈ Flight Itinerary</h2>
          <p className="docs-page-sub">Roundtrip Nonstop · ORD ↔ NRT · ANA NH 11 / 12 · $3,190 Total for 2 ($1,595/ea · Saved $1,397 vs JAL)</p>
        </div>
        <button className="docs-close-btn" onClick={toggleFlight}>✕ Close</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '0 24px 32px' }}>
        {flightLegs.map((leg, i) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.65)',
            borderRadius: '14px',
            border: `2px solid ${leg.color}30`,
            overflow: 'hidden',
          }}>
            <div style={{ borderLeft: `4px solid ${leg.color}`, padding: '20px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <div>
                  <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: leg.color, fontWeight: 700 }}>{leg.label}</span>
                  <div style={{ fontSize: '22px', fontWeight: 800, color: '#1e1208', letterSpacing: '-0.5px', marginTop: '2px' }}>{leg.route}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#1e1208' }}>{leg.flight}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{leg.airline}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0', alignItems: 'center', margin: '16px 0' }}>
                <div style={{ textAlign: 'left', minWidth: '110px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: leg.color, letterSpacing: '-1px' }}>{leg.departs}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2a1a0a' }}>{leg.from}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>{leg.date}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 16px' }}>
                  <div style={{ fontSize: '11px', color: '#888', fontWeight: 500, letterSpacing: '0.3px' }}>{leg.duration}</div>
                  <div style={{ width: '100%', height: '1.5px', background: `linear-gradient(to right, ${leg.color}60, ${leg.color})`, margin: '6px 0', position: 'relative' }}>
                    <span style={{ position: 'absolute', right: '-6px', top: '-5px', fontSize: '12px', color: leg.color }}>✈</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa' }}>{leg.cabin}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '110px' }}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: leg.color, letterSpacing: '-1px' }}>{leg.arrives}</div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#2a1a0a' }}>{leg.to}</div>
                  <div style={{ fontSize: '11px', color: '#999' }}>{leg.arrivalDate}</div>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '14px', borderTop: '1px solid #e8e0d0', paddingTop: '10px' }}>{leg.terminal}</div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Confirmation / record locator"
                  value={notes[i] || ''}
                  onChange={e => setNotes(prev => ({ ...prev, [i]: e.target.value }))}
                  style={{
                    flex: 1, fontSize: '13px', padding: '7px 10px', borderRadius: '6px',
                    border: '1.5px solid #d0c8b8', background: 'rgba(255,255,255,0.8)',
                    outline: 'none', fontFamily: 'inherit',
                  }}
                />
                {notes[i] && <span style={{ fontSize: '11px', color: '#4a8a4a', fontWeight: 600 }}>✓ Saved</span>}
              </div>
            </div>
          </div>
        ))}
        <div style={{
          background: 'rgba(248,244,236,0.8)', borderRadius: '10px', padding: '14px 18px',
          fontSize: '12px', color: '#7a6a5a', lineHeight: '1.6',
          border: '1px solid #e0d8c8',
        }}>
          <strong style={{ color: '#3a2a1a' }}>Open-jaw routing.</strong> Outbound on NH111 (ORD→HND, nonstop).
          Return on NH843 (KIX→ORD, nonstop). Book as two separate one-ways on ana.co.jp.
          Haruka Express from Kyoto Station to KIX takes ~75 minutes — allow 3 hours before departure.
        </div>
      </div>
    </div>
  );
};


const DocsPage: React.FC = () => {
  const { documents, addDocument, removeDocument, toggleDocsPage } = useStore();
  const inputRefs = React.useRef<Record<number, HTMLInputElement | null>>({});

  const catLabels: Record<string,string> = {
    hotel:'Hotel', restaurant:'Dining', museum:'Museum',
    shop:'Shopping', transit:'Transit', nature:'Nature'
  };

  const openDoc = (doc: DocEntry) => {
    const win = window.open();
    if (!win) return;
    if (doc.mime === 'application/pdf') {
      win.document.write(`<iframe src="${doc.b64}" style="width:100%;height:100vh;border:none"/>`);
    } else {
      win.document.write(`<img src="${doc.b64}" style="max-width:100%;display:block;margin:auto"/>`);
    }
  };

  const handleFiles = (dayId: number, files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => addDocument(dayId, { name: file.name, b64: reader.result as string, mime: file.type });
      reader.readAsDataURL(file);
    });
  };

  const totalDocs = Object.values(documents).reduce((n, arr) => n + (arr?.length ?? 0), 0);

  return (
    <div className="docs-page">
      <div className="docs-page-header">
        <div>
          <h2 className="docs-page-title">📎 Documents & Confirmations</h2>
          <p className="docs-page-sub">{totalDocs} file{totalDocs !== 1 ? 's' : ''} stored across all days</p>
        </div>
        <button className="docs-close-btn" onClick={toggleDocsPage}>✕ Close</button>
      </div>

      <div className="docs-grid">
        {Array.from({ length: 18 }, (_, i) => i + 1).map(day => {
          const docs = documents[day] || [];
          const meta = dayMeta[day];
          const region = regionMap[day];
          const color = regionColors[region];
          return (
            <div key={day} className={`docs-day-card ${docs.length > 0 ? 'has-docs' : ''}`}
              style={{ '--rc': color } as React.CSSProperties}>
              <div className="docs-day-header">
                <span className="docs-day-num" style={{ color }}>Day {day}</span>
                <span className="docs-day-title">{meta.title}</span>
                <span className="docs-day-region">{region}</span>
              </div>
              {docs.length > 0 && (
                <ul className="docs-file-list">
                  {docs.map((doc, idx) => (
                    <li key={idx} className="docs-file-item">
                      <span className="docs-file-icon">
                        {doc.mime === 'application/pdf' ? '📄' : '🖼'}
                      </span>
                      <span className="docs-file-name">{doc.name}</span>
                      <div className="docs-file-actions">
                        <button className="docs-file-btn view" onClick={() => openDoc(doc)}>View</button>
                        <button className="docs-file-btn del" onClick={() => removeDocument(day, idx)}>✕</button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <input
                ref={el => { inputRefs.current[day] = el; }}
                type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" multiple
                style={{ display: 'none' }}
                onChange={e => handleFiles(day, e.target.files)}
              />
              <button className="docs-upload-btn" onClick={() => inputRefs.current[day]?.click()}>
                + Upload
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DayNav: React.FC = () => {
  const { activeDay, setActiveDay } = useStore();
  const activeGroup = regionGroups.find(g => g.days.includes(activeDay)) || regionGroups[0];

  const h2r = (hex: string, a: number) => {
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  };

  const tabIcons: Record<string,React.ReactNode> = {
    Tokyo: (
      <svg viewBox="0 0 14 20" width="11" height="15" aria-hidden="true">
        <ellipse cx="7" cy="13" rx="4.5" ry="5.5" fill="none" stroke="currentColor" strokeWidth="1.1"/>
        <line x1="7" y1="7.5" x2="7" y2="5" stroke="currentColor" strokeWidth="1"/>
        <line x1="5" y1="5" x2="9" y2="5" stroke="currentColor" strokeWidth="1"/>
        <line x1="3.5" y1="11" x2="10.5" y2="11" stroke="currentColor" strokeWidth="0.7"/>
        <line x1="3" y1="13.5" x2="11" y2="13.5" stroke="currentColor" strokeWidth="0.7"/>
      </svg>
    ),
    Hakone: (
      <svg viewBox="0 0 20 15" width="14" height="10" aria-hidden="true">
        <path d="M2 14 L10 1 L18 14Z" fill="none" stroke="currentColor" strokeWidth="1.1"/>
        <path d="M7 14 L9 9.5 L11 14" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <path d="M0 14 L20 14" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5"/>
        <path d="M7 5 Q10 3 13 5" fill="none" stroke="currentColor" strokeWidth="0.7" strokeOpacity="0.6"/>
      </svg>
    ),
    Osaka: (
      <svg viewBox="0 0 18 17" width="13" height="12" aria-hidden="true">
        <line x1="4" y1="16" x2="4" y2="6" stroke="currentColor" strokeWidth="1.2"/>
        <line x1="14" y1="16" x2="14" y2="6" stroke="currentColor" strokeWidth="1.2"/>
        <path d="M1 8.5 L17 8.5" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M2.5 11.5 L15.5 11.5" stroke="currentColor" strokeWidth="1"/>
        <path d="M0 8.5 Q9 4 18 8.5" stroke="currentColor" strokeWidth="1"/>
      </svg>
    ),
    Kyoto: (
      <svg viewBox="0 0 18 18" width="12" height="12" aria-hidden="true">
        <circle cx="9" cy="9" r="2.2" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <ellipse cx="9" cy="3.2" rx="1.8" ry="2.8" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <ellipse cx="9" cy="14.8" rx="1.8" ry="2.8" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <ellipse cx="3.2" cy="9" rx="2.8" ry="1.8" fill="none" stroke="currentColor" strokeWidth="0.9"/>
        <ellipse cx="14.8" cy="9" rx="2.8" ry="1.8" fill="none" stroke="currentColor" strokeWidth="0.9"/>
      </svg>
    ),
  };

  const sootSlots = React.useMemo(() =>
    [9,22,37,53,68,83].map((lp,i) => ({ lp, sz: 8 + (i%3)*4, delay: i*1.65 })), []);

  return (
    <div
      className="ghibli-nav"
      style={{ '--nav-glow': h2r(activeGroup.color, 0.20) } as React.CSSProperties}
    >
      {/* ── soot sprites ── */}
      {sootSlots.map(({ lp, sz, delay }, i) => (
        <span
          key={i}
          className="kurosuke"
          style={{ left: `${lp}%`, width: sz, height: sz, animationDelay: `${delay}s` }}
        />
      ))}

      {/* ── region tabs ── */}
      <div className="ghibli-tabs">
        {regionGroups.map(g => {
          const on = activeGroup.name === g.name;
          return (
            <button
              key={g.name}
              onClick={() => setActiveDay(g.days[0])}
              className={`ghibli-tab${on ? ' ghibli-tab--on' : ''}`}
              style={{
                '--rc':  g.color,
                '--rcf': h2r(g.color, 0.18),
              } as React.CSSProperties}
            >
              <span className="ghibli-tab-icon">{tabIcons[g.name]}</span>
              {g.name}
            </button>
          );
        })}
      </div>

      {/* ── day seed vine ── */}
      <div className="ghibli-vine-row">
        {activeGroup.days.map((d, idx) => (
          <React.Fragment key={d}>
            {idx > 0 && (
              <svg width="16" height="34" viewBox="0 0 16 34" className="vine-seg" aria-hidden="true">
                <path
                  d={idx % 2 === 0
                    ? 'M8 0 Q3 8 8 17 Q13 26 8 34'
                    : 'M8 0 Q13 8 8 17 Q3 26 8 34'}
                  stroke={activeGroup.color}
                  strokeWidth="1.1"
                  strokeOpacity="0.32"
                  fill="none"
                />
                {idx % 3 === 1 && (
                  <ellipse cx="8" cy="17" rx="3" ry="1.8" fill={activeGroup.color} fillOpacity="0.28"/>
                )}
              </svg>
            )}
            <button
              onClick={() => setActiveDay(d)}
              className={`ghibli-seed${activeDay === d ? ' ghibli-seed--on' : ''}`}
              style={{
                '--rc':  activeGroup.color,
                '--rcg': h2r(activeGroup.color, 0.48),
              } as React.CSSProperties}
            >
              {d}
            </button>
          </React.Fragment>
        ))}
      </div>
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

// ── AI Live Planner ───────────────────────────────────────────────────────────
interface AIChatMsg { role: 'user' | 'assistant'; content: string; }
interface AISuggestedAct { time: string; title: string; type: string; lat: number; lng: number; desc: string; }

const AIPlanner: React.FC = () => {
  const { aiPlannerOpen, toggleAIPlanner, activeDay, aiSuggestions, addAiSuggestion, removeAiSuggestion } = useStore();
  const [msgs, setMsgs] = React.useState<AIChatMsg[]>([]);
  const [input, setInput] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [parsedSuggestions, setParsedSuggestions] = React.useState<AISuggestedAct[]>([]);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [msgs, loading]);

  if (!aiPlannerOpen) return null;

  const region = regionMap[activeDay] || 'tokyo';
  const dayActs: Activity[] = (activities as any)[activeDay] || [];
  const aiAdded = aiSuggestions[activeDay] || [];

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setParsedSuggestions([]);
    const newMsgs: AIChatMsg[] = [...msgs, { role: 'user', content: userMsg }];
    setMsgs(newMsgs);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: activeDay,
          region,
          dayTitle: (dayMeta as any)[activeDay]?.title || '',
          activities: dayActs.map(a => ({ time: a.time, title: a.title, type: a.type })),
          message: userMsg,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const reply: string = data.reply || 'Something went wrong.';
      const match = reply.match(/```suggestions\n([\s\S]*?)\n```/);
      if (match) {
        try { setParsedSuggestions(JSON.parse(match[1])); } catch {}
      }
      const cleanReply = reply.replace(/```suggestions[\s\S]*?```/g, '').trim();
      setMsgs(prev => [...prev, { role: 'assistant', content: cleanReply }]);
    } catch (e: any) {
      setMsgs(prev => [...prev, { role: 'assistant', content: `⚠ ${e.message || 'Error reaching AI.'}` }]);
    }
    setLoading(false);
  };

  const color = regionColors[region];

  return (
    <div className="ai-panel">
      <div className="ai-panel-header" style={{ borderBottom: `2px solid ${color}30` }}>
        <div>
          <span className="ai-panel-title" style={{ color }}>✦ Live Planner</span>
          <span className="ai-panel-day">Day {activeDay} · {region.charAt(0).toUpperCase() + region.slice(1)}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="ai-close-btn" onClick={toggleAIPlanner}>✕</button>
        </div>
      </div>

      

      <div className="ai-context">
        <div className="ai-context-label">Today's plan</div>
        {dayActs.slice(0, 6).map((a, i) => (
          <div key={i} className="ai-context-item">
            <span className="ai-ctx-time">{a.time}</span>
            <span className="ai-ctx-title">{a.title}</span>
          </div>
        ))}
        {aiAdded.length > 0 && <>
          <div className="ai-context-label" style={{ marginTop: '8px', color }}>Added by AI</div>
          {aiAdded.map((a, i) => (
            <div key={i} className="ai-context-item ai-context-item--added">
              <span className="ai-ctx-time">{a.time}</span>
              <span className="ai-ctx-title">{a.title}</span>
              <button className="ai-ctx-remove" onClick={() => removeAiSuggestion(activeDay, i)}>✕</button>
            </div>
          ))}
        </>}
      </div>

      <div className="ai-messages" ref={scrollRef}>
        {msgs.length === 0 && (
          <div className="ai-empty">
            <div className="ai-empty-icon">✦</div>
            <p>Tell me what you feel like doing, where you are, or what you want to change about today.</p>
            <div className="ai-chips">
              {["We're enjoying Shibuya — what else is nearby?", "Find us a great ramen spot right now", "We're tired, suggest a quiet afternoon", "What's walkable from here in the next 2 hrs?"].map(q => (
                <button key={q} className="ai-chip" onClick={() => { setInput(q); }}>{q}</button>
              ))}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={`ai-msg ai-msg--${m.role}`}>
            {m.role === 'assistant' && <span className="ai-msg-avatar" style={{ color }}>✦</span>}
            <p className="ai-msg-text">{m.content}</p>
          </div>
        ))}
        {loading && (
          <div className="ai-msg ai-msg--assistant">
            <span className="ai-msg-avatar" style={{ color }}>✦</span>
            <p className="ai-msg-text ai-thinking">thinking<span>.</span><span>.</span><span>.</span></p>
          </div>
        )}
        {parsedSuggestions.length > 0 && (
          <div className="ai-suggestions">
            <div className="ai-suggestions-label">Suggested additions</div>
            {parsedSuggestions.map((s, i) => (
              <div key={i} className="ai-suggestion-card" style={{ borderColor: `${color}50` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  <div>
                    <div className="ai-sug-time" style={{ color }}>{s.time}</div>
                    <div className="ai-sug-title">{s.title}</div>
                    <div className="ai-sug-desc">{s.desc}</div>
                  </div>
                  <button className="ai-add-btn" style={{ background: color, borderColor: color }}
                    onClick={() => {
                      addAiSuggestion(activeDay, { lat: s.lat, lng: s.lng, title: s.title, time: s.time, type: s.type as any, desc: s.desc });
                      setParsedSuggestions(prev => prev.filter((_, j) => j !== i));
                    }}>
                    + Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="ai-input-row">
        <input className="ai-input" placeholder="What would you like to do?"
          value={input} disabled={loading}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') send(); }} />
        <button className="ai-send-btn" onClick={send} disabled={loading || !input.trim()}
          style={{ background: color, opacity: (loading || !input.trim()) ? 0.4 : 1 }}>
          {loading ? '…' : '✦'}
        </button>
      </div>
    </div>
  );
};

// --- MAIN RUNNER LAYOUT ---

// ── Smooth value animator ─────────────────────────────────────────────────────
const _animVal = (from: number, to: number, ms: number, cb: (v: number) => void, done?: () => void) => {
  const t0 = performance.now();
  const step = (now: number) => {
    const t = Math.min((now - t0) / ms, 1);
    const e = t < 0.5 ? 2*t*t : -1+(4-2*t)*t;
    cb(from + (to - from) * e);
    if (t < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
};

// ── Particle types ────────────────────────────────────────────────────────────
interface _P { x:number; y:number; vx:number; vy:number; sz:number; op:number; maxOp:number; rot:number; vrot:number; life:number; maxLife:number; phase:number; color:string; }

const _sakura = (W:number, H:number, tint:'warm'|'cool'='warm'): _P => {
  const warm = ['#ffb7c5','#ffc0cb','#ffd0dc','#ffaabb','#ff9eb5'];
  const cool = ['#c8d8e8','#d8c8e0','#e0d4e8','#c0d0e0','#d0c8dc'];
  const cols = tint === 'cool' ? cool : warm;
  return { x: Math.random()*W, y: -20-Math.random()*H*0.4, vx: (Math.random()-.5)*.6, vy: .5+Math.random()*.7,
    sz: 4+Math.random()*5, op:0, maxOp:.22+Math.random()*.28, rot:Math.random()*Math.PI*2, vrot:(Math.random()-.5)*.035,
    life:0, maxLife:270+Math.random()*200, phase:Math.random()*Math.PI*2, color:cols[Math.floor(Math.random()*cols.length)] };
};
const _firefly = (W:number, H:number): _P => ({
  x:Math.random()*W, y:H+Math.random()*60, vx:(Math.random()-.5)*.7, vy:-(0.28+Math.random()*.55),
  sz:1.5+Math.random()*2.5, op:0, maxOp:.55+Math.random()*.35, rot:0, vrot:0,
  life:0, maxLife:260+Math.random()*280, phase:Math.random()*Math.PI*2,
  color:['#ff9500','#ffaa20','#ffb840','#ff7500','#ffc050'][Math.floor(Math.random()*5)],
});
const _mist = (W:number, H:number): _P => ({
  x:Math.random()*W, y:Math.random()*H, vx:(Math.random()-.5)*.1, vy:-.04-.06*Math.random(),
  sz:90+Math.random()*130, op:0, maxOp:.028+Math.random()*.025, rot:0, vrot:0,
  life:0, maxLife:500+Math.random()*400, phase:Math.random()*Math.PI*2, color:'#e8f2f8',
});
const _spawn = (region:string, W:number, H:number): _P => {
  if (region==='osaka') return _firefly(W,H);
  if (region==='hakone') return _mist(W,H);
  if (region==='kyoto') return _sakura(W,H,'cool');
  return _sakura(W,H,'warm');
};
const _regionCount: Record<string,number> = { tokyo:18, kyoto:16, hakone:7, osaka:22 };

const ParticleCanvas: React.FC = () => {
  const { activeDay, rainMode } = useStore();
  const region = regionMap[activeDay] || 'tokyo';
  const cvRef = React.useRef<HTMLCanvasElement>(null);
  const ptRef = React.useRef<_P[]>([]);
  const rafRef = React.useRef(0);
  const rRef = React.useRef('');
  const rainRef = React.useRef(rainMode);

  React.useEffect(() => {
    rainRef.current = rainMode;
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);

    const n = rainMode ? 50 : (_regionCount[region] || 0);
    ptRef.current = Array.from({length:n}, () => {
      if (rainMode) {
        return {
          x: Math.random() * cv.width,
          y: Math.random() * cv.height,
          vx: -0.8,
          vy: 8 + Math.random() * 7,
          sz: 16 + Math.random() * 12,
          op: 0.2 + Math.random() * 0.25,
          maxOp: 0.45,
          rot: 0.08,
          vrot: 0,
          life: Math.floor(Math.random() * 80),
          maxLife: 80,
          phase: 0,
          color: '#6a90c0'
        };
      }
      const p = _spawn(region, cv.width, cv.height);
      p.life = Math.floor(Math.random() * p.maxLife);
      return p;
    });

    const tick = () => {
      const W = cv.width, H = cv.height;
      ctx.clearRect(0,0,W,H);
      ptRef.current.forEach((p,i) => {
        p.life++;
        if (rainRef.current) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.life >= p.maxLife || p.y > H + 40 || p.x < -20) {
            p.x = Math.random() * (W + 100);
            p.y = -20;
            p.life = 0;
          }
          ctx.save();
          ctx.strokeStyle = p.color;
          ctx.lineWidth = 1.3;
          ctx.globalAlpha = p.op;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2.5, p.y + p.sz);
          ctx.stroke();
          ctx.restore();
          return;
        }

        const lr = p.life / p.maxLife;
        p.op = lr < .12 ? (lr/.12)*p.maxOp : lr > .82 ? ((1-lr)/.18)*p.maxOp : p.maxOp;
        if (region==='osaka') {
          p.x += p.vx + Math.sin(p.life*.025+p.phase)*.35;
          p.y += p.vy;
          p.op *= .92 + Math.sin(p.life*.15+p.phase)*.08;
        } else if (region==='hakone') {
          p.x += p.vx; p.y += p.vy;
        } else {
          p.x += p.vx + Math.sin(p.life*.018+p.phase)*.45;
          p.y += p.vy; p.rot += p.vrot;
        }
        if (p.life>=p.maxLife || p.y>H+80 || p.y<-p.sz*2)
          ptRef.current[i] = _spawn(region,W,H);

        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, p.op));
        if (region==='tokyo'||region==='kyoto') {
          ctx.translate(p.x,p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.color;
          ctx.beginPath();
          const s=p.sz;
          ctx.moveTo(0,-s); ctx.bezierCurveTo(s*.9,-s*.5,s*.9,s*.5,0,s);
          ctx.bezierCurveTo(-s*.9,s*.5,-s*.9,-s*.5,0,-s); ctx.fill();
        } else if (region==='osaka') {
          ctx.shadowColor=p.color; ctx.shadowBlur=p.sz*5;
          ctx.fillStyle=p.color; ctx.beginPath();
          ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
        } else if (region==='hakone') {
          const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,p.sz);
          g.addColorStop(0,'rgba(220,235,248,0.85)'); g.addColorStop(1,'rgba(220,235,248,0)');
          ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,p.sz,0,Math.PI*2); ctx.fill();
        }
        ctx.restore();
      });
      rafRef.current = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      if (document.hidden) cancelAnimationFrame(rafRef.current);
      else tick();
    };
    document.addEventListener('visibilitychange', onVisibility);

    tick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [region, rainMode]);

  return <canvas ref={cvRef} style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:8,opacity:.9}} />;
};


const App: React.FC = () => {
  const { editMode, docsPageOpen, hotelsOpen, flightOpen, restaurantsOpen, activitiesOpen, bookingOpen, currencyOpen, takkyubinOpen, activeDay, setActiveDay, storyDay, aiPlannerOpen } = useStore();
  const touchStartRef = React.useRef(0);
  const [mobileTab, setMobileTab] = React.useState<'journal'|'map'>('journal');
  return (
    <APIProvider apiKey={(import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || ''}>
      <div className={`app-container mobile-view-${mobileTab}${storyDay !== null ? ' story-mode' : ''}`}>
        <AmbientLayer />
        <ParticleCanvas />
        <Header />
        <DayNav />
        {/* region groups now shown in DayNav */}
        {docsPageOpen && <DocsPage />}
        {hotelsOpen && <HotelsPanel />}
        {flightOpen && <FlightPanel />}
        {restaurantsOpen && <RestaurantsPanel />}
        {activitiesOpen && <ActivitiesPanel />}
        {bookingOpen && <BookingPanel />}
        {currencyOpen && <CurrencyBurnModal />}
        {takkyubinOpen && <TakkyubinModal />}
        <main className="main-content" style={{ display: docsPageOpen ? 'none' : undefined }}>
          <section className="journal-pane-wrapper" id="journal-pane"
            style={{ borderRight: '1px solid var(--paper-fold)', boxShadow: editMode ? 'inset 0 0 0 2px var(--amber)' : 'none' }}
            onTouchStart={e => { touchStartRef.current = e.touches[0].clientX; }}
            onTouchEnd={e => {
              const diff = touchStartRef.current - e.changedTouches[0].clientX;
              if (Math.abs(diff) > 55) {
                if (diff > 0 && activeDay < 19) setActiveDay(activeDay + 1);
                else if (diff < 0 && activeDay > 1) setActiveDay(activeDay - 1);
              }
            }}
          >
            <JournalPane />
          </section>
          <section className="map-pane-wrapper" id="map-pane">
            <MapPane />
          </section>
        </main>
        <EditModeToggle />
        <PhrasebookDrawer />
        <StoryOverlay />
        {aiPlannerOpen && <AIPlanner />}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tab-bar">
        <button className={`mobile-tab-btn${mobileTab==='journal'?' active':''}`} onClick={()=>setMobileTab('journal')}>
          <span>📔</span><span className="mobile-tab-label">Journal</span>
        </button>
        <button className={`mobile-tab-btn${mobileTab==='map'?' active':''}`} onClick={()=>setMobileTab('map')}>
          <span>🗺</span><span className="mobile-tab-label">Map</span>
        </button>
      </nav>
    </APIProvider>
  );
};

export { App as TripAppInner };
export default App;
