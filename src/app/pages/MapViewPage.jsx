import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { C } from "../../shared/constants/colors.js";
import { cities } from "../../shared/utils/geo.js";
import { FilterBar } from "../components/common/FilterBar.jsx";
import { getDistricts as getDistrictsCache, getDistrictByName, getVillages } from "../services/geoCache.js";
import { ensureLeafletLoaded } from "../../shared/utils/leafletLoader.js";
import { applyListingFilters } from "../../shared/utils/listingFilters.js";
import { fetchUserSavedSearches, createSavedSearch } from "../services/savedSearchService.js";
import { fetchPropertyFieldOptions } from "../services/propertyService.js";
import { getCurrentUserId } from "../services/authService.js";
import { getSupabase } from "../../shared/services/supabaseClient.js";
import { getListingMapPoint } from "../../shared/utils/mapLocation.js";
import MapListingCard from "../../shared/components/common/MapListingCard.jsx";
import {
  formatListingArea,
  formatListingLocation,
  formatListingPrice,
  formatListingRooms,
} from "../../shared/utils/listingFormatters.js";
import {
  ensureMapMarkerStyles,
  createMapItemIcon,
  createMapClusterIcon,
  createMapApproxStackIcon,
} from "../../shared/utils/mapMarkers.js";

const MAP_QUERY_LIMIT = 120;
const FETCH_DEBOUNCE_MS = 320;
const CLUSTER_MIN_SIZE = 3;
const APPROX_STACK_MIN = 2;
const MAP_ACTIVE_TYPE_KEY = "aqari_active_type";

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : fallback;
}

function filterValueToArray(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (value === 0) return ["0"];
  if (value === "" || value === null || value === undefined || value === "الكل") return [];
  return String(value).split(/[،,]/).map(x => x.trim()).filter(Boolean);
}

function hasActiveFilterValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== undefined && value !== null && value !== "" && value !== "الكل" && value !== "newest";
}

function filterLabelList(value) {
  if (Array.isArray(value)) return value.filter(Boolean).join(",");
  return value || "";
}

function escapePostgrestLikeValue(value) {
  return String(value).replace(/[%*_]/g, "").replace(/[(),]/g, "").trim();
}


function expandFacingSearchValues(value) {
  const raw = String(value || "").trim();
  const variants = {
    "شمالي": ["شمال", "شمالي"],
    "شمال": ["شمال", "شمالي"],
    "جنوبي": ["جنوب", "جنوبي", "قبلي"],
    "جنوب": ["جنوب", "جنوبي", "قبلي"],
    "قبلي": ["جنوب", "جنوبي", "قبلي"],
    "شرقي": ["شرق", "شرقي"],
    "شرق": ["شرق", "شرقي"],
    "غربي": ["غرب", "غربي"],
    "غرب": ["غرب", "غربي"],
    "شمال شرقي": ["شمال شرق", "شمال شرقي"],
    "شمال شرق": ["شمال شرق", "شمال شرقي"],
    "شمال غربي": ["شمال غرب", "شمال غربي"],
    "شمال غرب": ["شمال غرب", "شمال غربي"],
    "جنوب شرقي": ["جنوب شرق", "جنوب شرقي"],
    "جنوب شرق": ["جنوب شرق", "جنوب شرقي"],
    "جنوب غربي": ["جنوب غرب", "جنوب غربي"],
    "جنوب غرب": ["جنوب غرب", "جنوب غربي"]
  };

  return variants[raw] || [raw];
}

function buildFacingOrFilter(values) {
  const terms = [...new Set(
    filterValueToArray(values)
      .flatMap(expandFacingSearchValues)
      .map(escapePostgrestLikeValue)
      .filter(Boolean)
  )];

  return terms.length ? terms.map(v => `facing_dir.ilike.%${v}%`).join(",") : "";
}

function toCoord(value) {
  if (value === null || value === undefined || value === "") return NaN;
  const n = Number(value);
  return Number.isFinite(n) ? n : NaN;
}

function hasCoords(lat, lng) {
  return Number.isFinite(lat) && Number.isFinite(lng);
}

function getAreaValue(row) {
  return toNumber(
    row?.total_area ??
      row?.area ??
      row?.net_area ??
      row?.land_area ??
      row?.build_area ??
      row?.facade,
    0
  );
}

