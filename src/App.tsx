'use client';
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Utensils, 
  Camera, 
  Search, 
  X, 
  ChevronRight, 
  Clock,
  Wine,
  Star,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

// --- Types ---

interface Event {
  id: string;
  time: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface Guest {
  name: string;
  kana?: string;
}

interface Table {
  id: number;
  label: string;
  x: number;
  y: number;
  guests: Guest[];
}

interface MenuItem {
  category: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

// --- Utilities ---

const normalizeText = (text: string) => {
  return text
    .replace(/[\u30a1-\u30f6]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x60)) // Katakana to Hiragana
    .replace(/[\s\u3000]/g, '') // Remove all spaces
    .toLowerCase();
};

const toMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// --- Static Data ---

const SCHEDULE: Event[] = [
  { id: '1', time: '14:20', title: 'Reception', description: '受付開始', icon: <Calendar className="w-4 h-4" /> },
  { id: '2', time: '15:00', title: 'Ceremony', description: '挙式', icon: <Star className="w-4 h-4" /> },
  { id: '3', time: '15:45', title: 'Welcome Party', description: 'ウェルカムパーティー', icon: <Wine className="w-4 h-4" /> },
  { id: '4', time: '16:15', title: 'Grand Entrance', description: '披露宴開宴・新郎新婦入場', icon: <Star className="w-4 h-4" /> },
  { id: '5', time: '16:30', title: 'Toast & Meal', description: '乾杯・祝宴開始', icon: <Utensils className="w-4 h-4" /> },
  { id: '6', time: '17:15', title: 'Cake Cutting', description: 'ケーキ入刀', icon: <Star className="w-4 h-4" /> },
  { id: '7', time: '17:50', title: 'Grand Finale', description: 'お披楽喜', icon: <Clock className="w-4 h-4" /> },
];

const MENU: MenuItem[] = [
  { 
    category: 'Amuse-bouche', 
    title: '海鮮のジュレ 雲丹のムースを添えて', 
    description: 'Fresh seafood jelly with sea urchin mousse.',
    icon: <Star className="w-5 h-5" />
  },
  { 
    category: 'Premier', 
    title: 'フォアグラのポワレ 季節のフルーツと共に', 
    description: 'Pan-seared foie gras with seasonal fruit reduction.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Poisson', 
    title: '真鯛のヴァプール ベルモットソース', 
    description: 'Steamed red snapper with vermouth sauce.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Viande', 
    title: '特選牛フィレ肉のグリル トリュフ香るソース', 
    description: 'Grilled premium beef tenderloin with truffle sauce.',
    icon: <Utensils className="w-5 h-5" />
  },
  { 
    category: 'Dessert', 
    title: 'ショコラとベリーのシンフォニー', 
    description: 'Chocolate and berry symphony.',
    icon: <Star className="w-5 h-5" />
  },
];

// --- Seating Data Management ---

const TABLE_LAYOUT = [
  { id: 1, label: 'A', x: 70, y: 100 },
  { id: 2, label: 'B', x: 155, y: 100 },
  { id: 3, label: 'C', x: 245, y: 100 },
  { id: 4, label: 'D', x: 330, y: 100 },
  { id: 5, label: 'E', x: 100, y: 200 },
  { id: 6, label: 'F', x: 200, y: 200 },
  { id: 7, label: 'G', x: 300, y: 200 },
  { id: 8, label: 'H', x: 100, y: 300 },
  { id: 9, label: 'I', x: 200, y: 300 },
  { id: 10, label: 'J', x: 300, y: 300 },
  { id: 11, label: 'K', x: 70, y: 400 },
  { id: 12, label: 'L', x: 155, y: 400 },
  { id: 13, label: 'M', x: 245, y: 400 },
  { id: 14, label: 'N', x: 330, y: 400 },
];

// Guest List (Edit this part for real data)
const GUEST_DATA: Record<number, Guest[]> = {
  1: [
    { name: 'Guest A1', kana: 'げすと' },
    { name: 'Guest A2', kana: 'げすと' },
    { name: 'Guest A3', kana: 'げすと' },
    { name: 'Guest A4', kana: 'げすと' },
    { name: 'Guest A5', kana: 'げすと' },
    { name: 'Guest A6', kana: 'げすと' },
  ],
  2: [
    { name: 'Guest B1', kana: 'げすと' },
    { name: 'Guest B2', kana: 'げすと' },
    { name: 'Guest B3', kana: 'げすと' },
    { name: 'Guest B4', kana: 'げすと' },
    { name: 'Guest B5', kana: 'げすと' },
    { name: 'Guest B6', kana: 'げすと' },
  ],
  // Add other tables 3, 4, 5... here
};

const TABLES: Table[] = TABLE_LAYOUT.map(layout => ({
  ...layout,
  guests: GUEST_DATA[layout.id] || [
    { name: `Guest ${layout.id}1`, kana: 'げすと' },
    { name: `Guest ${layout.id}2`, kana: 'げすと' },
    { name: `Guest ${layout.id}3`, kana: 'げすと' },
    { name: `Guest ${layout.id}4`, kana: 'げすと' },
    { name: `Guest ${layout.id}5`, kana: 'げすと' },
    { name: `Guest ${layout.id}6`, kana: 'げすと' },
  ]
}));

// --- Components ---

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="mb-12 text-center">
    <motion.span 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-[10px] uppercase tracking-[0.3em] text-gold font-medium mb-2 block"
    >
      {subtitle}
    </motion.span>
    <motion.h2 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: 0.1, duration: 0.5, ease: "easeOut" }}
      className="text-2xl sm:text-4xl font-serif text-off-white"
    >
      {title}
    </motion.h2>
    <motion.div 
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ delay: 0.2, duration: 0.6, ease: "easeOut" }}
      className="h-px w-12 bg-gold/50 mx-auto mt-6"
    />
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState<'schedule' | 'map' | 'menu' | 'photos'>('schedule');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [zoom, setZoom] = useState(1);
  const [showWelcome, setShowWelcome] = useState(false);
  
  const scheduleRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Check if welcome has been seen
  useEffect(() => {
    const seen = localStorage.getItem('wedding_welcome_seen');
    if (!seen) {
      setShowWelcome(true);
    }
  }, []);

  const handleCloseWelcome = () => {
    localStorage.setItem('wedding_welcome_seen', 'true');
    setShowWelcome(false);
  };

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Determine active event
  const activeEventId = useMemo(() => {
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    let active = SCHEDULE[0].id;
    for (const event of SCHEDULE) {
      if (currentMinutes >= toMinutes(event.time)) {
        active = event.id;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime]);

  // Scroll to active event on load
  useEffect(() => {
    if (activeTab === 'schedule') {
      const element = document.getElementById(`event-${activeEventId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeTab, activeEventId]);

  const filteredTables = useMemo(() => {
    if (!searchQuery) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return TABLES.filter(t => 
      t.guests.some(g => 
        normalizeText(g.name).includes(normalizedQuery) || 
        (g.kana && normalizeText(g.kana).includes(normalizedQuery))
      )
    );
  }, [searchQuery]);

  const highlightedTableIds = useMemo(() => new Set(filteredTables.map(t => t.id)), [filteredTables]);

  const matchedGuests = useMemo(() => {
    if (!searchQuery) return [];
    const normalizedQuery = normalizeText(searchQuery);
    return TABLES.flatMap(t =>
      t.guests
        .filter(g => 
          normalizeText(g.name).includes(normalizedQuery) ||
          (g.kana && normalizeText(g.kana).includes(normalizedQuery))
        )
        .map(g => ({ ...g, tableLabel: t.label, tableId: t.id }))
    );
  }, [searchQuery]);

  // Auto-select table if only one result
  useEffect(() => {
    if (filteredTables.length === 1) {
      setSelectedTable(filteredTables[0]);
    }
  }, [filteredTables]);

  return (
    <div className="min-h-screen pb-24 selection:bg-gold/30">
      {/* --- Welcome Modal --- */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6"
          >
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-night/90 backdrop-blur-md"
              onClick={handleCloseWelcome}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg glass rounded-[2rem] p-6 sm:p-10 md:p-16 text-center border-gold/20 shadow-2xl overflow-hidden"
            >
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
              
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Star className="w-8 h-8 text-gold mx-auto mb-8 opacity-50" />
                <span className="text-[10px] uppercase tracking-[0.5em] text-gold mb-6 block font-medium">
                  Welcome to our Wedding
                </span>
                
                <div className="space-y-6 mb-12">
                  <p className="text-off-white text-lg md:text-xl font-serif leading-relaxed tracking-wide">
                    本日はご多用の中 ご列席いただき<br/>
                    誠にありがとうございます
                  </p>
                  <p className="text-off-white/60 text-sm font-serif italic leading-relaxed">
                    皆様と過ごすこのひとときが<br/>
                    素晴らしい思い出となりますように
                  </p>
                  <p className="text-off-white/40 text-xs font-serif leading-relaxed">
                    心ばかりのおもてなしではございますが<br/>
                    どうぞごゆっくりお楽しみください
                  </p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <div className="h-px w-12 bg-gold/30 mb-4" />
                  <div className="text-gold font-serif tracking-[0.3em] text-base sm:text-xl md:text-2xl mb-10">
                    YASUTAKA & AMI
                  </div>
                </div>

                <button
                  onClick={handleCloseWelcome}
                  className="group relative inline-flex items-center justify-center px-16 sm:px-24 py-5 sm:py-7 rounded-full overflow-hidden transition-all duration-700 shadow-[0_0_30px_rgba(212,175,55,0.1)] hover:shadow-[0_0_50px_rgba(212,175,55,0.2)]"
                >
                  <div className="absolute inset-0 bg-gold opacity-10 group-hover:opacity-20 transition-opacity" />
                  <div className="absolute inset-0 border border-gold/30 rounded-full group-hover:border-gold/60 transition-colors" />
                  <span className="relative text-gold text-lg sm:text-xl md:text-2xl tracking-[0.6em] font-serif font-medium">ご入場</span>
                </button>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- Header --- */}
      <header className="pt-20 pb-12 px-6 text-center relative overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 -z-10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="text-[10px] uppercase tracking-[0.5em] text-gold mb-4 block font-medium">
            Wedding Celebration
          </span>
          <div className="flex flex-col items-center mb-6 gold-text-gradient uppercase tracking-[0.2em]">
            <span className="text-3xl sm:text-5xl md:text-7xl font-serif">YASUTAKA</span>
            <span className="text-xl sm:text-3xl md:text-5xl font-serif my-2">&</span>
            <span className="text-3xl sm:text-5xl md:text-7xl font-serif">AMI</span>
          </div>
          <p className="text-off-white/60 font-serif italic text-lg tracking-widest">
            2027.03.21
          </p>
        </motion.div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimatePresence mode="wait">
          {activeTab === 'schedule' && (
            <motion.section
              key="schedule"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <SectionTitle title="Schedule" subtitle="タイムライン" />
              <div className="relative space-y-8 md:space-y-12 before:absolute before:left-4 md:before:left-1/2 before:-translate-x-1/2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
                {SCHEDULE.map((event, index) => {
                  const isActive = event.id === activeEventId;
                  const isEven = index % 2 === 0;
                  
                  return (
                    <motion.div
                      key={event.id}
                      id={`event-${event.id}`}
                      initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className={`relative flex flex-col md:flex-row items-start md:items-center justify-center w-full transition-all duration-500 ${isActive ? 'scale-105' : 'opacity-40 grayscale'}`}
                    >
                      {/* Central Icon */}
                      <div className={`absolute left-4 md:left-1/2 -translate-x-1/2 top-0 md:top-1/2 md:-translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-500 ${isActive ? 'bg-gold gold-glow text-night' : 'bg-white/5 text-off-white/40 border border-white/10'}`}>
                        {event.icon}
                      </div>

                      {/* Connecting Line (Only on MD+) */}
                      <div className={`hidden md:block absolute top-1/2 -translate-y-1/2 h-px transition-all duration-500 ${isEven ? 'right-[calc(50%+16px)] w-12' : 'left-[calc(50%+16px)] w-12'} ${isActive ? 'bg-gold/50' : 'bg-white/10'}`} />

                      {/* Content Box */}
                      <div className={`w-full flex flex-col md:flex-row items-start md:items-center ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                        <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isEven ? 'md:pr-20 md:text-right' : 'md:pl-20 md:text-left'}`}>
                          <div className="relative z-20 inline-block w-full max-w-[220px] md:max-w-[360px]">
                            <span className={`font-mono text-base sm:text-lg tracking-tighter block mb-1 transition-all duration-500 ${isActive ? 'text-gold' : 'text-off-white/40'}`}>
                              {event.time}
                            </span>
                            <h3 className={`text-2xl sm:text-3xl md:text-4xl font-serif mb-2 leading-tight transition-all duration-500 ${isActive ? 'text-off-white' : 'text-off-white/60'}`}>
                              {event.title}
                            </h3>
                            <p className="text-base sm:text-lg text-off-white/40 tracking-wide leading-snug transition-all duration-500">
                              {event.description}
                            </p>
                          </div>
                        </div>
                        <div className="hidden md:block md:w-1/2" />
                      </div>

                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-4 md:left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-gold rounded-full gold-glow"
                          style={{ top: 'calc(100% + 8px)' }}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}

          {activeTab === 'map' && (
            <motion.section
              key="map"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <SectionTitle title="Seating" subtitle="席次表" />
              
              {/* Search Bar */}
              <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-off-white/30" />
                <input 
                  type="text"
                  placeholder="お名前で検索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:border-gold/50 transition-colors placeholder:text-off-white/20"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-off-white/30" />
                  </button>
                )}
              </div>

              {searchQuery && matchedGuests.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 space-y-2"
                >
                  {matchedGuests.map((g, i) => (
                    <button
                      key={`${g.name}-${i}`}
                      onClick={() => {
                        const table = TABLES.find(t => t.id === g.tableId);
                        if (table) setSelectedTable(table);
                      }}
                      className="w-full flex items-center justify-between p-3 glass rounded-xl text-sm hover:bg-white/10 transition-colors"
                    >
                      <div className="flex flex-col items-start">
                        <span className="text-[10px] text-gold/60 uppercase tracking-widest">{g.kana}</span>
                        <span className="text-off-white font-medium">{g.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-off-white/40">Table</span>
                        <span className="w-8 h-8 bg-gold/10 rounded-full flex items-center justify-center text-gold font-serif">
                          {g.tableLabel}
                        </span>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}

              {searchQuery && filteredTables.length === 0 && (
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center text-off-white/40 mb-8 text-sm"
                >
                  お名前が見つかりませんでした。スタッフへお声がけください。
                </motion.p>
              )}

              {/* Map Container */}
              <div ref={mapContainerRef} className="relative aspect-[4/5] glass rounded-3xl overflow-hidden touch-none">
                <motion.div
                  drag
                  dragConstraints={mapContainerRef}
                  animate={{ scale: zoom }}
                  className="w-full h-full cursor-grab active:cursor-grabbing"
                >
                  <svg viewBox="0 0 400 500" className="w-full h-full">
                    {/* Background Grid/Stars */}
                    <defs>
                      <radialGradient id="tableGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="rgba(212, 175, 55, 0.2)" />
                        <stop offset="100%" stopColor="transparent" />
                      </radialGradient>
                    </defs>

                    {/* Venue Layout Elements */}
                    {/* Main Table (Right Center) */}
                    <rect x="365" y="160" width="24" height="180" rx="12" fill="rgba(212, 175, 55, 0.15)" stroke="#D4AF37" strokeWidth="1" />
                    <text x="377" y="250" textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-gold font-serif tracking-[0.1em] [writing-mode:vertical-rl] [text-orientation:upright]">MAIN TABLE</text>

                    {/* Gates (Right Side Top & Bottom) */}
                    <rect x="390" y="40" width="10" height="60" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="395" y="70" textAnchor="middle" dominantBaseline="middle" className="text-[8px] fill-off-white/30 font-serif [writing-mode:vertical-rl] [text-orientation:upright]">GATE</text>
                    
                    <rect x="390" y="400" width="10" height="60" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    <text x="395" y="430" textAnchor="middle" dominantBaseline="middle" className="text-[8px] fill-off-white/30 font-serif [writing-mode:vertical-rl] [text-orientation:upright]">GATE</text>

                    {/* Bar Counter (Left Center) */}
                    <rect x="5" y="150" width="24" height="200" rx="4" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="2,2" />
                    <text x="17" y="250" textAnchor="middle" dominantBaseline="middle" className="text-[9px] fill-off-white/40 font-serif tracking-[0.1em] [writing-mode:vertical-rl] [text-orientation:upright]">BAR COUNTER</text>

                    {TABLES.map((table) => {
                      const isHighlighted = highlightedTableIds.has(table.id);
                      const isSelected = selectedTable?.id === table.id;
                      const normalizedQuery = searchQuery ? normalizeText(searchQuery) : '';
                      const isMatchedBySearch = normalizedQuery && table.guests.some(g => 
                        normalizeText(g.name).includes(normalizedQuery) || 
                        (g.kana && normalizeText(g.kana).includes(normalizedQuery))
                      );
                      
                      return (
                        <motion.g
                          key={table.id}
                          onClick={() => setSelectedTable(table)}
                          className="cursor-pointer"
                          whileHover={{ scale: 1.1 }}
                        >
                          {(isHighlighted || isMatchedBySearch) && (
                            <motion.circle
                              cx={table.x}
                              cy={table.y}
                              r={30}
                              fill="none"
                              stroke="#D4AF37"
                              strokeWidth="1"
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            />
                          )}
                          <circle
                            cx={table.x}
                            cy={table.y}
                            r={18}
                            className={`transition-all duration-500 ${isSelected ? 'fill-gold' : 'fill-white/5'} ${isMatchedBySearch ? 'stroke-gold stroke-2' : 'stroke-white/10'}`}
                          />
                          <text
                            x={table.x}
                            y={table.y}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            className={`text-[9px] font-serif pointer-events-none transition-colors duration-500 ${isSelected ? 'fill-night' : 'fill-off-white/80'}`}
                          >
                            {table.label}
                          </text>
                        </motion.g>
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Map Controls */}
                <div className="absolute bottom-4 right-4 flex flex-col gap-2">
                  <button 
                    onClick={() => setZoom(prev => prev >= 1.9 ? 1 : prev + 0.3)}
                    className="w-10 h-10 glass rounded-full flex items-center justify-center text-gold transition-transform active:scale-95"
                    aria-label="Zoom"
                  >
                    {zoom >= 1.9 ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Table Details Card */}
              <AnimatePresence>
                {selectedTable && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="fixed inset-x-6 bottom-32 z-[150] glass rounded-3xl p-6 shadow-2xl"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-night font-serif text-xl">
                          {selectedTable.label}
                        </div>
                        <h4 className="text-xl font-serif">Table {selectedTable.label}</h4>
                      </div>
                      <button onClick={() => setSelectedTable(null)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                        <X className="w-5 h-5 text-off-white/40" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedTable.guests.map((guest, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[10px] text-gold/60 uppercase tracking-widest">{guest.kana}</span>
                          <span className="text-off-white font-medium">{guest.name}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.section>
          )}

          {activeTab === 'menu' && (
            <motion.section
              key="menu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <SectionTitle title="Menu" subtitle="お料理" />

              {/* Drinks Section */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mb-24 p-8 glass rounded-3xl text-center"
              >
                <Wine className="w-6 h-6 text-gold mx-auto mb-4" />
                <h4 className="text-xl font-serif mb-4">Free Drink</h4>
                <p className="text-sm text-off-white/40 leading-relaxed">
                  ビール / ワイン (赤・白) / ウィスキー / 日本酒 / 焼酎 / カクテル各種 / ソフトドリンク各種
                </p>
              </motion.div>

              <div className="space-y-16">
                {MENU.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{ delay: (i % 3) * 0.1, duration: 0.5, ease: "easeOut" }}
                    className="text-center group"
                  >
                    <div className="flex justify-center mb-6">
                      <div className="w-12 h-12 rounded-full border border-gold/20 flex items-center justify-center text-gold group-hover:scale-110 transition-transform duration-500">
                        {item.icon}
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.4em] text-gold/60 mb-3 block">
                      {item.category}
                    </span>
                    <h3 className="text-xl sm:text-2xl font-serif mb-4 text-off-white tracking-wide">
                      {item.title}
                    </h3>
                    <p className="text-sm text-off-white/30 italic font-serif max-w-xs mx-auto leading-relaxed">
                      {item.description}
                    </p>
                    {i < MENU.length - 1 && (
                      <div className="w-px h-12 bg-gradient-to-b from-gold/20 to-transparent mx-auto mt-16" />
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}
          {activeTab === 'photos' && (
            <motion.section
              key="photos"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="py-8"
            >
              <SectionTitle title="Photo Hub" subtitle="写真共有" />
              
              <div className="space-y-8">
                <p className="text-center text-off-white/60 font-serif italic leading-relaxed">
                  本日の大切な思い出を、ぜひ皆様でシェアしてください。<br/>
                  下のボタンから共有アルバムへ移動できます。
                </p>

                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8"
                >
                  <a 
                    href="https://photos.app.goo.gl/4C1K3chYcjSvjkFi7" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="group relative block w-full p-px rounded-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gold via-gold-light to-gold animate-gradient-x" />
                    <div className="relative bg-night rounded-[15px] py-8 px-8 flex flex-col items-center justify-center group-hover:bg-night/80 transition-colors text-center">
                      <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-6">
                        <Camera className="w-8 h-8" />
                      </div>
                      <span className="text-xs text-gold uppercase tracking-[0.3em] block mb-2">Google Photos</span>
                      <span className="text-2xl font-serif text-off-white mb-4">思い出をシェアする</span>
                      <div className="flex items-center gap-2 text-gold/60 text-sm group-hover:text-gold transition-colors">
                        <span>Happiness to share</span>
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </a>
                </motion.div>

                <div className="glass rounded-3xl p-8 text-center">
                  <Star className="w-5 h-5 text-gold mx-auto mb-4" />
                  <h4 className="text-lg font-serif mb-2 text-off-white">How to Share</h4>
                  <p className="text-sm text-off-white/40 leading-relaxed">
                    1. 上のボタンをタップしてアルバムを開く<br/>
                    2. 「共有」または「＋」ボタンから写真を追加<br/>
                    3. 皆様で素敵な思い出を楽しみましょう
                  </p>
                </div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* --- Bottom Navigation --- */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-md z-[100]">
        <div className="glass rounded-full p-2 flex items-center justify-between shadow-2xl border-white/20">
          <NavButton 
            active={activeTab === 'schedule'} 
            onClick={() => setActiveTab('schedule')}
            icon={<Calendar className="w-5 h-5" />}
            label="Schedule"
          />
          <NavButton 
            active={activeTab === 'map'} 
            onClick={() => setActiveTab('map')}
            icon={<MapPin className="w-5 h-5" />}
            label="Seat Map"
          />
          <NavButton 
            active={activeTab === 'menu'} 
            onClick={() => setActiveTab('menu')}
            icon={<Utensils className="w-5 h-5" />}
            label="Menu"
          />
          <NavButton 
            active={activeTab === 'photos'} 
            onClick={() => setActiveTab('photos')}
            icon={<Camera className="w-5 h-5" />}
            label="Photos"
          />
        </div>
      </nav>

      {/* --- Background Stars --- */}
      <div className="fixed inset-0 -z-20 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: Math.random() }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ 
              duration: 2 + Math.random() * 3, 
              repeat: Infinity,
              delay: Math.random() * 5
            }}
            className="absolute w-px h-px bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function NavButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex-1 flex flex-col items-center justify-center py-2 rounded-full transition-all duration-500 ${active ? 'text-gold' : 'text-off-white/40 hover:text-off-white/60'}`}
    >
      {active && (
        <motion.div
          layoutId="nav-bg"
          className="absolute inset-0 bg-white/5 rounded-full"
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
      )}
      <div className="relative z-10 mb-1">
        {icon}
      </div>
      <span className="relative z-10 text-[9px] uppercase tracking-widest font-medium">
        {label}
      </span>
    </button>
  );
}
