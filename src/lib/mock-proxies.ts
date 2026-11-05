// TEMPORARY sample data until the proxy provider API is connected.
export type Proxy = {
  id: string; ip: string; country: string; city: string; region: string; isp: string;
  zip: string; speed: number; type: "Residential" | "Mobile"; protocol: "UDP" | "TCP"; price: number;
};

export const COUNTRIES: Record<string, string> = {
  US: "United States", CA: "Canada", GB: "United Kingdom", DE: "Germany", FR: "France", NL: "Netherlands",
  ES: "Spain", IT: "Italy", AU: "Australia", BR: "Brazil", JP: "Japan", KE: "Kenya", ZA: "South Africa",
  IN: "India", MX: "Mexico", SE: "Sweden", PL: "Poland", SG: "Singapore",
};

const US: [string, string, string][] = [
  ["Alabama","Birmingham","35203"],["Alaska","Anchorage","99501"],["Arizona","Phoenix","85004"],["Arkansas","Little Rock","72201"],
  ["California","Los Angeles","90012"],["Colorado","Denver","80205"],["Connecticut","Hartford","06103"],["Delaware","Wilmington","19801"],
  ["Florida","Miami","33130"],["Georgia","Atlanta","30303"],["Hawaii","Honolulu","96813"],["Idaho","Boise","83702"],
  ["Illinois","Chicago","60601"],["Indiana","Indianapolis","46204"],["Iowa","Des Moines","50309"],["Kansas","Wichita","67202"],
  ["Kentucky","Louisville","40202"],["Louisiana","New Orleans","70112"],["Maine","Portland","04101"],["Maryland","Baltimore","21202"],
  ["Massachusetts","Boston","02108"],["Michigan","Detroit","48226"],["Minnesota","Minneapolis","55401"],["Mississippi","Jackson","39201"],
  ["Missouri","Kansas City","64105"],["Montana","Billings","59101"],["Nebraska","Omaha","68102"],["Nevada","Las Vegas","89101"],
  ["New Hampshire","Manchester","03101"],["New Jersey","Newark","07102"],["New Mexico","Albuquerque","87102"],["New York","New York","10001"],
  ["North Carolina","Charlotte","28202"],["North Dakota","Fargo","58102"],["Ohio","Columbus","43215"],["Oklahoma","Tulsa","74103"],
  ["Oregon","Portland","97204"],["Pennsylvania","Philadelphia","19102"],["Rhode Island","Providence","02903"],["South Carolina","Columbia","29201"],
  ["South Dakota","Sioux Falls","57104"],["Tennessee","Nashville","37203"],["Texas","Houston","77002"],["Utah","Salt Lake City","84101"],
  ["Vermont","Burlington","05401"],["Virginia","Richmond","23219"],["Washington","Seattle","98101"],["West Virginia","Charleston","25301"],
  ["Wisconsin","Milwaukee","53202"],["Wyoming","Cheyenne","82001"],
];
const US_ISP = ["AT&T Enterprises, LLC", "Comcast Cable", "Charter Communications", "Verizon Business", "T-Mobile USA, Inc.", "CenturyLink", "Cox Communications", "Frontier Communications"];

const INTL: [string, string, string, string, string[]][] = [
  ["CA","Ontario","Toronto","M5H",["Rogers","Bell Canada"]],["CA","Quebec","Montreal","H2Y",["Videotron","Bell Canada"]],
  ["GB","England","London","EC1A",["BT","Virgin Media"]],["GB","Scotland","Glasgow","G1",["Sky Broadband","BT"]],
  ["DE","Berlin","Berlin","10115",["Deutsche Telekom","Vodafone DE"]],["DE","Bavaria","Munich","80331",["O2 Germany","Deutsche Telekom"]],
  ["FR","Île-de-France","Paris","75001",["Orange","Free SAS"]],["FR","Provence","Marseille","13001",["SFR","Bouygues"]],
  ["NL","North Holland","Amsterdam","1012",["KPN","Ziggo"]],["ES","Madrid","Madrid","28001",["Telefónica","Orange ES"]],
  ["IT","Lazio","Rome","00184",["TIM","Fastweb"]],["AU","New South Wales","Sydney","2000",["Telstra","Optus"]],
  ["BR","São Paulo","São Paulo","01000",["Vivo","Claro BR"]],["JP","Tokyo","Tokyo","100-0001",["NTT","SoftBank"]],
  ["KE","Nairobi","Nairobi","00100",["Safaricom","Airtel Kenya"]],["ZA","Gauteng","Johannesburg","2001",["Vodacom","MTN"]],
  ["IN","Maharashtra","Mumbai","400001",["Jio","Airtel India"]],["MX","CDMX","Mexico City","06000",["Telmex","Telcel"]],
  ["SE","Stockholm","Stockholm","111 20",["Telia","Tele2"]],["PL","Masovia","Warsaw","00-001",["Orange PL","Play"]],
  ["SG","Singapore","Singapore","018956",["Singtel","StarHub"]],
];

// Deterministic pseudo-random so the list is stable between renders.
let seed = 7;
const rnd = (n: number) => { seed = (seed * 9301 + 49297) % 233280; return Math.floor((seed / 233280) * n); };

const out: Proxy[] = [];
const push = (country: string, region: string, city: string, zip: string, isp: string) => {
  const type: Proxy["type"] = rnd(3) === 0 ? "Mobile" : "Residential";
  out.push({
    id: String(out.length), ip: `${20 + rnd(200)}.${rnd(255)}.xxx.***`, country, city, region, isp, zip,
    speed: 80 + rnd(900), type, protocol: rnd(4) === 0 ? "TCP" : "UDP", price: type === "Mobile" ? 2.03 : 2.7,
  });
};
for (const [state, city, zip] of US) for (let i = 0; i < 6; i++) push("US", state, city, zip, US_ISP[rnd(US_ISP.length)]!);
for (const [c, region, city, zip, isps] of INTL) for (let i = 0; i < 5; i++) push(c, region, city, zip, isps[rnd(isps.length)]!);

export const MOCK_PROXIES = out;
