"use client";

import * as React from "react";
import { MapContainer, GeoJSON } from "react-leaflet";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import type { Layer, PathOptions } from "leaflet";
import "leaflet/dist/leaflet.css";

interface DistrictMapProps {
  records: { town: string; district: string }[];
}

interface PlanningAreaProperties {
  name: string;
  region: string;
}

// Color scale for choropleth (light to dark blue)
const COLOR_SCALE = [
  "#f7fbff",
  "#deebf7",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#4292c6",
  "#2171b5",
  "#08519c",
  "#08306b",
];

const NO_DATA_COLOR = "#1e293b"; // slate-800 for dark theme

// Mapping from database town names to GeoJSON planning area names
const TOWN_TO_PLANNING_AREA: Record<string, string[]> = {
  "ANG MO KIO": ["ANG MO KIO"],
  "BEDOK": ["BEDOK"],
  "BISHAN": ["BISHAN"],
  "BUKIT BATOK": ["BUKIT BATOK"],
  "BUKIT MERAH": ["BUKIT MERAH"],
  "BUKIT PANJANG": ["BUKIT PANJANG"],
  "BUKIT TIMAH": ["BUKIT TIMAH"],
  "CENTRAL AREA": ["DOWNTOWN CORE", "MARINA EAST", "MARINA SOUTH", "MUSEUM", "NEWTON", "ORCHARD", "OUTRAM", "RIVER VALLEY", "ROCHOR", "SINGAPORE RIVER", "STRAITS VIEW"],
  "CHOA CHU KANG": ["CHOA CHU KANG"],
  "CLEMENTI": ["CLEMENTI"],
  "GEYLANG": ["GEYLANG"],
  "HOUGANG": ["HOUGANG"],
  "JURONG EAST": ["JURONG EAST"],
  "JURONG WEST": ["JURONG WEST"],
  "KALLANG/WHAMPOA": ["KALLANG"],
  "MARINE PARADE": ["MARINE PARADE"],
  "PASIR RIS": ["PASIR RIS"],
  "PUNGGOL": ["PUNGGOL"],
  "QUEENSTOWN": ["QUEENSTOWN"],
  "QUEESTOWN": ["QUEENSTOWN"], // typo in data
  "SEMBAWANG": ["SEMBAWANG"],
  "SENGKANG": ["SENGKANG"],
  "SERANGOON": ["SERANGOON"],
  "TAMPINES": ["TAMPINES"],
  "TENGAH": ["TENGAH"],
  "TOA PAYOH": ["TOA PAYOH"],
  "WOODLANDS": ["WOODLANDS"],
  "YISHUN": ["YISHUN"],
};

// Mapping from postal districts (01-28) to planning areas
// Based on Singapore postal district definitions
const DISTRICT_TO_PLANNING_AREA: Record<string, string[]> = {
  "01": ["DOWNTOWN CORE", "MARINA SOUTH", "STRAITS VIEW"], // Raffles Place, Cecil, Marina, People's Park
  "02": ["OUTRAM", "DOWNTOWN CORE"], // Anson, Tanjong Pagar
  "03": ["QUEENSTOWN", "BUKIT MERAH"], // Queenstown, Tiong Bahru
  "04": ["BUKIT MERAH"], // Telok Blangah, Harbourfront
  "05": ["CLEMENTI", "QUEENSTOWN"], // Pasir Panjang, Hong Leong Garden, Clementi New Town
  "06": ["DOWNTOWN CORE", "ROCHOR", "MUSEUM"], // High Street, Beach Road
  "07": ["ROCHOR", "KALLANG"], // Middle Road, Golden Mile
  "08": ["ROCHOR", "KALLANG"], // Little India
  "09": ["ORCHARD", "RIVER VALLEY"], // Orchard, Cairnhill, River Valley
  "10": ["BUKIT TIMAH", "TANGLIN"], // Ardmore, Bukit Timah, Holland Road, Tanglin
  "11": ["NOVENA", "BUKIT TIMAH"], // Watten Estate, Novena, Thomson
  "12": ["TOA PAYOH", "NOVENA", "KALLANG"], // Balestier, Toa Payoh, Serangoon
  "13": ["GEYLANG", "TOA PAYOH"], // Macpherson, Braddell
  "14": ["GEYLANG", "PAYA LEBAR"], // Geylang, Eunos
  "15": ["MARINE PARADE", "GEYLANG"], // Katong, Joo Chiat, Amber Road
  "16": ["BEDOK"], // Bedok, Upper East Coast, Eastwood, Kew Drive
  "17": ["CHANGI", "CHANGI BAY"], // Loyang, Changi
  "18": ["TAMPINES", "PASIR RIS"], // Tampines, Pasir Ris
  "19": ["SERANGOON", "HOUGANG", "PUNGGOL", "SENGKANG"], // Serangoon Garden, Hougang, Punggol
  "20": ["BISHAN", "ANG MO KIO"], // Bishan, Ang Mo Kio
  "21": ["BUKIT TIMAH", "CLEMENTI"], // Upper Bukit Timah, Clementi Park, Ulu Pandan
  "22": ["JURONG EAST", "JURONG WEST", "BOON LAY"], // Jurong
  "23": ["BUKIT BATOK", "BUKIT PANJANG", "CHOA CHU KANG"], // Hillview, Dairy Farm, Bukit Panjang, Choa Chu Kang
  "24": ["LIM CHU KANG", "TENGAH"], // Lim Chu Kang, Tengah
  "25": ["WOODLANDS", "SUNGEI KADUT"], // Kranji, Woodgrove
  "26": ["MANDAI"], // Upper Thomson, Springleaf
  "27": ["YISHUN", "SEMBAWANG"], // Yishun, Sembawang
  "28": ["SELETAR"], // Seletar
};

