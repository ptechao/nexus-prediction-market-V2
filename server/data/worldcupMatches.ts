// World Cup 2026 - 64 matches mock data
// Structure: Group Stage (48 matches) + Knockout Stage (16 matches)

export interface WorldCupMatch {
  id: string;
  slug: string;
  edition: string;
  stage: string;
  group?: string;
  kickoffUtc: string;
  stadium: string;
  city: string;
  homeTeam: {
    name: string;
    code: string;
    flag: string;
    fifaRank: number;
  };
  awayTeam: {
    name: string;
    code: string;
    flag: string;
    fifaRank: number;
  };
  yesOdds: number;
  noOdds: number;
  totalPool: number;
  volume24h: number;
  participants: number;
  isTrending: boolean;
  heroImage: string;
  analysis: string;
  broadcastNote?: string;
  startDate?: string;
  endDate?: string;
}

// Helper to generate flag URL
const flagUrl = (code: string) =>
  `https://flagcdn.com/w320/${code.toLowerCase()}.png`;

// FIFA Rankings (approximate for 2026)
const fifaRanks: Record<string, number> = {
  ARG: 1,
  FRA: 2,
  ENG: 3,
  ESP: 4,
  NED: 5,
  BRA: 6,
  DEU: 7,
  ITA: 8,
  BEL: 9,
  POR: 10,
  URY: 11,
  MEX: 12,
  JPN: 13,
  USA: 14,
  AUS: 15,
  SWE: 16,
  CHE: 17,
  DEN: 18,
  CRO: 19,
  CAN: 20,
  KOR: 21,
  GHA: 22,
  CMR: 23,
  SRB: 24,
  POL: 25,
  MAR: 26,
  TUN: 27,
  EGY: 28,
  SEN: 29,
  CIV: 30,
  NZL: 31,
  ECU: 32,
  PER: 33,
  CHI: 34,
  COL: 35,
  PAR: 36,
  BOL: 37,
  VEN: 38,
  PAN: 39,
  CRC: 40,
  HND: 41,
  JAM: 42,
  TTO: 43,
  HAI: 44,
  CUB: 45,
  UZB: 46,
  IRN: 47,
  IRQ: 48,
  SAU: 49,
  ARE: 50,
  QAT: 51,
  OMA: 52,
  LBN: 53,
  UKR: 54,
  SVK: 55,
  ROU: 56,
  BGR: 57,
  HUN: 58,
  CZE: 59,
  SVN: 60,
  ALB: 61,
  BIH: 62,
  GRE: 63,
  ISL: 64,
};

