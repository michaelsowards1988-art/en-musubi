'use client';

import { useState, useEffect } from 'react';
import { Map, Overlay } from 'pigeon-maps';
import { Plus, Minus, RotateCcw } from 'lucide-react';

interface Destination {
  id: string;
  title: string;
  creator: string;
  interested_users: string[];
  lat?: number;
  lng?: number;
}

interface WorldMapProps {
  destinations: Destination[];
  lang: 'en' | 'ja';
}

// The perfect balance point to show both Texas and Japan on a narrow mobile screen
const DEFAULT_CENTER: [number, number] = [35, 15];
const DEFAULT_ZOOM = 0.8;

export default function WorldMap({ destinations, lang }: WorldMapProps) {
  const [mapReady, setMapReady] = useState(false);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);

  // Wait for the CollapsibleSection animation to finish before rendering the map
  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  const plottableDestinations = destinations.filter(d => d.lat !== null && d.lng !== null && d.lat !== undefined && d.lng !== undefined);

  if (plottableDestinations.length === 0) {
    return (
      <div className="w-full aspect-video md:aspect-[2/1] rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-600 mt-6">
        {lang === 'ja' ? 'マップデータがありません...' : 'Awaiting map data...'}
      </div>
    );
  }

  // CartoDB Dark Matter Base Map
  const cartoDarkProvider = (x: number, y: number, z: number, dpr?: number) => {
    const API_KEY = "cb1_4fln_1_7548ae19f825da91e7ff5f12";
    return `https://basemaps.cartocdn.com/rastertiles/dark_nolabels/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png?key=${API_KEY}`;
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 1, 12));
  const handleZoomOut = () => setZoom(Math.max(zoom - 1, 0.5));
  
  const handleReset = () => {
    setCenter(DEFAULT_CENTER);
    setZoom(DEFAULT_ZOOM);
  };

  return (
    <div className="mt-6 flex flex-col gap-3">
      
      {/* 100% Clean Map Container */}
      <div className="w-full aspect-video md:aspect-[2/1] rounded-xl bg-zinc-950 border border-zinc-800 relative overflow-hidden shadow-inner group">
        
        {/* Static High-Tech Radar/Coordinate Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-size-[5%_10%] opacity-30 pointer-events-none z-0"></div>
        
        {/* Map Wrapper with Fade-In */}
        <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out [&>div]:!bg-zinc-950 [&_.pigeon-attribution]:hidden ${mapReady ? 'opacity-100' : 'opacity-0'}`}>
          {mapReady && (
            <Map 
              provider={cartoDarkProvider} 
              center={center}
              zoom={zoom}
              onBoundsChanged={({ center, zoom }) => {
                setCenter(center);
                setZoom(zoom);
              }}
              minZoom={0.5} // Lowered minimum zoom to allow wide views on mobile
              maxZoom={12}
              mouseEvents={true}
              touchEvents={true}
              attribution={false}
            >
              {plottableDestinations.map(dest => {
                const isShared = dest.interested_users.length > 1;
                const isMichaelOnly = dest.interested_users.includes('Michael') && !isShared;
                const isTamaeOnly = dest.interested_users.includes('Tamae') && !isShared;

                // Red String Theme Styling
                let pinColor = 'bg-zinc-500';
                let glowColor = 'shadow-zinc-500/50';
                
                if (isShared) {
                  pinColor = 'bg-red-500';
                  glowColor = 'shadow-[0_0_12px_rgba(239,68,68,0.8)]';
                } else if (isMichaelOnly) {
                  pinColor = 'bg-blue-400';
                  glowColor = 'shadow-[0_0_12px_rgba(96,165,250,0.8)]';
                } else if (isTamaeOnly) {
                  pinColor = 'bg-rose-400';
                  glowColor = 'shadow-[0_0_12px_rgba(251,113,133,0.8)]';
                }

                return (
                  <Overlay 
                    key={dest.id} 
                    anchor={[dest.lat!, dest.lng!]} 
                    offset={[6, 6]}
                  >
                    <div className="relative group/pin">
                      <div className={`w-3 h-3 rounded-full ${pinColor} ${glowColor} transition-transform group-hover/pin:scale-150 cursor-pointer`}></div>
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/pin:opacity-100 transition-opacity bg-zinc-900 border border-zinc-700 text-stone-200 text-[10px] font-mono px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-50">
                        {dest.title}
                      </div>
                    </div>
                  </Overlay>
                );
              })}
            </Map>
          )}
        </div>
      </div>

      {/* External Control Bar (Legend + Zoom) */}
      <div className={`flex items-start md:items-center justify-between px-1 transition-opacity duration-1000 gap-2 ${mapReady ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Horizontal Legend */}
        <div className="flex items-center gap-3 md:gap-4 flex-wrap mt-1 md:mt-0">
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></div>
            Tamae
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
            Michael
          </div>
          <div className="flex items-center gap-1.5 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
            {lang === 'ja' ? '共有の夢' : 'Shared'}
          </div>
        </div>

        {/* Zoom Controls & Reset Button */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleReset}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-mono text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors active:bg-zinc-700 uppercase tracking-widest border border-transparent hover:border-zinc-800"
          >
            <RotateCcw className="w-3 h-3" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg shadow-sm overflow-hidden">
            <button 
              onClick={handleZoomOut}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors active:bg-zinc-700"
              aria-label="Zoom out"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3.5 bg-zinc-800"></div>
            <button 
              onClick={handleZoomIn}
              className="px-2.5 py-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors active:bg-zinc-700"
              aria-label="Zoom in"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        
      </div>
    </div>
  );
}