'use client';

import { useState, useEffect } from 'react';
import { Map, Overlay } from 'pigeon-maps';

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

export default function WorldMap({ destinations, lang }: WorldMapProps) {
  const [mapReady, setMapReady] = useState(false);

  // Wait for the CollapsibleSection animation to finish before rendering the map
  // This ensures Pigeon Maps measures the fully expanded container for perfect centering.
  useEffect(() => {
    const timer = setTimeout(() => setMapReady(true), 400);
    return () => clearTimeout(timer);
  }, []);

  // Filter out any older items that don't have coordinates
  const plottableDestinations = destinations.filter(d => d.lat !== null && d.lng !== null && d.lat !== undefined && d.lng !== undefined);

  if (plottableDestinations.length === 0) {
    return (
      <div className="w-full aspect-2/1 rounded-xl bg-zinc-950/50 border border-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-600 mt-6">
        {lang === 'ja' ? 'マップデータがありません...' : 'Awaiting map data...'}
      </div>
    );
  }

  // CartoDB Dark Matter Base Map (No Labels)
  const cartoDarkProvider = (x: number, y: number, z: number, dpr?: number) => {
    const API_KEY = "cb1_4fln_1_7548ae19f825da91e7ff5f12";
    return `https://basemaps.cartocdn.com/rastertiles/dark_nolabels/${z}/${x}/${y}${dpr && dpr >= 2 ? '@2x' : ''}.png?key=${API_KEY}`;
  };

  return (
    <div className="w-full aspect-2/1 rounded-xl bg-zinc-950 border border-zinc-800 relative overflow-hidden mt-6 shadow-inner group">
      
      {/* Static High-Tech Radar/Coordinate Grid (Visible immediately as a placeholder) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#27272a_1px,transparent_1px),linear-gradient(to_bottom,#27272a_1px,transparent_1px)] bg-size-[5%_10%] opacity-30 pointer-events-none z-0"></div>
      
      {/* Map Wrapper with Fade-In and CSS Overrides to hide branding & white flash */}
      <div className={`absolute inset-0 z-10 transition-opacity duration-1000 ease-in-out [&>div]:bg-zinc-950! [&_.pigeon-attribution]:hidden ${mapReady ? 'opacity-100' : 'opacity-0'}`}>
        {mapReady && (
          <Map 
            provider={cartoDarkProvider} 
            defaultCenter={[35, 0]} // Dead center of the standard world map (Prime Meridian)
            defaultZoom={1.5} 
            minZoom={1}
            maxZoom={12}
            mouseEvents={true}
            touchEvents={true}
            attribution={false}
          >
            {plottableDestinations.map(dest => {
              const isShared = dest.interested_users.length > 1;
              const isMichaelOnly = dest.interested_users.includes('Michael') && !isShared;
              const isTamaeOnly = dest.interested_users.includes('Tamae') && !isShared;

              // Dynamic Styling based on who wants to go
              let pinColor = 'bg-zinc-500';
              let glowColor = 'shadow-zinc-500/50';
              
              if (isShared) {
                pinColor = 'bg-amber-400';
                glowColor = 'shadow-[0_0_12px_rgba(251,191,36,0.8)]';
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
                  offset={[6, 6]} // Offsets exactly half the 12px width/height of the dot to center it
                >
                  <div className="relative group/pin">
                    {/* The Map Marker */}
                    <div className={`w-3 h-3 rounded-full ${pinColor} ${glowColor} transition-transform group-hover/pin:scale-150 cursor-pointer`}></div>
                    
                    {/* Floating Tooltip */}
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
      
      {/* Map Legend (Floats above everything) */}
      <div className={`absolute bottom-3 left-3 flex flex-col gap-1.5 bg-zinc-950/80 backdrop-blur-md p-2 rounded-lg border border-zinc-800/80 pointer-events-none z-20 transition-opacity duration-1000 ${mapReady ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center gap-2 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.8)]"></div>
          Tamae
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]"></div>
          Michael
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono text-stone-400 uppercase tracking-wider">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></div>
          {lang === 'ja' ? '共有の夢' : 'Shared Dream'}
        </div>
      </div>
    </div>
  );
}