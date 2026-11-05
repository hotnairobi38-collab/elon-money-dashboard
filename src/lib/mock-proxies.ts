// TEMPORARY sample data until the proxy provider API is connected.
export type Proxy = {
  id: string; ip: string; country: string; city: string; region: string; isp: string;
  zip: string; speed: number; type: "Residential" | "Mobile"; protocol: "UDP" | "TCP"; price: number;
};

const rows: [string, string, string, string, string, number, Proxy["type"]][] = [
  ["99.140", "Gresham", "Oregon", "AT&T Enterprises, LLC", "97080", 653, "Mobile"],
  ["107.193", "Flowery Branch", "Georgia", "AT&T Enterprises, LLC", "30542", 183, "Residential"],
  ["69.174", "Crosslake", "Minnesota", "Emily Cooperative Telephone Company", "56442", 867, "Residential"],
  ["71.33", "Denver", "Colorado", "CenturyLink", "80205", 666, "Residential"],
  ["71.93", "Whittier", "California", "Charter Communications", "90603", 314, "Residential"],
  ["172.59", "Dallas", "Texas", "T-Mobile USA, Inc.", "75243", 380, "Mobile"],
  ["47.224", "Saginaw", "Michigan", "Charter Communications", "48602", 530, "Residential"],
  ["68.204", "Kissimmee", "Florida", "Charter Communications", "34758", 700, "Residential"],
  ["97.243", "Mundelein", "Illinois", "Verizon Business", "60060", 112, "Mobile"],
  ["47.151", "Beaumont", "California", "Frontier Communications Corporation", "92223", 921, "Residential"],
  ["75.166", "Denver", "Colorado", "CenturyLink Communications, LLC", "80227", 227, "Residential"],
  ["24.30", "New York", "New York", "Spectrum", "10001", 455, "Residential"],
  ["73.12", "Seattle", "Washington", "Comcast Cable", "98101", 590, "Residential"],
  ["174.204", "Phoenix", "Arizona", "Verizon Wireless", "85004", 240, "Mobile"],
  ["98.156", "Atlanta", "Georgia", "Comcast Cable", "30303", 812, "Residential"],
  ["66.87", "Austin", "Texas", "AT&T Services, Inc.", "78701", 375, "Residential"],
];

export const MOCK_PROXIES: Proxy[] = rows.map(([ip, city, region, isp, zip, speed, type], i) => ({
  id: String(i), ip: `${ip}.xxx.***`, country: "US", city, region, isp, zip, speed, type,
  protocol: "UDP", price: type === "Mobile" ? 2.03 : 2.7,
}));
