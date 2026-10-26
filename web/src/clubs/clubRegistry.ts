export interface Club { id:string; name:string; shortName:string; primary:string; secondary:string; plClubId:number; sourceUrl:string; sourceSha256:string; sourceHexTokens:string[]; notes:string[]; }
/** Official-asset-derived UI palette, NOT exact kit/brand-manual specifications. */
export const membershipSource = "https://www.premierleague.com/en/news/4365156";
export const kitReference = "https://www.premierleague.com/en/news/4672981";
export const clubs: readonly Club[] = [
  {
    "id": "bournemouth",
    "name": "AFC Bournemouth",
    "shortName": "BOU",
    "plClubId": 91,
    "primary": "#E20613",
    "secondary": "#1D1D1B",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/91.svg",
    "sourceSha256": "3815981d1993309836ba0ef09cad8bda57becd61530e6449ffad14ca08c89d43",
    "sourceHexTokens": [
      "#1D1D1B",
      "#881002",
      "#B3A06E",
      "#E20613",
      "#FFE9CF",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "arsenal",
    "name": "Arsenal",
    "shortName": "ARS",
    "plClubId": 3,
    "primary": "#E20613",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/3.svg",
    "sourceSha256": "34846859662c2f27d51e0880d82998cbe15edbaaf265df191e18a050cb8b6216",
    "sourceHexTokens": [
      "#000000",
      "#003671",
      "#A1853E",
      "#CA0538",
      "#E20613",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "aston-villa",
    "name": "Aston Villa",
    "shortName": "AVL",
    "plClubId": 7,
    "primary": "#480024",
    "secondary": "#94BEE5",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/7.svg",
    "sourceSha256": "7f3c149342283f285bceb557eb94c47a8e0f0cfc8b0e25cccf3c3478cd690d52",
    "sourceHexTokens": [
      "#480024",
      "#7496BD",
      "#7CA3C9",
      "#94BEE5",
      "#F0F0F0",
      "#FFE505",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "brentford",
    "name": "Brentford",
    "shortName": "BRE",
    "plClubId": 94,
    "primary": "#D20000",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/94.svg",
    "sourceSha256": "f785147e395b80f9f63f1d8015a70cc39978c208745a585fa5c8dd23aed68045",
    "sourceHexTokens": [
      "#0F0F0F",
      "#D20000",
      "#E5E5E5",
      "#FFB400",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "brighton",
    "name": "Brighton & Hove Albion",
    "shortName": "BHA",
    "plClubId": 36,
    "primary": "#004899",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/36.svg",
    "sourceSha256": "4a101c7a33dd2b68d7eeb874e2d3a8a44a1b32a63fe9c3a592d8868dc434f53b",
    "sourceHexTokens": [
      "#004899",
      "#FFAB00",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "chelsea",
    "name": "Chelsea",
    "shortName": "CHE",
    "plClubId": 8,
    "primary": "#051496",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/8.svg",
    "sourceSha256": "df2d05a2a2b7a83396dc408ef5b8afa1c61a70d92134a01d4ed366073a50c9f5",
    "sourceHexTokens": [
      "#051496",
      "#FBB700",
      "#FF3939",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "coventry",
    "name": "Coventry City",
    "shortName": "COV",
    "plClubId": 9,
    "primary": "#069EDB",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/9.svg",
    "sourceSha256": "24a0fdc400f20bb7a2c3b67742b4c72e81b67b24602a69b10b18a10edc03a733",
    "sourceHexTokens": [
      "#ED1C24",
      "#FFFFFF"
    ],
    "notes": [
      "Primary #069EDB was measured as the dominant saturated opaque colour in embedded badge raster pixels; it is not visible as an SVG hex token."
    ]
  },
  {
    "id": "crystal-palace",
    "name": "Crystal Palace",
    "shortName": "CRY",
    "plClubId": 31,
    "primary": "#0055A5",
    "secondary": "#EE2E24",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/31.svg",
    "sourceSha256": "e40fc09ca61fa76545c4bd0c99acc6fc7d3f7339ca1d5344a76dc68cb803be7f",
    "sourceHexTokens": [
      "#0055A5",
      "#B17F4A",
      "#B7B7B7",
      "#B9B8B8",
      "#E4E4E4",
      "#EE2E24",
      "#F6F6F6",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "everton",
    "name": "Everton",
    "shortName": "EVE",
    "plClubId": 11,
    "primary": "#00019E",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/11.svg",
    "sourceSha256": "40a0fb8285317d6b3f3a34e9a6d9b0f2a5eb3226993e65a500748c4e9483decc",
    "sourceHexTokens": [
      "#00019E",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "fulham",
    "name": "Fulham",
    "shortName": "FUL",
    "plClubId": 54,
    "primary": "#FAFCF3",
    "secondary": "#0D0802",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/54.svg",
    "sourceSha256": "8686cfca58f1bd2243bc55bc96a5886d2850188efe83df1835003595aed75956",
    "sourceHexTokens": [
      "#0D0802",
      "#E5231B",
      "#FAFCF3",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "hull",
    "name": "Hull City",
    "shortName": "HUL",
    "plClubId": 88,
    "primary": "#F18A00",
    "secondary": "#101820",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/88.svg",
    "sourceSha256": "eedc6ee0f255653ad2e9e5cfdbafae3fcae93fe7108438478f830f6904cf5668",
    "sourceHexTokens": [
      "#101820",
      "#E46E0B",
      "#F18A00",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "ipswich",
    "name": "Ipswich Town",
    "shortName": "IPS",
    "plClubId": 40,
    "primary": "#004694",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/40.svg",
    "sourceSha256": "ad9bea65d13a4311d0f9a4e4a60e8ec9769ddd360968386e9fda2c03ae8b608a",
    "sourceHexTokens": [
      "#004694",
      "#ED1C2E",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "leeds",
    "name": "Leeds United",
    "shortName": "LEE",
    "plClubId": 2,
    "primary": "#FFFFFF",
    "secondary": "#0058A2",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/2.svg",
    "sourceSha256": "55cf765eb2bd722f35a5fa5714a55f90912222d96dc9ef0c24ab7fbb33fa7c0c",
    "sourceHexTokens": [
      "#0058A2",
      "#FFDF00"
    ],
    "notes": [
      "Primary white is a neutral UI treatment; confirm the home-kit colour role against the official PL kit gallery before presenting it as a kit swatch."
    ]
  },
  {
    "id": "liverpool",
    "name": "Liverpool",
    "shortName": "LIV",
    "plClubId": 14,
    "primary": "#DC0714",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges/14.svg",
    "sourceSha256": "f975e2d09c688779c3272f5ac770c1772c32475ea77c5fb5c5d39bddc7a1569d",
    "sourceHexTokens": [],
    "notes": [
      "Primary #DC0714 was measured in the opaque pixels of the embedded 896x896 PNG; 112983 opaque pixels had this value in the inspected asset.",
      "Secondary white/black is a neutral UI contrast choice where absent from extracted tokens; do not label it an official brand specification."
    ]
  },
  {
    "id": "manchester-city",
    "name": "Manchester City",
    "shortName": "MCI",
    "plClubId": 43,
    "primary": "#7AB2E1",
    "secondary": "#002A5A",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/43.svg",
    "sourceSha256": "5992dc73d3a29ef6d1e028a1658207b0b77e5afe9221fd14add86b03e3f54c42",
    "sourceHexTokens": [
      "#002A5A",
      "#7AB2E1",
      "#A6C8EA",
      "#DAA500",
      "#E42313",
      "#FDCA50",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "manchester-united",
    "name": "Manchester United",
    "shortName": "MUN",
    "plClubId": 1,
    "primary": "#DA020E",
    "secondary": "#1D1D1B",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/1.svg",
    "sourceSha256": "26a24cef1e79effd71f2ce571b5ac73a847916f53c4d50c60731f669dc32c004",
    "sourceHexTokens": [
      "#000000",
      "#1D1D1B",
      "#740703",
      "#8F0904",
      "#B40509",
      "#B54005",
      "#DA020E",
      "#DA030E",
      "#E15007",
      "#FFE500"
    ],
    "notes": []
  },
  {
    "id": "newcastle",
    "name": "Newcastle United",
    "shortName": "NEW",
    "plClubId": 4,
    "primary": "#000000",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/4.svg",
    "sourceSha256": "e3f2b9ebc9aade4d599ac4ad30ddaa2a3d1a942f4185472562685a4e659fa9e0",
    "sourceHexTokens": [
      "#56C6F0",
      "#CDB479",
      "#D5D7D7",
      "#F23B29",
      "#FFFFFF"
    ],
    "notes": [
      "Black is the standalone SVG default fill; white is explicit. Use black/white club identity with outlines for legibility."
    ]
  },
  {
    "id": "nottingham-forest",
    "name": "Nottingham Forest",
    "shortName": "NFO",
    "plClubId": 17,
    "primary": "#DC0D15",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges/17.svg",
    "sourceSha256": "e41816f33ffd022687ce517d9dd42040e13b54b96d813754ae6376fe0b190e8c",
    "sourceHexTokens": [
      "#DC0D15"
    ],
    "notes": [
      "Secondary white/black is a neutral UI contrast choice where absent from extracted tokens; do not label it an official brand specification."
    ]
  },
  {
    "id": "sunderland",
    "name": "Sunderland",
    "shortName": "SUN",
    "plClubId": 56,
    "primary": "#E40520",
    "secondary": "#FFFFFF",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges-alt/56.svg",
    "sourceSha256": "1ed05c0fb1391f1dfcfe60440b17d1bd18f1b7c75d25dd72035946448b918992",
    "sourceHexTokens": [
      "#1D1D1B",
      "#B39A3B",
      "#DBCB9A",
      "#E40520",
      "#FFFFFF"
    ],
    "notes": []
  },
  {
    "id": "tottenham",
    "name": "Tottenham Hotspur",
    "shortName": "TOT",
    "plClubId": 6,
    "primary": "#FFFFFF",
    "secondary": "#000A3C",
    "sourceUrl": "https://resources.premierleague.com/premierleague25/badges/6.svg",
    "sourceSha256": "c8a0623aeba5feffbcb56cb9d7603c949e00546095cee7a72d8042623673cb54",
    "sourceHexTokens": [
      "#000A3C",
      "#FFFFFF"
    ],
    "notes": []
  }
];
export function contrast(a:string,b:string) { const l=(c:string)=>{ const x=c.slice(1).match(/../g)!.map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*x[0]+.7152*x[1]+.0722*x[2] }; const x=l(a),y=l(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) }
export const inkFor=(fill:string)=>contrast(fill,"#FFFFFF")>=contrast(fill,"#000000")?"#FFFFFF":"#000000";