// Reverse mapping: planning area to display name
const PLANNING_AREA_DISPLAY: Record<string, string> = {
  "ANG MO KIO": "Ang Mo Kio",
  "BEDOK": "Bedok",
  "BISHAN": "Bishan",
  "BOON LAY": "Boon Lay",
  "BUKIT BATOK": "Bukit Batok",
  "BUKIT MERAH": "Bukit Merah",
  "BUKIT PANJANG": "Bukit Panjang",
  "BUKIT TIMAH": "Bukit Timah",
  "CENTRAL WATER CATCHMENT": "Central Water Catchment",
  "CHANGI": "Changi",
  "CHANGI BAY": "Changi Bay",
  "CHOA CHU KANG": "Choa Chu Kang",
  "CLEMENTI": "Clementi",
  "DOWNTOWN CORE": "Downtown Core",
  "GEYLANG": "Geylang",
  "HOUGANG": "Hougang",
  "JURONG EAST": "Jurong East",
  "JURONG WEST": "Jurong West",
  "KALLANG": "Kallang",
  "LIM CHU KANG": "Lim Chu Kang",
  "MANDAI": "Mandai",
  "MARINA EAST": "Marina East",
  "MARINA SOUTH": "Marina South",
  "MARINE PARADE": "Marine Parade",
  "MUSEUM": "Museum",
  "NEWTON": "Newton",
  "NORTH-EASTERN ISLANDS": "North-Eastern Islands",
  "NOVENA": "Novena",
  "ORCHARD": "Orchard",
  "OUTRAM": "Outram",
  "PASIR RIS": "Pasir Ris",
  "PAYA LEBAR": "Paya Lebar",
  "PIONEER": "Pioneer",
  "PUNGGOL": "Punggol",
  "QUEENSTOWN": "Queenstown",
  "RIVER VALLEY": "River Valley",
  "ROCHOR": "Rochor",
  "SELETAR": "Seletar",
  "SEMBAWANG": "Sembawang",
  "SENGKANG": "Sengkang",
  "SERANGOON": "Serangoon",
  "SIMPANG": "Simpang",
  "SINGAPORE RIVER": "Singapore River",
  "SOUTHERN ISLANDS": "Southern Islands",
  "STRAITS VIEW": "Straits View",
  "SUNGEI KADUT": "Sungei Kadut",
  "TAMPINES": "Tampines",
  "TANGLIN": "Tanglin",
  "TENGAH": "Tengah",
  "TOA PAYOH": "Toa Payoh",
  "TUAS": "Tuas",
  "WESTERN ISLANDS": "Western Islands",
  "WESTERN WATER CATCHMENT": "Western Water Catchment",
  "WOODLANDS": "Woodlands",
  "YISHUN": "Yishun",
};

function getColor(count: number, maxCount: number): string {
  if (count === 0) return NO_DATA_COLOR;
  
  // Normalize to 0-1 range using log scale for better distribution
  const normalizedValue = Math.log(count + 1) / Math.log(maxCount + 1);
  const index = Math.min(
    Math.floor(normalizedValue * (COLOR_SCALE.length - 1)),
    COLOR_SCALE.length - 1
  );
  
  return COLOR_SCALE[index];
}

function aggregateByPlanningArea(records: { town: string; district: string }[]): Map<string, number> {
  const counts = new Map<string, number>();
  
  records.forEach((record) => {
    const town = record.town?.trim().toUpperCase();
    const district = record.district?.trim();
    
    let planningAreas: string[] | undefined;
    
    // First try to use town field (more accurate)
    if (town && TOWN_TO_PLANNING_AREA[town]) {
      planningAreas = TOWN_TO_PLANNING_AREA[town];
    }
    // Fall back to district field if town is not available
    else if (district && DISTRICT_TO_PLANNING_AREA[district]) {
      planningAreas = DISTRICT_TO_PLANNING_AREA[district];
    }
    
    if (planningAreas) {
      // Distribute count evenly across mapped planning areas
      const countPerArea = 1 / planningAreas.length;
      planningAreas.forEach((area) => {
        counts.set(area, (counts.get(area) || 0) + countPerArea);
      });
    }
  });
  
  // Round the counts
  counts.forEach((value, key) => {
    counts.set(key, Math.round(value));
  });
  
  return counts;
}