function parseOptions(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function boundsToKey(bounds) {
  if (!bounds) return "no-bounds";

  return [bounds.south, bounds.west, bounds.north, bounds.east, bounds.zoom]
    .map((v) => Number(v || 0).toFixed(4))
    .join("|");
}

function getBoundsFromLeaflet(map) {
  if (!map) return null;

  const b = map.getBounds();

  return {
    south: b.getSouth(),
    west: b.getWest(),
    north: b.getNorth(),
    east: b.getEast(),
    zoom: map.getZoom(),
  };
}

function normalizeStoredActiveType(value) {
  if (value === "sell") return "للبيع";
  if (value === "rent") return "للإيجار";
  if (value === "want_buy" || value === "want_rent") return value;
  if (value === "للبيع" || value === "للإيجار" || value === "الكل") return value;
  return "الكل";
}

function getInitialActiveType() {
  try {
    return normalizeStoredActiveType(localStorage.getItem(MAP_ACTIVE_TYPE_KEY));
  } catch {
    return "الكل";
  }
}

function playMarkerSpawn(marker, delay = 0) {
  if (!marker?.getElement) return;

  window.setTimeout(() => {
    const el = marker.getElement();
    if (!el) return;

    el.classList.remove("aqari-marker-spawn");
    void el.offsetWidth;
    el.classList.add("aqari-marker-spawn");

    window.setTimeout(() => {
      el.classList.remove("aqari-marker-spawn");
    }, 420);
  }, delay);
}

function getDbTypeFromActiveType(activeType) {
  if (activeType === "للبيع" || activeType === "sell") return "sell";
  if (activeType === "للإيجار" || activeType === "rent") return "rent";
  if (activeType === "want_buy" || activeType === "مطلوب شراء") return "want_buy";
  if (activeType === "want_rent" || activeType === "مطلوب للإيجار") return "want_rent";
  return null;
}

function mapListingSummary(row) {
  if (!row) return null;

  const point = getListingMapPoint(row);
  if (!point || !hasCoords(point.lat, point.lng)) return null;

  const images = (row.listing_images || [])
    .slice()
    .sort((a, b) => (b?.is_main ? 1 : 0) - (a?.is_main ? 1 : 0))
    .map((img) => img?.url)
    .filter(Boolean);

  return {
    ...row,
    lat: point.lat,
    lng: point.lng,
    photo: row.photo || images[0] || null,
    images,
    seller: row.profiles?.name || row.seller || "مستخدم",
    verified: row.profiles?.verified || row.verified || false,
    sellerId: row.user_id,
    sellerName: row.profiles?.name || row.sellerName || "",
    sellerAccountType: row.profiles?.account_type || row.sellerAccountType || "individual",
    sellerPhone: row.profiles?.phone || row.sellerPhone || "",
    sellerInit: (row.profiles?.name || row.seller || "م")[0],
    accountType: row.profiles?.account_type || row.accountType || "individual",
    desc: row.description || row.desc || "",
    priceNum: toNumber(row.price ?? row.priceNum, 0),
    total_area: getAreaValue(row),
    _hasRealCoords: point.accuracy === "exact",
    _approx: point.accuracy !== "exact",
    _locationAccuracy: point.accuracy === "exact" ? "exact" : "approx",
    _geoSource: point.source || row.geo_source || null,
    _fromMapLite: true,
    _skipFetch: false,
  };
}

function applyServerFilters(query, { activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter }) {
  let q = query;

  const dbType = getDbTypeFromActiveType(activeType);
  if (dbType) q = q.eq("type", dbType);

  if (activeCity && activeCity !== "الكل") q = q.eq("city", activeCity);
  if (activeDistrict && activeDistrict !== "الكل") q = q.eq("district", activeDistrict);
  if (activeVillage && activeVillage !== "الكل") q = q.eq("village", activeVillage);

  if (locationFilter === "exact") q = q.eq("location_accuracy", "exact");
  if (locationFilter === "approx") q = q.eq("location_accuracy", "approx");

  if (filters?.currency && filters.currency !== "الكل") q = q.eq("currency", filters.currency);
  if (filters?.category && filters.category !== "الكل") q = q.eq("category", filters.category);
  if (filters?.condition && filters.condition !== "الكل") q = q.eq("condition", filters.condition);
  if (filters?.finishing && filters.finishing !== "الكل") q = q.eq("finishing", filters.finishing);
  if (filters?.heating && filters.heating !== "الكل") q = q.eq("heating", filters.heating);

  if (filters?.elevator === "يوجد") q = q.eq("elevator", true);
  if (filters?.elevator === "لا يوجد") q = q.eq("elevator", false);

  if (filters?.parking === "يوجد") q = q.eq("parking", true);
  if (filters?.parking === "لا يوجد") q = q.eq("parking", false);

  if (filters?.minPrice) q = q.gte("price", Number(filters.minPrice));
  if (filters?.maxPrice) q = q.lte("price", Number(filters.maxPrice));

  if (filters?.minArea) q = q.gte("total_area", Number(filters.minArea));
  if (filters?.maxArea) q = q.lte("total_area", Number(filters.maxArea));

  if (filters?.beds && filters.beds !== "الكل") {
    if (filters.beds === "5+") q = q.gte("rooms", 5);
    else q = q.eq("rooms", Number(filters.beds));
  }

  const floorList = filterValueToArray(filters?.floor).map(Number).filter(Number.isFinite);
  if (floorList.length === 1) q = q.eq("floor", floorList[0]);
  else if (floorList.length > 1) q = q.in("floor", floorList);

  if (filters?.ownership && filters.ownership !== "الكل") {
    q = q.ilike("ownership", `%${String(filters.ownership).split("(")[0].trim()}%`);
  }

  // الجهة: نطابق مرادفات "شمالي" مع "شمال" وغيرها حتى تعمل مع بيانات الإضافة القديمة.
  const facingOr = buildFacingOrFilter(filters?.facing);
  if (facingOr) q = q.or(facingOr);

  if (filters?.furnished === "مفروش") q = q.eq("furnished", "مفروش");
  if (filters?.furnished === "غير مفروش") q = q.neq("furnished", "مفروش");

  if (filters?._newOnly) {
    const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    q = q.gte("created_at", oneMonthAgo);
  }

  return q;
}

async function fetchMapListingsInBounds({
  bounds,
  activeType,
  activeCity,
  activeDistrict,
  activeVillage,
  filters,
  locationFilter,
}) {
  const sb = getSupabase();
  if (!sb || !bounds) return { data: [], hasMore: false };

  let query = sb
    .from("listings")
    .select(`
      id,
      user_id,
      title,
      price,
      currency,
      type,
      category,
      city,
      district,
      village,
      rooms,
      beds,
      floor,
      area,
      total_area,
      land_area,
      build_area,
      facade,
      map_lat,
      map_lng,
      lat,
      lng,
      location_accuracy,
      geo_source,
      extra_fields,
      condition,
      finishing,
      heating,
      elevator,
      parking,
      furnished,
      ownership,
      facing_dir,
      total_floors,
      created_at
    `)
    .eq("status", "active")
    .eq("admin_status", "approved")
    .lte("created_at", new Date().toISOString())
    .not("map_lat", "is", null)
    .not("map_lng", "is", null)
    .gte("map_lat", bounds.south)
    .lte("map_lat", bounds.north)
    .gte("map_lng", bounds.west)
    .lte("map_lng", bounds.east)
    .order("created_at", { ascending: false })
    .limit(MAP_QUERY_LIMIT + 1);

  query = applyServerFilters(query, {
    activeType,
    activeCity,
    activeDistrict,
    activeVillage,
    filters,
    locationFilter,
  });

  const { data, error } = await query;
  if (error) throw error;

  const rows = data || [];
  const hasMore = rows.length > MAP_QUERY_LIMIT;

  return {
    data: hasMore ? rows.slice(0, MAP_QUERY_LIMIT) : rows,
    hasMore,
  };
}

function getClusterPrecision(zoom) {
  if (zoom <= 7) return 0.55;
  if (zoom <= 9) return 0.28;
  if (zoom <= 11) return 0.12;
  if (zoom <= 12) return 0.055;
  if (zoom <= 13) return 0.022;
  return 0;
}

function buildDisplayPins(list, zoom) {
  const exactItems = list.filter((item) => item._locationAccuracy === "exact");
  const approxItems = list.filter((item) => item._locationAccuracy === "approx");
  const output = [];
  const precision = getClusterPrecision(zoom || 7);

  if (!precision) {
    exactItems.forEach((item) => {
      output.push({
        kind: "item",
        key: `item:${item.id ?? `${item.lat}:${item.lng}:${item.title || ""}`}`,
        item,
        lat: item.lat,
        lng: item.lng,
        signature: `item:${item.id}:exact:${item.price}:${item.type}:${item.currency}`,
      });
    });
  } else {
    const groups = new Map();

    for (const item of exactItems) {
      const lat = Number(item.lat);
      const lng = Number(item.lng);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

      const x = Math.floor((lng + 180) / precision);
      const y = Math.floor((lat + 90) / precision);
      const key = `z${zoom || 7}:${precision}:${x}:${y}`;

      const group = groups.get(key) || { key, items: [] };
      group.items.push(item);
      groups.set(key, group);
    }

    groups.forEach((group) => {
      if (group.items.length < CLUSTER_MIN_SIZE) {
        group.items.forEach((item) => {
          output.push({
            kind: "item",
            key: `item:${item.id ?? `${item.lat}:${item.lng}:${item.title || ""}`}`,
            item,
            lat: item.lat,
            lng: item.lng,
            signature: `item:${item.id}:exact:${item.price}:${item.type}:${item.currency}`,
          });
        });

        return;
      }

      const avgLat = group.items.reduce((sum, item) => sum + Number(item.lat), 0) / group.items.length;
      const avgLng = group.items.reduce((sum, item) => sum + Number(item.lng), 0) / group.items.length;

      output.push({
        kind: "cluster",
        key: `cluster:${group.key}`,
        items: group.items,
        lat: avgLat,
        lng: avgLng,
        count: group.items.length,
        signature: `cluster:${group.key}:${group.items.length}`,
      });
    });
  }

  const approxGroups = new Map();

  for (const item of approxItems) {
    const lat = Number(item.lat);
    const lng = Number(item.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const key = `${lat.toFixed(5)}:${lng.toFixed(5)}`;
    const group = approxGroups.get(key) || { lat: item.lat, lng: item.lng, items: [] };
    group.items.push(item);
    approxGroups.set(key, group);
  }

  approxGroups.forEach((group, coordKey) => {
    if (group.items.length >= APPROX_STACK_MIN) {
      const ids = group.items.map((item) => item.id).sort().join(",");

      output.push({
        kind: "approx_stack",
        key: `approx_stack:${coordKey}`,
        items: group.items,
        lat: group.lat,
        lng: group.lng,
        count: group.items.length,
        signature: `approx_stack:${coordKey}:${ids}`,
      });

      return;
    }

    const item = group.items[0];

    output.push({
      kind: "item",
      key: `item:${item.id ?? `${item.lat}:${item.lng}:${item.title || ""}`}`,
      item,
      lat: item.lat,
      lng: item.lng,
      signature: `item:${item.id}:approx:${item.price}:${item.type}:${item.currency}`,
    });
  });

  return output;
}

const STATIC_SX = {
  page: {
    height: "100dvh",
    display: "flex",
    flexDirection: "column",
    fontFamily: "Tajawal,sans-serif",
  },
  header: {
    background: "linear-gradient(135deg,#1A4A2E,#2D6B45)",
    padding: "14px 16px 10px",
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexShrink: 0,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: "rgba(255,255,255,0.15)",
    border: "none",
    color: "white",
    fontSize: 18,
    cursor: "pointer",
  },
  title: {
    fontSize: 16,
    fontWeight: 800,
    color: "white",
    flex: 1,
  },
  filterWrap: {
    flexShrink: 0,
  },
  mapWrap: {
    flex: 1,
    position: "relative",
    overflow: "hidden",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  floatingStatus: {
    position: "absolute",
    top: 12,
    left: 86,
    right: 10,
    zIndex: 1100,
    display: "flex",
    flexDirection: "column",
    gap: 6,
    alignItems: "flex-start",
    pointerEvents: "none",
    maxWidth: "calc(100% - 96px)",
  },
  statusLine: {
    display: "flex",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    maxWidth: "100%",
  },
  selectedSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderRadius: "20px 20px 0 0",
    padding: "16px",
    boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
    zIndex: 1000,
  },
  selectedTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  selectedBody: {
    flex: 1,
  },
  selectedMeta: {
    display: "flex",
    gap: 10,
    marginTop: 6,
    flexWrap: "wrap",
  },
  closeBtn: {
    borderRadius: "50%",
    border: "none",
    width: 30,
    height: 30,
    cursor: "pointer",
    fontSize: 14,
    flexShrink: 0,
  },
};

function ApproxStackSheet({ items, onSelect, onClose, DC }) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: DC.white,
        borderRadius: "20px 20px 0 0",
        padding: "16px 16px 24px",
        boxShadow: "0 -4px 20px rgba(0,0,0,.18)",
        zIndex: 1050,
        maxHeight: "60vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Tajawal,sans-serif",
        direction: "rtl",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, fontWeight: 800, color: DC.text }}>
          〰️ {items.length} عقار تقريبي في هذا الموقع
        </span>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: DC.bg,
            border: "none",
            borderRadius: "50%",
            width: 30,
            height: 30,
            cursor: "pointer",
            fontSize: 16,
            color: DC.text2,
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((item) => {
          const areaText = formatListingArea(item);
          const roomsText = formatListingRooms(item);
          const locationText = formatListingLocation(item);

          return (
            <button
              type="button"
              key={item.id ?? `${item.lat}:${item.lng}:${item.title}`}
              onClick={() => onSelect(item)}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 7,
                padding: "12px 14px",
                background: DC.bg,
                border: `1.5px solid ${DC.border || "rgba(0,0,0,.08)"}`,
                borderRadius: 14,
                cursor: "pointer",
                textAlign: "right",
                fontFamily: "Tajawal,sans-serif",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 900, color: DC.text }}>
                {item.title || "عقار بدون عنوان"}
              </span>

              <span style={{ fontSize: 18, fontWeight: 900, color: C.primary }}>
                {formatListingPrice(item)}
              </span>

              {locationText && (
                <span style={{ fontSize: 11, color: DC.text3 }}>📍 {locationText}</span>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                {areaText && <span style={{ fontSize: 11, color: DC.text2 }}>📐 {areaText}</span>}
                {roomsText && <span style={{ fontSize: 11, color: DC.text2 }}>🛏 {roomsText}</span>}
                <span style={{ fontSize: 11, color: "#B45309", fontWeight: 800 }}>〰️ موقع تقريبي</span>
              </div>

              <span style={{ fontSize: 11, color: DC.text3 }}>
                اضغط لعرض التفاصيل ←
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function getLocationButtonStyle(locationFilter, DC) {
  const approx = locationFilter === "approx";
  const exact = locationFilter === "exact";

  return {
    padding: "7px 12px",
    borderRadius: 20,
    border: "1.5px solid",
    borderColor: approx ? "#F59E0B" : exact ? C.primary : DC.border || "rgba(0,0,0,.15)",
    background: approx ? "rgba(254,243,199,.96)" : exact ? "rgba(232,244,240,.96)" : "rgba(255,255,255,.96)",
    color: approx ? "#B45309" : exact ? C.primary : DC.text2,
    fontSize: 11,
    fontWeight: 800,
    cursor: "pointer",
    fontFamily: "inherit",
    display: "flex",
    alignItems: "center",
    gap: 4,
    whiteSpace: "nowrap",
    minHeight: 32,
    boxShadow: "0 3px 12px rgba(0,0,0,.12)",
    backdropFilter: "blur(10px)",
    pointerEvents: "auto",
  };
}

export default function MapViewPage({ setPage, openDetail, DC = C, user }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markerLayerRef = useRef(null);
  const markerCacheRef = useRef(new Map());
  const lastBoundsKeyRef = useRef("");
  const fetchSeqRef = useRef(0);
  const spawnUntilRef = useRef(0);

  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState("");
  const [dataError, setDataError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [rows, setRows] = useState([]);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [selected, setSelected] = useState(null);
  const [approxStack, setApproxStack] = useState(null);
  const [locationFilter, setLocationFilter] = useState("all");
  const [activeSheet, setActiveSheet] = useState(null);
  const [activeType, setActiveType] = useState(getInitialActiveType);
  const [activeCity, setActiveCity] = useState("الكل");
  const [activeDistrict, setActiveDistrict] = useState("الكل");
  const [activeVillage, setActiveVillage] = useState("الكل");
  const [filters, setFilters] = useState({});
  const [filterDistricts, setFilterDistricts] = useState([]);
  const [filterVillages, setFilterVillages] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);
  const [filterOpts, setFilterOpts] = useState({ condition: [], finishing: [], heating: [], furnished: [] });
  const [savedSearches, setSavedSearches] = useState([]);
  const [activeSearchId, setActiveSearchId] = useState(null);

  const sx = useMemo(
    () => ({
      ...STATIC_SX,
      page: { ...STATIC_SX.page, background: DC.bg },
      centerOverlay: {
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: DC.bg,
        zIndex: 10,
        padding: 20,
        textAlign: "center",
      },
      badge: {
        background: "rgba(255,255,255,.95)",
        color: DC.text,
        border: `1px solid ${DC.border || "rgba(0,0,0,.08)"}`,
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 800,
        boxShadow: "0 3px 12px rgba(0,0,0,.12)",
        backdropFilter: "blur(10px)",
      },
      warningBadge: {
        background: "rgba(255,251,235,.96)",
        color: "#92400E",
        border: "1px solid rgba(245,158,11,.35)",
        borderRadius: 999,
        padding: "6px 10px",
        fontSize: 11,
        fontWeight: 900,
        boxShadow: "0 3px 12px rgba(0,0,0,.12)",
        backdropFilter: "blur(10px)",
        lineHeight: 1.35,
      },
      errorBadge: {
        background: "#FEF2F2",
        color: "#991B1B",
        border: "1px solid #FECACA",
        borderRadius: 12,
        padding: "7px 10px",
        fontSize: 11,
        fontWeight: 800,
        boxShadow: "0 3px 12px rgba(0,0,0,.12)",
        maxWidth: 280,
      },
      selectedSheet: { ...STATIC_SX.selectedSheet, background: DC.white },
      selectedTitle: { fontSize: 14, fontWeight: 800, color: DC.text, marginBottom: 4 },
      selectedPrice: { fontSize: 20, fontWeight: 900, color: C.primary },
      selectedLocation: { fontSize: 12, color: DC.text3, marginTop: 4 },
      selectedMetaText: { fontSize: 11, color: DC.text2 },
      detailBtn: {
        width: "100%",
        marginTop: 12,
        padding: "11px",
        background: C.primary,
        color: "white",
        border: "none",
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 800,
        cursor: "pointer",
        fontFamily: "inherit",
      },
      closeBtn: { ...STATIC_SX.closeBtn, background: DC.bg, color: DC.text2 },
    }),
    [DC]
  );

  const filterContext = useMemo(
    () => ({ activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter }),
    [activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter]
  );

  useEffect(() => {
    try {
      localStorage.setItem(MAP_ACTIVE_TYPE_KEY, activeType || "الكل");
    } catch {}
  }, [activeType]);

  useEffect(() => {
    setSelected(null);
    setApproxStack(null);
  }, [activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter]);

  const updateMapBounds = useCallback(() => {
    const map = mapInst.current;
    if (!map) return;

    const next = getBoundsFromLeaflet(map);
    const nextKey = boundsToKey(next);

    if (nextKey === lastBoundsKeyRef.current) return;

    lastBoundsKeyRef.current = nextKey;
    setMapBounds(next);

    const c = map.getCenter();

    try {
      sessionStorage.setItem("map_last_view", JSON.stringify({ lat: c.lat, lng: c.lng, zoom: map.getZoom() }));
    } catch {}
  }, []);

  useEffect(() => {
    let cancelled = false;

    ensureLeafletLoaded()
      .then(() => {
        if (!cancelled) setMapReady(true);
      })
      .catch((err) => {
        console.error("Failed to load Leaflet:", err);
        if (!cancelled) setMapError("تعذّر تحميل الخريطة.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapInst.current) return;

    const L = window.L;

    if (!L) {
      setMapError("مكتبة الخريطة غير متاحة.");
      return;
    }

    let initCenter = [33.51, 36.29];
    let initZoom = 7;

    try {
      const saved = sessionStorage.getItem("map_last_view");

      if (saved) {
        const parsed = JSON.parse(saved);
        if (hasCoords(toCoord(parsed.lat), toCoord(parsed.lng))) initCenter = [Number(parsed.lat), Number(parsed.lng)];
        if (Number.isFinite(Number(parsed.zoom))) initZoom = Number(parsed.zoom);
      }
    } catch {}

    ensureMapMarkerStyles();

    const map = L.map(mapRef.current, { zoomControl: true, markerZoomAnimation: true }).setView(initCenter, initZoom);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    mapInst.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);
    markerCacheRef.current = new Map();

    map.on("moveend zoomend", updateMapBounds);

    setTimeout(() => {
      map.invalidateSize();
      updateMapBounds();
    }, 180);

    return () => {
      map.off("moveend zoomend", updateMapBounds);
      markerLayerRef.current?.clearLayers();
      markerLayerRef.current = null;
      markerCacheRef.current.clear();
      map.remove();
      mapInst.current = null;
    };
  }, [mapReady, updateMapBounds]);

  useEffect(() => {
    if (activeCity === "الكل") {
      setActiveDistrict("الكل");
      setActiveVillage("الكل");
      setFilterDistricts([]);
      setFilterVillages([]);
      return;
    }

    let cancelled = false;

    setLoadingDistricts(true);

    getDistrictsCache(activeCity)
      .then((data) => {
        if (!cancelled) setFilterDistricts(data || []);
      })
      .catch(() => {
        if (!cancelled) setFilterDistricts([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingDistricts(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeCity]);

  useEffect(() => {
    if (activeDistrict === "الكل") {
      setActiveVillage("الكل");
      setFilterVillages([]);
      return;
    }

    let cancelled = false;

    const finish = (data = []) => {
      if (!cancelled) {
        setFilterVillages(data);
        setLoadingVillages(false);
      }
    };

    const run = async () => {
      try {
        setLoadingVillages(true);

        const localDistrict = filterDistricts.find((d) => d.name === activeDistrict);

        if (localDistrict?.id) {
          finish((await getVillages(localDistrict.id)) || []);
          return;
        }

        const districtRow = await getDistrictByName(activeDistrict, activeCity);
        if (!districtRow?.id) return finish([]);

        finish((await getVillages(districtRow.id)) || []);
      } catch {
        finish([]);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [activeCity, activeDistrict, filterDistricts]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const uid = user?.id || (await getCurrentUserId());
      if (!uid || cancelled) return;

      const items = await fetchUserSavedSearches(uid);
      if (!cancelled) setSavedSearches((items || []).slice(0, 10));
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    fetchPropertyFieldOptions(["condition", "finishing", "heating", "furnished"])
      .then((data) => {
        if (cancelled || !data?.length) return;

        const opts = { condition: [], finishing: [], heating: [], furnished: [] };

        data.forEach((field) => {
          opts[field.field_key] = parseOptions(field.options);
        });

        setFilterOpts(opts);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapBounds) return;

    const seq = ++fetchSeqRef.current;

    const timer = setTimeout(async () => {
      try {
        setFetching(true);
        setDataError("");

        const result = await fetchMapListingsInBounds({ bounds: mapBounds, ...filterContext });

        if (seq !== fetchSeqRef.current) return;

        setRows(result.data || []);
        setHasMoreResults(Boolean(result.hasMore));
      } catch (err) {
        console.error("Map fetch failed:", err);

        if (seq !== fetchSeqRef.current) return;

        setRows([]);
        setHasMoreResults(false);
        setDataError("تعذّر تحميل عقارات هذه المنطقة. أعد المحاولة أو حرّك الخريطة قليلًا.");
      } finally {
        if (seq === fetchSeqRef.current) setFetching(false);
      }
    }, FETCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [mapReady, mapBounds, filterContext]);

  const pins = useMemo(() => rows.map(mapListingSummary).filter(Boolean), [rows]);

  const filtered = useMemo(() => {
    let list = applyListingFilters(pins, { activeType, activeCity, activeDistrict, activeVillage, filters });

    if (locationFilter === "exact") list = list.filter((item) => item._locationAccuracy === "exact");
    if (locationFilter === "approx") list = list.filter((item) => item._locationAccuracy === "approx");

    return list;
  }, [pins, activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter]);

  const displayPins = useMemo(() => buildDisplayPins(filtered, mapBounds?.zoom || 7), [filtered, mapBounds?.zoom]);

  const { exactCount, approxCount } = useMemo(() => {
    let exact = 0;
    let approx = 0;

    for (const item of filtered) {
      if (item._locationAccuracy === "exact") exact += 1;
      else approx += 1;
    }

    return { exactCount: exact, approxCount: approx };
  }, [filtered]);

  const hasFilters = useMemo(
    () =>
      activeType !== "الكل" ||
      activeCity !== "الكل" ||
      activeDistrict !== "الكل" ||
      activeVillage !== "الكل" ||
      locationFilter !== "all" ||
      Object.values(filters).some(hasActiveFilterValue),
    [activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter]
  );

  function buildIcon(L, pin) {
    if (pin.kind === "cluster") return createMapClusterIcon(L, pin.count);
    if (pin.kind === "approx_stack") return createMapApproxStackIcon(L, pin.count);
    return createMapItemIcon(L, pin.item);
  }

  function handlePinClick(pin) {
    if (pin.kind === "cluster") {
      const map = mapInst.current;
      const L = window.L;

      if (!map || !L) return;

      spawnUntilRef.current = Date.now() + 1400;

      const points = (pin.items || [])
        .map((item) => [Number(item.lat), Number(item.lng)])
        .filter(([lat, lng]) => Number.isFinite(lat) && Number.isFinite(lng));

      if (!points.length) return;

      const bounds = L.latLngBounds(points);
      const center = bounds.getCenter();
      const currentZoom = map.getZoom();
      const targetZoom = Math.min(Math.max(currentZoom + 3, 14), 17);

      map.flyTo([center.lat, center.lng], targetZoom, { animate: true, duration: 0.45 });

      return;
    }

    if (pin.kind === "approx_stack") {
      setSelected(null);
      setApproxStack(pin.items);
      return;
    }

    setApproxStack(null);
    setSelected(pin.item);
  }

  useEffect(() => {
    if (!mapReady || !mapInst.current) return;

    const L = window.L;
    const map = mapInst.current;

    if (!markerLayerRef.current) markerLayerRef.current = L.layerGroup().addTo(map);

    const layer = markerLayerRef.current;
    const cache = markerCacheRef.current;
    const nextKeys = new Set();

    displayPins.forEach((pin, index) => {
      const { key, lat, lng, signature } = pin;

      nextKeys.add(key);

      const old = cache.get(key);
      let marker = old?.marker;
      let wasCreated = false;

      if (!marker) {
        marker = L.marker([lat, lng], { icon: buildIcon(L, pin), riseOnHover: true });
        marker.addTo(layer);
        cache.set(key, { marker, signature: null });
        wasCreated = true;
      } else {
        marker.setLatLng([lat, lng]);
      }

      const record = cache.get(key);

      if (record.signature !== signature) {
        marker.setIcon(buildIcon(L, pin));
        record.signature = signature;
      }

      if (wasCreated && Date.now() < spawnUntilRef.current && pin.kind !== "cluster") {
        playMarkerSpawn(marker, Math.min(index * 24, 180));
      }

      marker.off("click");
      marker.on("click", () => handlePinClick(pin));
    });

    cache.forEach((record, key) => {
      if (!nextKeys.has(key)) {
        layer.removeLayer(record.marker);
        cache.delete(key);
      }
    });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, displayPins]);

  const saveSearch = useCallback(async () => {
    const uid = user?.id || (await getCurrentUserId());
    if (!uid) return;

    const dbType = getDbTypeFromActiveType(activeType);

    const label =
      [
        activeCity !== "الكل" ? activeCity : null,
        activeDistrict !== "الكل" ? activeDistrict : null,
        activeVillage !== "الكل" ? activeVillage : null,
        activeType !== "الكل" ? activeType : null,
        locationFilter === "exact" ? "موقع دقيق" : locationFilter === "approx" ? "موقع تقريبي" : null,
        filters.category && filters.category !== "الكل" ? filters.category : null,
        filters.minPrice || filters.maxPrice ? `${filters.minPrice || "0"}—${filters.maxPrice || "∞"}` : null,
        filters.minArea || filters.maxArea ? `مساحة ${filters.minArea || "0"}—${filters.maxArea || "∞"}` : null,
        hasActiveFilterValue(filters.floor) ? "طابق " + filterLabelList(filters.floor) : null,
        hasActiveFilterValue(filters.facing) ? "جهة " + filterLabelList(filters.facing) : null,
      ]
        .filter(Boolean)
        .join(" · ") || "بحث محفوظ";

    const { data: inserted, error } = await createSavedSearch({
      user_id: uid,
      query: label,
      city: activeCity !== "الكل" ? activeCity : null,
      district: activeDistrict !== "الكل" ? activeDistrict : null,
      type: dbType,
      category: filters.category && filters.category !== "الكل" ? filters.category : null,
      min_price: filters.minPrice || null,
      max_price: filters.maxPrice || null,
      min_area: filters.minArea || null,
      max_area: filters.maxArea || null,
      currency: filters.currency && filters.currency !== "الكل" ? filters.currency : null,
      floor: hasActiveFilterValue(filters.floor) ? filterLabelList(filters.floor) : null,
      facing: hasActiveFilterValue(filters.facing) ? filterLabelList(filters.facing) : null,
      ownership_type: filters.ownership && filters.ownership !== "الكل" ? filters.ownership : null,
      notif: true,
    });

    if (!error) {
      setSavedSearches((prev) => [inserted || { id: Date.now(), query: label }, ...prev].slice(0, 10));
    }
  }, [user?.id, activeType, activeCity, activeDistrict, activeVillage, filters, locationFilter]);

  const clearFilters = useCallback(() => {
    setActiveType("الكل");
    setActiveCity("الكل");
    setActiveDistrict("الكل");
    setActiveVillage("الكل");
    setLocationFilter("all");
    setFilters({});
  }, []);

  const cycleLocationFilter = useCallback(() => {
    setLocationFilter((current) => (current === "all" ? "approx" : current === "approx" ? "exact" : "all"));
  }, []);

  const locationBtnStyle = useMemo(() => getLocationButtonStyle(locationFilter, DC), [locationFilter, DC]);

  return (
    <div style={sx.page}>
      <div style={sx.header}>
        <button onClick={() => setPage("home")} style={sx.backBtn}>
          →
        </button>

        <span style={sx.title}>🗺️ الخريطة</span>
      </div>

      <div style={sx.filterWrap}>
        <FilterBar
          DC={DC}
          user={user}
          activeType={activeType}
          setActiveType={setActiveType}
          activeCity={activeCity}
          setActiveCity={setActiveCity}
          activeDistrict={activeDistrict}
          setActiveDistrict={setActiveDistrict}
          activeVillage={activeVillage}
          setActiveVillage={setActiveVillage}
          filters={filters}
          setFilters={setFilters}
          activeSheet={activeSheet}
          setActiveSheet={setActiveSheet}
          filterOpts={filterOpts}
          filterDistricts={filterDistricts}
          filterVillages={filterVillages}
          loadingDistricts={loadingDistricts}
          loadingVillages={loadingVillages}
          cityOptions={["الكل", ...cities]}
          hasFilters={hasFilters}
          saveSearch={saveSearch}
          clearFilters={clearFilters}
          resultCount={filtered.length}
          savedSearches={savedSearches}
          setSavedSearches={setSavedSearches}
          activeSearchId={activeSearchId}
          setActiveSearchId={setActiveSearchId}
          showQuickFilters={true}
        />
      </div>

      <div style={sx.mapWrap}>
        {(!mapReady || mapError) && (
          <div style={sx.centerOverlay}>
            <div>
              <div style={{ fontSize: 36, marginBottom: 10 }}>
                {mapError ? "⚠️" : "🗺️"}
              </div>
              <div style={{ fontSize: 14, color: mapError ? "#991B1B" : DC.text2, fontWeight: 800 }}>
                {mapError || "جاري تحميل الخريطة..."}
              </div>
            </div>
          </div>
        )}

        <div ref={mapRef} style={sx.map} />

        {mapReady && !mapError && (
          <div style={sx.floatingStatus}>
            <div style={sx.statusLine}>
              <button onClick={cycleLocationFilter} style={locationBtnStyle}>
                {locationFilter === "approx" ? "〰️ تقريبي" : locationFilter === "exact" ? "📍 دقيق" : "📍 الموقع"}
              </button>

              <div style={sx.badge}>
                {hasMoreResults ? `+${MAP_QUERY_LIMIT} عقار` : `${filtered.length} عقار`}
                {fetching && <span style={{ marginInlineStart: 6, opacity: 0.65 }}>…</span>}
              </div>
            </div>

            {hasMoreResults && <div style={sx.warningBadge}>قرّب لعرض المزيد</div>}

            <div style={sx.badge}>
              📍 دقيق: {exactCount} · 〰️ تقريبي: {approxCount}
            </div>

            {dataError && <div style={sx.errorBadge}>{dataError}</div>}
          </div>
        )}

        {approxStack && (
          <ApproxStackSheet
            items={approxStack}
            DC={DC}
            onClose={() => setApproxStack(null)}
            onSelect={(item) => {
              setApproxStack(null);
              openDetail(item, "mapView");
            }}
          />
        )}

        {selected && !approxStack && (
          <MapListingCard
            item={selected}
            DC={DC}
            variant="map"
            showClose
            showDetailsButton
            onClose={() => setSelected(null)}
            onOpen={() => openDetail(selected, "mapView")}
          />
        )}
      </div>
    </div>
  );
                       }
