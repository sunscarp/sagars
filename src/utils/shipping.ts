// J&T Express zone-based shipping calculation from Kuala Lumpur
// Uses Malaysian postcode prefixes for zone/state resolution, zone-based
// rates for shipping. Supports international shipping by continent.
import { SHIPPING_SERVICE_TAX_RATE } from "@/utils/tax";

export type ShippingResult = {
  available: boolean;
  charge: number;
  estimatedDays: string;
  courierPartner: string;
  zone: string;
  message?: string;
};

export type PincodeInfo = {
  pincode: string;
  city: string;
  state: string;
  district: string;
  available: boolean;
};

// Zone-based rates from Kuala Lumpur via J&T Express (RM).
// Rates include fuel surcharge. Service tax is applied on top.
type ZoneDef = { rate: number; perItem: number; days: string; label: string };

const ZONES: Record<string, ZoneDef> = {
  metro:      { rate: 8,  perItem: 3, days: "1-3", label: "Klang Valley / Metro" },
  peninsular: { rate: 12, perItem: 4, days: "2-4", label: "Peninsular Malaysia" },
  east:       { rate: 20, perItem: 6, days: "4-7", label: "Sabah & Sarawak" },
  intl_asia:       { rate: 60,  perItem: 25, days: "7-14",  label: "Asia" },
  intl_europe:     { rate: 90,  perItem: 35, days: "10-18", label: "Europe" },
  intl_namerica:   { rate: 100, perItem: 40, days: "10-18", label: "North America" },
  intl_samerica:   { rate: 110, perItem: 45, days: "12-20", label: "South America" },
  intl_africa:     { rate: 100, perItem: 40, days: "10-18", label: "Africa" },
  intl_oceania:    { rate: 95,  perItem: 38, days: "10-18", label: "Australia / Oceania" },
};

// Country to continent mapping
const COUNTRY_CONTINENT: Record<string, string> = {
  malaysia: "asia",
  // Asia
  afghanistan: "asia", armenia: "asia", azerbaijan: "asia", bahrain: "asia",
  bangladesh: "asia", bhutan: "asia", brunei: "asia", cambodia: "asia",
  china: "asia", cyprus: "asia", georgia: "asia", "hong kong": "asia",
  indonesia: "asia", iran: "asia", iraq: "asia", israel: "asia",
  japan: "asia", jordan: "asia", kazakhstan: "asia", kuwait: "asia",
  kyrgyzstan: "asia", laos: "asia", lebanon: "asia",
  maldives: "asia", mongolia: "asia", myanmar: "asia", nepal: "asia",
  oman: "asia", pakistan: "asia", philippines: "asia", qatar: "asia",
  "saudi arabia": "asia", singapore: "asia", "south korea": "asia",
  "sri lanka": "asia", syria: "asia", taiwan: "asia", tajikistan: "asia",
  thailand: "asia", timor: "asia", turkey: "asia", turkmenistan: "asia",
  "united arab emirates": "asia", uzbekistan: "asia", vietnam: "asia", yemen: "asia",
  // Europe
  albania: "europe", andorra: "europe", austria: "europe", belarus: "europe",
  belgium: "europe", "bosnia and herzegovina": "europe", bulgaria: "europe",
  croatia: "europe", "czech republic": "europe", denmark: "europe",
  estonia: "europe", finland: "europe", france: "europe", germany: "europe",
  greece: "europe", hungary: "europe", iceland: "europe", ireland: "europe",
  italy: "europe", kosovo: "europe", latvia: "europe", liechtenstein: "europe",
  lithuania: "europe", luxembourg: "europe", malta: "europe", moldova: "europe",
  monaco: "europe", montenegro: "europe", netherlands: "europe",
  "north macedonia": "europe", norway: "europe", poland: "europe",
  portugal: "europe", romania: "europe", russia: "europe",
  "san marino": "europe", serbia: "europe", slovakia: "europe",
  slovenia: "europe", spain: "europe", sweden: "europe", switzerland: "europe",
  ukraine: "europe", "united kingdom": "europe", "uk": "europe",
  "vatican city": "europe",
  // North America
  "antigua and barbuda": "namerica", bahamas: "namerica", barbados: "namerica",
  belize: "namerica", canada: "namerica", "costa rica": "namerica", cuba: "namerica",
  dominica: "namerica", "dominican republic": "namerica", "el salvador": "namerica",
  grenada: "namerica", guatemala: "namerica", haiti: "namerica", honduras: "namerica",
  jamaica: "namerica", mexico: "namerica", nicaragua: "namerica", panama: "namerica",
  "saint lucia": "namerica", "trinidad and tobago": "namerica",
  "united states": "namerica", "usa": "namerica",
  // South America
  argentina: "samerica", bolivia: "samerica", brazil: "samerica", chile: "samerica",
  colombia: "samerica", ecuador: "samerica", guyana: "samerica", paraguay: "samerica",
  peru: "samerica", suriname: "samerica", uruguay: "samerica", venezuela: "samerica",
  // Africa
  algeria: "africa", angola: "africa", botswana: "africa", burkina: "africa",
  burundi: "africa", cameroon: "africa", "cape verde": "africa",
  "central african republic": "africa", chad: "africa", comoros: "africa",
  "congo": "africa", "drc": "africa", djibouti: "africa", egypt: "africa",
  "equatorial guinea": "africa", eritrea: "africa", ethiopia: "africa",
  gabon: "africa", gambia: "africa", ghana: "africa", guinea: "africa",
  "ivory coast": "africa", kenya: "africa", lesotho: "africa", liberia: "africa",
  libya: "africa", madagascar: "africa", malawi: "africa", mali: "africa",
  mauritania: "africa", mauritius: "africa", morocco: "africa", mozambique: "africa",
  namibia: "africa", niger: "africa", nigeria: "africa", rwanda: "africa",
  "sao tome": "africa", senegal: "africa", seychelles: "africa",
  "sierra leone": "africa", somalia: "africa", "south africa": "africa",
  "south sudan": "africa", sudan: "africa", swaziland: "africa", tanzania: "africa",
  togo: "africa", tunisia: "africa", uganda: "africa", zambia: "africa",
  zimbabwe: "africa",
  // Oceania
  australia: "oceania", fiji: "oceania", kiribati: "oceania",
  "marshall islands": "oceania", micronesia: "oceania", nauru: "oceania",
  "new zealand": "oceania", palau: "oceania", "papua new guinea": "oceania",
  samoa: "oceania", "solomon islands": "oceania", tonga: "oceania",
  tuvalu: "oceania", vanuatu: "oceania",
};