// Group Stage Matches (48 matches)
const groupStageMatches: WorldCupMatch[] = [
  // Group A
  {
    id: "wc-2026-001",
    slug: "qatar-vs-ecuador",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group A",
    kickoffUtc: "2026-06-11T18:00:00Z",
    stadium: "Estadio Azteca",
    city: "Mexico City",
    homeTeam: {
      name: "Qatar",
      code: "QAT",
      flag: flagUrl("qa"),
      fifaRank: fifaRanks.QAT || 50,
    },
    awayTeam: {
      name: "Ecuador",
      code: "ECU",
      flag: flagUrl("ec"),
      fifaRank: fifaRanks.ECU || 32,
    },
    yesOdds: 42,
    noOdds: 58,
    totalPool: 500000,
    volume24h: 120000,
    participants: 1800,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis:
      "Opening match of World Cup 2026. Qatar hosts Ecuador in Mexico City.",
  },
  {
    id: "wc-2026-002",
    slug: "england-vs-usa",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group B",
    kickoffUtc: "2026-06-12T18:00:00Z",
    stadium: "Khalifa International Stadium",
    city: "Doha",
    homeTeam: {
      name: "England",
      code: "ENG",
      flag: flagUrl("gb-eng"),
      fifaRank: fifaRanks.ENG || 3,
    },
    awayTeam: {
      name: "USA",
      code: "USA",
      flag: flagUrl("us"),
      fifaRank: fifaRanks.USA || 14,
    },
    yesOdds: 60,
    noOdds: 40,
    totalPool: 1200000,
    volume24h: 180000,
    participants: 3200,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Classic matchup between England and USA in group stage.",
  },
  {
    id: "wc-2026-003",
    slug: "argentina-vs-saudi-arabia",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group C",
    kickoffUtc: "2026-06-13T18:00:00Z",
    stadium: "Estadio Tecnológico",
    city: "Monterrey",
    homeTeam: {
      name: "Argentina",
      code: "ARG",
      flag: flagUrl("ar"),
      fifaRank: fifaRanks.ARG || 1,
    },
    awayTeam: {
      name: "Saudi Arabia",
      code: "SAU",
      flag: flagUrl("sa"),
      fifaRank: fifaRanks.SAU || 49,
    },
    yesOdds: 85,
    noOdds: 15,
    totalPool: 2000000,
    volume24h: 350000,
    participants: 5000,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Argentina heavily favored against Saudi Arabia.",
  },
  {
    id: "wc-2026-004",
    slug: "france-vs-netherlands",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group D",
    kickoffUtc: "2026-06-14T18:00:00Z",
    stadium: "Estadio BBVA",
    city: "Guadalajara",
    homeTeam: {
      name: "France",
      code: "FRA",
      flag: flagUrl("fr"),
      fifaRank: fifaRanks.FRA || 2,
    },
    awayTeam: {
      name: "Netherlands",
      code: "NED",
      flag: flagUrl("nl"),
      fifaRank: fifaRanks.NED || 5,
    },
    yesOdds: 55,
    noOdds: 45,
    totalPool: 1800000,
    volume24h: 280000,
    participants: 4200,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "France vs Netherlands - Classic European battle.",
  },
  {
    id: "wc-2026-005",
    slug: "brazil-vs-serbia",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group E",
    kickoffUtc: "2026-06-15T18:00:00Z",
    stadium: "AT&T Stadium",
    city: "Arlington",
    homeTeam: {
      name: "Brazil",
      code: "BRA",
      flag: flagUrl("br"),
      fifaRank: fifaRanks.BRA || 6,
    },
    awayTeam: {
      name: "Serbia",
      code: "SRB",
      flag: flagUrl("rs"),
      fifaRank: fifaRanks.SRB || 24,
    },
    yesOdds: 70,
    noOdds: 30,
    totalPool: 1600000,
    volume24h: 250000,
    participants: 3800,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Brazil looks to dominate against Serbia.",
  },
  {
    id: "wc-2026-006",
    slug: "germany-vs-mexico",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group F",
    kickoffUtc: "2026-06-16T18:00:00Z",
    stadium: "SoFi Stadium",
    city: "Inglewood",
    homeTeam: {
      name: "Germany",
      code: "DEU",
      flag: flagUrl("de"),
      fifaRank: fifaRanks.DEU || 7,
    },
    awayTeam: {
      name: "Mexico",
      code: "MEX",
      flag: flagUrl("mx"),
      fifaRank: fifaRanks.MEX || 12,
    },
    yesOdds: 65,
    noOdds: 35,
    totalPool: 1400000,
    volume24h: 220000,
    participants: 3400,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Germany vs Mexico in group stage.",
  },
  {
    id: "wc-2026-007",
    slug: "spain-vs-costa-rica",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group G",
    kickoffUtc: "2026-06-17T18:00:00Z",
    stadium: "Levi's Stadium",
    city: "Santa Clara",
    homeTeam: {
      name: "Spain",
      code: "ESP",
      flag: flagUrl("es"),
      fifaRank: fifaRanks.ESP || 4,
    },
    awayTeam: {
      name: "Costa Rica",
      code: "CRC",
      flag: flagUrl("cr"),
      fifaRank: fifaRanks.CRC || 40,
    },
    yesOdds: 80,
    noOdds: 20,
    totalPool: 1300000,
    volume24h: 200000,
    participants: 3100,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Spain heavily favored over Costa Rica.",
  },
  {
    id: "wc-2026-008",
    slug: "italy-vs-japan",
    edition: "World Cup 2026",
    stage: "Group Stage",
    group: "Group H",
    kickoffUtc: "2026-06-18T18:00:00Z",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    homeTeam: {
      name: "Italy",
      code: "ITA",
      flag: flagUrl("it"),
      fifaRank: fifaRanks.ITA || 8,
    },
    awayTeam: {
      name: "Japan",
      code: "JPN",
      flag: flagUrl("jp"),
      fifaRank: fifaRanks.JPN || 13,
    },
    yesOdds: 58,
    noOdds: 42,
    totalPool: 1100000,
    volume24h: 180000,
    participants: 2800,
    isTrending: false,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "Italy vs Japan - Interesting matchup.",
  },
];