export function DistrictMap({ records }: DistrictMapProps) {
  const [geoData, setGeoData] = React.useState<FeatureCollection | null>(null);
  const [hoveredArea, setHoveredArea] = React.useState<{
    name: string;
    displayName: string;
    count: number;
  } | null>(null);
  
  const areaCounts = React.useMemo(() => aggregateByPlanningArea(records), [records]);
  const maxCount = React.useMemo(() => 
    Math.max(...Array.from(areaCounts.values()), 1), 
    [areaCounts]
  );

  // Load GeoJSON data
  React.useEffect(() => {
    fetch("/singapore-planning-areas.geojson")
      .then((res) => res.json())
      .then((data: FeatureCollection) => setGeoData(data))
      .catch((err) => console.error("Failed to load GeoJSON:", err));
  }, []);

  const getStyle = React.useCallback(
    (feature?: Feature<Geometry, PlanningAreaProperties>): PathOptions => {
      if (!feature?.properties) {
        return {
          fillColor: NO_DATA_COLOR,
          weight: 0.5,
          opacity: 1,
          color: "#334155",
          fillOpacity: 0.9,
        };
      }
      
      const areaName = feature.properties.name;
      const count = areaCounts.get(areaName) || 0;
      
      return {
        fillColor: getColor(count, maxCount),
        weight: 0.5,
        opacity: 1,
        color: "#475569",
        fillOpacity: 0.9,
      };
    },
    [areaCounts, maxCount]
  );

  const onEachFeature = React.useCallback(
    (feature: Feature<Geometry, PlanningAreaProperties>, layer: Layer) => {
      const areaName = feature.properties?.name || "Unknown";
      const displayName = PLANNING_AREA_DISPLAY[areaName] || areaName;
      const count = areaCounts.get(areaName) || 0;

      layer.on({
        mouseover: (e) => {
          const target = e.target;
          target.setStyle({
            weight: 2,
            color: "#60a5fa",
            fillOpacity: 1,
          });
          target.bringToFront();
          setHoveredArea({ name: areaName, displayName, count });
        },
        mouseout: (e) => {
          const target = e.target;
          target.setStyle(getStyle(feature));
          setHoveredArea(null);
        },
      });
    },
    [areaCounts, getStyle]
  );

  // Generate legend items
  const legendItems = React.useMemo(() => {
    if (maxCount <= 1) return [];
    
    const items: { color: string; label: string }[] = [];
    const step = maxCount / 5;
    
    for (let i = 0; i < 5; i++) {
      const value = Math.round(step * (i + 1));
      items.push({
        color: getColor(value, maxCount),
        label: i === 4 ? `${value}+` : `${Math.round(step * i) + 1}-${value}`,
      });
    }
    
    return items;
  }, [maxCount]);

  if (!geoData) {
    return (
      <div className="h-[450px] w-full flex items-center justify-center bg-slate-900 rounded-lg border border-border/50">
        <div className="text-muted-foreground animate-pulse">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="relative h-[450px] w-full rounded-lg border border-border/50 overflow-hidden bg-slate-900">
      <MapContainer
        center={[1.3521, 103.8198]}
        zoom={11}
        style={{ height: "100%", width: "100%", background: "#0f172a" }}
        zoomControl={true}
        scrollWheelZoom={false}
        dragging={true}
        attributionControl={false}
      >
        <GeoJSON
          key={JSON.stringify(areaCounts)}
          data={geoData}
          style={getStyle}
          onEachFeature={onEachFeature}
        />
      </MapContainer>

      {/* Tooltip */}
      {hoveredArea && (
        <div className="absolute top-3 left-3 bg-popover/95 backdrop-blur border border-border rounded-lg shadow-lg p-3 z-[1000] min-w-[180px]">
          <div className="font-medium text-sm text-foreground mb-1">
            {hoveredArea.displayName}
          </div>
          <div className="text-lg font-bold text-primary">
            {hoveredArea.count.toLocaleString()}{" "}
            <span className="text-xs font-normal text-muted-foreground">
              transactions
            </span>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 bg-popover/95 backdrop-blur border border-border rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-medium text-foreground mb-2">Transactions</div>
        <div className="space-y-1">
          {legendItems.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm border border-border/50"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1 border-t border-border/50 mt-1">
            <div
              className="w-4 h-3 rounded-sm border border-border/50"
              style={{ backgroundColor: NO_DATA_COLOR }}
            />
            <span className="text-xs text-muted-foreground">No data</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DistrictMap;