// Malaysian postcode (first 2 digits) -> state mapping (approximate)
const MY_STATE_RANGES: [number, number, string][] = [
  [1, 2, "Perlis"],
  [5, 9, "Kedah"],
  [10, 14, "Penang"],
  [15, 18, "Kelantan"],
  [20, 24, "Terengganu"],
  [25, 28, "Pahang"],
  [30, 36, "Perak"],
  [39, 39, "Pahang"],
  [40, 48, "Selangor"],
  [49, 49, "Pahang"],
  [50, 60, "Kuala Lumpur"],
  [62, 62, "Putrajaya"],
  [63, 68, "Selangor"],
  [69, 69, "Pahang"],
  [70, 73, "Negeri Sembilan"],
  [75, 78, "Melaka"],
  [79, 86, "Johor"],
  [87, 87, "Labuan"],
  [88, 91, "Sabah"],
  [93, 98, "Sarawak"],
];

export function stateFromPostcode(postcode: string): string {
  const digits = String(postcode || "").replace(/\D/g, "");
  if (digits.length < 2) return "";
  const p2 = parseInt(digits.slice(0, 2), 10);
  for (const [lo, hi, name] of MY_STATE_RANGES) {
    if (p2 >= lo && p2 <= hi) return name;
  }
  return "";
}

function getContinentKey(country: string): string {
  const key = country.trim().toLowerCase();
  return COUNTRY_CONTINENT[key] || "intl";
}

export function getZone(pincode: string, country?: string): string {
  // International shipping
  if (country && country.trim().toLowerCase() !== "malaysia") {
    const continent = getContinentKey(country);
    if (continent === "intl") return "intl_asia";
    return `intl_${continent}`;
  }

  // Domestic (Malaysia) postcode checks
  const digits = String(pincode || "").replace(/\D/g, "");
  const p2 = parseInt(digits.slice(0, 2), 10) || 0;

  // Sabah & Sarawak & Labuan
  if (p2 >= 87 && p2 <= 98) return "east";

  // Klang Valley / Metro (KL, Putrajaya, Selangor)
  if (
    (p2 >= 40 && p2 <= 48) ||
    (p2 >= 50 && p2 <= 60) ||
    p2 === 62 ||
    (p2 >= 63 && p2 <= 68)
  ) {
    return "metro";
  }

  return "peninsular";
}

export async function validatePincode(pincode: string, country?: string): Promise<PincodeInfo> {
  // International: just mark as available
  if (country && country.trim().toLowerCase() !== "malaysia") {
    return { pincode, city: "", state: "", district: "", available: true };
  }

  const digits = String(pincode || "").replace(/\D/g, "");
  const valid = /^\d{5}$/.test(digits);
  const state = stateFromPostcode(digits);
  return {
    pincode: digits,
    city: "",
    state,
    district: state,
    available: valid,
  };
}

export function calculateShipping(
  totalItems: number,
  orderValue: number,
  pincode: string,
  customZones?: Record<string, { rate: number; perItem: number; days: string; label: string }>,
  freeDeliveryThreshold?: number,
  country?: string
): ShippingResult {
  const zone = getZone(pincode, country);
  const zones = customZones && Object.keys(customZones).length > 0 ? customZones : ZONES;
  const z = zones[zone] || ZONES[zone] || zones["intl_asia"] || ZONES["intl_asia"];

  const taxMultiplier = 1 + SHIPPING_SERVICE_TAX_RATE / 100;

  // Free delivery only applies domestically
  if (country && country.trim().toLowerCase() !== "malaysia") {
    const baseCharge = z.rate + Math.max(0, totalItems - 1) * z.perItem;
    const charge = Math.round(baseCharge * taxMultiplier);
    return {
      available: true,
      charge,
      estimatedDays: z.days,
      courierPartner: "J&T Express",
      zone: z.label,
    };
  }

  if (typeof freeDeliveryThreshold === "number" && freeDeliveryThreshold > 0 && orderValue >= freeDeliveryThreshold) {
    return {
      available: true,
      charge: 0,
      estimatedDays: z.days,
      courierPartner: "J&T Express",
      zone: z.label,
    };
  }

  const baseCharge = z.rate + Math.max(0, totalItems - 1) * z.perItem;
  const charge = Math.round(baseCharge * taxMultiplier);

  return {
    available: true,
    charge,
    estimatedDays: z.days,
    courierPartner: "J&T Express",
    zone: z.label,
  };
}

export async function lookupPincode(pincode: string, country?: string): Promise<{ city: string; state: string } | null> {
  const info = await validatePincode(pincode, country);
  if (info.available && (info.state || country)) {
    return { city: info.city || info.district, state: info.state || country || "" };
  }
  return null;
}