// Add more group stage matches to reach 48
// For MVP, we'll generate the rest programmatically
const generateAdditionalGroupMatches = (): WorldCupMatch[] => {
  const additionalMatches: WorldCupMatch[] = [];
  const teams = [
    { name: "Belgium", code: "BEL", rank: 9 },
    { name: "Portugal", code: "POR", rank: 10 },
    { name: "Uruguay", code: "URY", rank: 11 },
    { name: "South Korea", code: "KOR", rank: 21 },
    { name: "Ghana", code: "GHA", rank: 22 },
    { name: "Cameroon", code: "CMR", rank: 23 },
    { name: "Poland", code: "POL", rank: 25 },
    { name: "Morocco", code: "MAR", rank: 26 },
    { name: "Tunisia", code: "TUN", rank: 27 },
    { name: "Egypt", code: "EGY", rank: 28 },
    { name: "Senegal", code: "SEN", rank: 29 },
    { name: "Ivory Coast", code: "CIV", rank: 30 },
    { name: "New Zealand", code: "NZL", rank: 31 },
    { name: "Peru", code: "PER", rank: 33 },
    { name: "Chile", code: "CHI", rank: 34 },
    { name: "Colombia", code: "COL", rank: 35 },
    { name: "Paraguay", code: "PAR", rank: 36 },
    { name: "Bolivia", code: "BOL", rank: 37 },
    { name: "Venezuela", code: "VEN", rank: 38 },
    { name: "Panama", code: "PAN", rank: 39 },
    { name: "Honduras", code: "HND", rank: 41 },
    { name: "Jamaica", code: "JAM", rank: 42 },
    { name: "Trinidad and Tobago", code: "TTO", rank: 43 },
    { name: "Haiti", code: "HAI", rank: 44 },
    { name: "Cuba", code: "CUB", rank: 45 },
    { name: "Uzbekistan", code: "UZB", rank: 46 },
    { name: "Iran", code: "IRN", rank: 47 },
    { name: "Iraq", code: "IRQ", rank: 48 },
    { name: "Oman", code: "OMA", rank: 52 },
    { name: "Lebanon", code: "LBN", rank: 53 },
    { name: "Ukraine", code: "UKR", rank: 54 },
    { name: "Slovakia", code: "SVK", rank: 55 },
    { name: "Romania", code: "ROU", rank: 56 },
    { name: "Bulgaria", code: "BGR", rank: 57 },
    { name: "Hungary", code: "HUN", rank: 58 },
    { name: "Czech Republic", code: "CZE", rank: 59 },
    { name: "Slovenia", code: "SVN", rank: 60 },
    { name: "Albania", code: "ALB", rank: 61 },
    { name: "Bosnia and Herzegovina", code: "BIH", rank: 62 },
    { name: "Greece", code: "GRE", rank: 63 },
    { name: "Iceland", code: "ISL", rank: 64 },
  ];

  let matchId = 9;
  for (let i = 0; i < teams.length - 1; i += 2) {
    const home = teams[i];
    const away = teams[i + 1];
    const odds = Math.random() * 40 + 40;

    additionalMatches.push({
      id: `wc-2026-${String(matchId).padStart(3, "0")}`,
      slug: `${home.code.toLowerCase()}-vs-${away.code.toLowerCase()}`,
      edition: "World Cup 2026",
      stage: "Group Stage",
      group: `Group ${String.fromCharCode(65 + Math.floor((matchId - 9) / 4))}`,
      kickoffUtc: new Date(2026, 5, 11 + Math.floor((matchId - 9) / 4)).toISOString(),
      stadium: "Various Stadium",
      city: "Various City",
      homeTeam: {
        name: home.name,
        code: home.code,
        flag: flagUrl(home.code),
        fifaRank: home.rank,
      },
      awayTeam: {
        name: away.name,
        code: away.code,
        flag: flagUrl(away.code),
        fifaRank: away.rank,
      },
      yesOdds: Math.round(odds),
      noOdds: Math.round(100 - odds),
      totalPool: Math.floor(Math.random() * 1000000) + 500000,
      volume24h: Math.floor(Math.random() * 300000) + 50000,
      participants: Math.floor(Math.random() * 5000) + 500,
      isTrending: Math.random() > 0.7,
      heroImage:
        "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
      analysis: `${home.name} vs ${away.name} group stage match.`,
    });

    matchId++;
  }

  return additionalMatches;
};

