// --- EARTH DATA ---
// Detailed spherical caps to approximate continents
export const LAND_CAPS = [
  // North America
  { lat: 40, lon: -100, r: 18 }, // USA Center
  { lat: 52, lon: -110, r: 15 }, // Canada West
  { lat: 52, lon: -90, r: 15 }, // Canada East
  { lat: 32, lon: -85, r: 8 }, // SE USA
  { lat: 35, lon: -115, r: 8 }, // SW USA
  { lat: 65, lon: -150, r: 10 }, // Alaska
  { lat: 60, lon: -80, r: 12 }, // Hudson Bay
  { lat: 20, lon: -102, r: 7 }, // Mexico
  { lat: 10, lon: -85, r: 4 }, // Central America
  { lat: 75, lon: -100, r: 10 }, // Canadian Arctic
  { lat: 75, lon: -40, r: 8 }, // Greenland

  // South America
  { lat: -10, lon: -55, r: 15 }, // Amazon
  { lat: -25, lon: -60, r: 12 }, // Central
  { lat: -45, lon: -70, r: 8 }, // Patagonia
  { lat: 5, lon: -75, r: 6 }, // Colombia/Venz
  { lat: -15, lon: -45, r: 6 }, // Brazil East bulge

  // Africa
  { lat: 15, lon: 10, r: 18 }, // Sahara
  { lat: -5, lon: 20, r: 15 }, // Central/Congo
  { lat: -25, lon: 22, r: 10 }, // South Africa
  { lat: 10, lon: -10, r: 8 }, // West Africa bulge
  { lat: 5, lon: 40, r: 6 }, // Horn of Africa
  { lat: 30, lon: 30, r: 6 }, // Egypt/Libya

  // Europe
  { lat: 48, lon: 10, r: 8 }, // Central Europe
  { lat: 40, lon: -4, r: 5 }, // Iberia
  { lat: 54, lon: -2, r: 4 }, // UK/Ireland
  { lat: 62, lon: 15, r: 6 }, // Scandinavia
  { lat: 55, lon: 35, r: 8 }, // Russia West
  { lat: 45, lon: 25, r: 5 }, // Balkans
  { lat: 40, lon: 15, r: 3 }, // Italy

  // Asia
  { lat: 55, lon: 90, r: 20 }, // Siberia
  { lat: 40, lon: 100, r: 15 }, // China/Mongolia
  { lat: 30, lon: 80, r: 8 }, // India
  { lat: 30, lon: 55, r: 8 }, // Middle East (Iran/Iraq)
  { lat: 20, lon: 45, r: 6 }, // Arabia
  { lat: 15, lon: 100, r: 6 }, // SE Asia (Thailand/Vietnam)
  { lat: 35, lon: 138, r: 4 }, // Japan
  { lat: -2, lon: 112, r: 6 }, // Indonesia
  { lat: 35, lon: 128, r: 3 }, // Korea

  // Australia / Oceania
  { lat: -25, lon: 135, r: 12 }, // Main
  { lat: -20, lon: 145, r: 5 }, // East
  { lat: -30, lon: 118, r: 5 }, // West
  { lat: -42, lon: 172, r: 3 }, // NZ South
  { lat: -38, lon: 176, r: 3 }, // NZ North
  { lat: -6, lon: 145, r: 4 }, // PNG

  // Antarctica
  { lat: -80, lon: 0, r: 12 },
  { lat: -80, lon: 90, r: 12 },
  { lat: -80, lon: -90, r: 12 },
  { lat: -80, lon: 180, r: 12 },
  
  // Pacific Islands (Exaggerated for visibility to fill the gap)
  { lat: 19.5, lon: -155.5, r: 8 }, // Hawaii (Big Island)
  { lat: 21.0, lon: -157.0, r: 6 }, // Hawaii (Maui/Oahu)
  { lat: -17, lon: -149, r: 7 }, // Tahiti
  { lat: -18, lon: 178, r: 7 }, // Fiji
  { lat: -9, lon: 160, r: 6 }, // Solomon Islands
  { lat: -0.5, lon: -91, r: 5 }, // Galapagos
  { lat: -27, lon: -109, r: 5 }, // Easter Island
  { lat: -21, lon: 165, r: 6 }, // New Caledonia
  { lat: 7, lon: 150, r: 6 }, // Micronesia
  { lat: 7, lon: 171, r: 6 }, // Marshall Islands
  { lat: 15, lon: 145, r: 6 }, // Mariana Islands
  { lat: -14, lon: -172, r: 6 }, // Samoa
  { lat: -44, lon: -176, r: 5 }, // Chatham Islands
  { lat: -20, lon: -160, r: 6 }, // Cook Islands
  { lat: 0, lon: 160, r: 6 }, // Nauru/Kiribati region
  { lat: -5, lon: -140, r: 5 }, // Marquesas
  { lat: 10, lon: -130, r: 12 }, // Large Pacific Patch 1 (Abstract)
  { lat: -10, lon: -110, r: 12 }, // Large Pacific Patch 2 (Abstract)
  { lat: -30, lon: -130, r: 10 }, // South Pacific Patch
  { lat: 25, lon: 170, r: 8 }, // North Pacific Patch

];

export const CITY_CAPS = [
  { lat: 40.7, lon: -74.0, r: 1.5, color: "#ffcc00" }, // NYC
  { lat: 34.0, lon: -118.2, r: 1.5, color: "#ffcc00" }, // LA
  { lat: 51.5, lon: -0.1, r: 1.5, color: "#ffcc00" }, // London
  { lat: 48.8, lon: 2.3, r: 1.5, color: "#ffcc00" }, // Paris
  { lat: 35.6, lon: 139.7, r: 1.5, color: "#ffcc00" }, // Tokyo
  { lat: 31.2, lon: 121.5, r: 1.5, color: "#ffcc00" }, // Shanghai
  { lat: 19.0, lon: 72.8, r: 1.5, color: "#ffcc00" }, // Mumbai
  { lat: -23.5, lon: -46.6, r: 1.5, color: "#ffcc00" }, // Sao Paulo
  { lat: 55.7, lon: 37.6, r: 1.5, color: "#ffcc00" }, // Moscow
  { lat: 30.0, lon: 31.2, r: 1.2, color: "#ffcc00" }, // Cairo
  { lat: 1.3, lon: 103.8, r: 1.0, color: "#ffcc00" }, // Singapore
  { lat: -33.8, lon: 151.2, r: 1.2, color: "#ffcc00" }, // Sydney
  { lat: 25.2, lon: 55.3, r: 1.2, color: "#ffcc00" }, // Dubai
  { lat: 22.3, lon: 114.2, r: 1.2, color: "#ffcc00" }, // Hong Kong
  { lat: 37.5, lon: 127.0, r: 1.2, color: "#ffcc00" }, // Seoul
  { lat: 21.3, lon: -157.8, r: 1.2, color: "#ffcc00" }, // Honolulu
];

export const CONTINENT_COLORS = {
  ocean: "#004466",
  land: "#0a5030", // Deep forest green
  landOutline: "#1a7045", // Lighter green for edges
  cloud: "#ffffff",
  ice: "#ffffff",
  city: "#ffd700",
};