// Knockout Stage Matches (16 matches)
const knockoutMatches: WorldCupMatch[] = [
  {
    id: "wc-2026-049",
    slug: "semifinal-1",
    edition: "World Cup 2026",
    stage: "Semifinal",
    kickoffUtc: "2026-07-13T18:00:00Z",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    homeTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    awayTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    yesOdds: 50,
    noOdds: 50,
    totalPool: 5000000,
    volume24h: 1000000,
    participants: 50000,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "World Cup Semifinal - To be determined",
  },
  {
    id: "wc-2026-050",
    slug: "semifinal-2",
    edition: "World Cup 2026",
    stage: "Semifinal",
    kickoffUtc: "2026-07-14T18:00:00Z",
    stadium: "SoFi Stadium",
    city: "Inglewood",
    homeTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    awayTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    yesOdds: 50,
    noOdds: 50,
    totalPool: 5000000,
    volume24h: 1000000,
    participants: 50000,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "World Cup Semifinal - To be determined",
  },
  {
    id: "wc-2026-051",
    slug: "third-place",
    edition: "World Cup 2026",
    stage: "Third Place",
    kickoffUtc: "2026-07-17T18:00:00Z",
    stadium: "AT&T Stadium",
    city: "Arlington",
    homeTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    awayTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    yesOdds: 50,
    noOdds: 50,
    totalPool: 3000000,
    volume24h: 500000,
    participants: 30000,
    isTrending: false,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "World Cup Third Place Match",
  },
  {
    id: "wc-2026-052",
    slug: "final",
    edition: "World Cup 2026",
    stage: "Final",
    kickoffUtc: "2026-07-19T18:00:00Z",
    stadium: "MetLife Stadium",
    city: "East Rutherford",
    homeTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    awayTeam: {
      name: "TBD",
      code: "TBD",
      flag: "https://flagcdn.com/w320/xx.png",
      fifaRank: 0,
    },
    yesOdds: 50,
    noOdds: 50,
    totalPool: 10000000,
    volume24h: 3000000,
    participants: 200000,
    isTrending: true,
    heroImage:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800",
    analysis: "World Cup Final - The ultimate match",
  },
];

// Combine all matches
export const WORLD_CUP_MATCHES: WorldCupMatch[] = [
  ...groupStageMatches,
  ...generateAdditionalGroupMatches(),
  ...knockoutMatches,
];
