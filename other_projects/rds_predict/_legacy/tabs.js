// ═══════════════════════════════════════════════════════════
//  tabs.js  —  Standings · Live · Calendar · Telemetry
//  Data sources: rdsgp.com — RDS GP 2024, 2025 (final), 2026 (live)
//  script.js is NOT modified. This file only adds new tabs.
// ═══════════════════════════════════════════════════════════

// ─── 2024 FINAL STANDINGS ────────────────────────────────────
// Source: rdsgp.com/results/rdsgp2024 — Full season, top-20
const STANDINGS_2024 = [
  { id:'shabanov',      name:'Артём Шабанов',         num:'77',  team:'Shabanov MS',      avatar:'https://rdsgp.com/images/s234350/pilots/174561453349920.jpg',  pts:1273, wins:2 },
  { id:'idiyatulin',   name:'Дамир Идиятулин',        num:'9',   team:'Idiyatulin RT',    avatar:'https://rdsgp.com/images/s234350/pilots/174561341117688.jpg',  pts:1125, wins:1 },
  { id:'tsaregradtsev',name:'Аркадий Цареградцев',    num:'88',  team:'Garage 54',        avatar:'https://rdsgp.com/images/s234350/pilots/174561446468241.jpg',  pts:864,  wins:0 },
  { id:'chivchyan',    name:'Георгий Чивчян',          num:'31',  team:'Chivchyan Racing', avatar:'https://rdsgp.com/images/s234350/pilots/174561449636535.jpg',  pts:855,  wins:1 },
  { id:'losev',        name:'Евгений Лосев',           num:'81',  team:'Losev Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561380192839.jpg',  pts:711,  wins:0 },
  { id:'gusev',        name:'Григорий Гусев',          num:'21',  team:'Gusev RT',         avatar:'https://rdsgp.com/images/s240000/pilots/gusev.jpg',           pts:505,  wins:1 },
  { id:'grossman',     name:'Максим Гроссман',         num:'44',  team:'Grossman Squad',   avatar:'https://rdsgp.com/images/s234350/pilots/174561306566849.jpg',  pts:488,  wins:0 },
  { id:'kuznetsov',    name:'Сергей Кузнецов',         num:'36',  team:'Kuznetsov Racing', avatar:'https://rdsgp.com/images/s234350/pilots/174561373126096.jpg',  pts:359,  wins:0 },
  { id:'tivodar',      name:'Роман Тиводар',           num:'6',   team:'Tivodar RT',       avatar:'https://rdsgp.com/images/s234350/pilots/174561432427756.jpg',  pts:346,  wins:0 },
  { id:'popov_i',      name:'Илья Попов',              num:'22',  team:'Popov Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561408629651.jpg',  pts:325,  wins:0 },
  { id:'astapov',      name:'Андрей Астапов',          num:'8',   team:'Astapov Racing',   avatar:'https://rdsgp.com/images/s234350/pilots/174561262667848.jpg',  pts:320,  wins:0 },
  { id:'shnayder',     name:'Леонид Шнайдер',          num:'7',   team:'Shnayder MS',      avatar:'https://rdsgp.com/images/s234350/pilots/174561458551821.jpg',  pts:292,  wins:0 },
  { id:'dobrovolsky',  name:'Тимофей Добровольский',  num:'19',  team:'TD Motorsport',    avatar:'https://rdsgp.com/images/s234350/pilots/17456131857324.jpg',   pts:246,  wins:0 },
  { id:'kozlov_a',     name:'Антон Козлов',            num:'73',  team:'Team K73',         avatar:'https://rdsgp.com/images/s234350/pilots/174561358894696.jpg',  pts:237,  wins:0 },
  { id:'popov_v',      name:'Владислав Попов',         num:'11',  team:'VP Racing',        avatar:'https://rdsgp.com/images/s234350/pilots/174561408629652.jpg',  pts:228,  wins:0 },
  { id:'migal',        name:'Денис Мигаль',            num:'33',  team:'Migal Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561388917349.jpg',  pts:177,  wins:0 },
  { id:'sak',          name:'Сергей Сак',              num:'71',  team:'Sak Motorsport',   avatar:'https://rdsgp.com/images/s234350/pilots/174561416966550.jpg',  pts:153,  wins:0 },
  { id:'matskevich',   name:'Кирилл Мацкевич',        num:'80',  team:'Matskevich RT',    avatar:'https://rdsgp.com/images/s234350/pilots/174561385222726.jpg',  pts:2,    wins:0 },
  { id:'kozlov_al',    name:'Алексей Козлов',          num:'171', team:'AK Racing',        avatar:'https://rdsgp.com/images/s234350/pilots/174561356651716.jpg',  pts:72,   wins:0 },
  { id:'kliamko',      name:'Антон Клямко',            num:'53',  team:'Kliamko RT',       avatar:'https://rdsgp.com/images/s234350/pilots/174561354112537.jpg',  pts:198,  wins:0 },
];

// ─── 2025 FINAL STANDINGS ────────────────────────────────────
// Source: rdsgp.com/results/rds2025 — Full season, top-20
const STANDINGS_2025 = [
  { id:'tsaregradtsev',name:'Аркадий Цареградцев',    num:'88',  team:'Garage 54',        avatar:'https://rdsgp.com/images/s234350/pilots/174561446468241.jpg',  pts:1032, wins:2 },
  { id:'chivchyan',    name:'Георгий Чивчян',          num:'31',  team:'Chivchyan Racing', avatar:'https://rdsgp.com/images/s234350/pilots/174561449636535.jpg',  pts:922,  wins:1 },
  { id:'shabanov',     name:'Артём Шабанов',           num:'77',  team:'Shabanov MS',      avatar:'https://rdsgp.com/images/s234350/pilots/174561453349920.jpg',  pts:831,  wins:2 },
  { id:'idiyatulin',   name:'Дамир Идиятулин',         num:'9',   team:'Idiyatulin RT',    avatar:'https://rdsgp.com/images/s234350/pilots/174561341117688.jpg',  pts:744,  wins:1 },
  { id:'kozlov_a',     name:'Антон Козлов',            num:'73',  team:'Team K73',         avatar:'https://rdsgp.com/images/s234350/pilots/174561358894696.jpg',  pts:664,  wins:1 },
  { id:'dobrovolsky',  name:'Тимофей Добровольский',  num:'19',  team:'TD Motorsport',    avatar:'https://rdsgp.com/images/s234350/pilots/17456131857324.jpg',   pts:572,  wins:1 },
  { id:'losev',        name:'Евгений Лосев',           num:'81',  team:'Losev Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561380192839.jpg',  pts:501,  wins:0 },
  { id:'grossman',     name:'Максим Гроссман',         num:'44',  team:'Grossman Squad',   avatar:'https://rdsgp.com/images/s234350/pilots/174561306566849.jpg',  pts:486,  wins:0 },
  { id:'tivodar',      name:'Роман Тиводар',           num:'6',   team:'Tivodar RT',       avatar:'https://rdsgp.com/images/s234350/pilots/174561432427756.jpg',  pts:434,  wins:0 },
  { id:'popov_i',      name:'Илья Попов',              num:'22',  team:'Popov Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561408629651.jpg',  pts:389,  wins:0 },
  { id:'shnayder',     name:'Леонид Шнайдер',          num:'7',   team:'Shnayder MS',      avatar:'https://rdsgp.com/images/s234350/pilots/174561458551821.jpg',  pts:370,  wins:0 },
  { id:'skorobogatov', name:'Данила Скоробогатов',    num:'70',  team:'Skorobogatov RT',  avatar:'https://rdsgp.com/images/s234350/pilots/17456142288374.jpg',   pts:342,  wins:0 },
  { id:'astapov',      name:'Андрей Астапов',          num:'8',   team:'Astapov Racing',   avatar:'https://rdsgp.com/images/s234350/pilots/174561262667848.jpg',  pts:318,  wins:0 },
  { id:'kliamko',      name:'Антон Клямко',            num:'53',  team:'Kliamko RT',       avatar:'https://rdsgp.com/images/s234350/pilots/174561354112537.jpg',  pts:252,  wins:0 },
  { id:'vorobyev',     name:'Данила Воробьёв',         num:'98',  team:'Vorobyev MS',      avatar:'https://rdsgp.com/images/s234350/pilots/174561293011637.jpg',  pts:228,  wins:0 },
  { id:'migal',        name:'Денис Мигаль',            num:'33',  team:'Migal Racing',     avatar:'https://rdsgp.com/images/s234350/pilots/174561388917349.jpg',  pts:217,  wins:0 },
  { id:'matskevich',   name:'Кирилл Мацкевич',        num:'80',  team:'Matskevich RT',    avatar:'https://rdsgp.com/images/s234350/pilots/174561385222726.jpg',  pts:217,  wins:0 },
  { id:'kuznetsov',    name:'Сергей Кузнецов',         num:'36',  team:'Kuznetsov Racing', avatar:'https://rdsgp.com/images/s234350/pilots/174561373126096.jpg',  pts:207,  wins:0 },
  { id:'sak',          name:'Сергей Сак',              num:'71',  team:'Sak Motorsport',   avatar:'https://rdsgp.com/images/s234350/pilots/174561416966550.jpg',  pts:153,  wins:0 },
  { id:'kozlov_al',    name:'Алексей Козлов',          num:'171', team:'AK Racing',        avatar:'https://rdsgp.com/images/s234350/pilots/174561356651716.jpg',  pts:128,  wins:0 },
];

// Alias used throughout for the default standings view
const STANDINGS_DATA = STANDINGS_2025;

// ─── DETAILED DRIVER STATS (2024–2025) ───────────────────────
const RDS_DRIVER_STATS = {
  1: { // 88 Цареградцев Аркадий
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 88.50, points: 253 }, { name: 'NRING', score: 94.50, points: 33 },
      { name: 'Igora Drive', score: 99.00, points: 52 }, { name: 'ADM Raceway', score: 93.50, points: 38 },
      { name: 'Moscow Raceway', score: 99.00, points: 52 }, { name: 'Красное кольцо', score: 99.00, points: 269 },
      { name: 'Igora Drive', score: 100.00, points: 167 }
    ], totalPoints: 864 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 79.50, points: 1 }, { name: 'Igora Drive', score: 94.00, points: 195 },
      { name: 'NRing', score: 91.00, points: 188 }, { name: 'ADM Raceway', score: 93.00, points: 75 },
      { name: 'Red Ring', score: 96.50, points: 162 }, { name: 'Igora Drive', score: 97.00, points: 272 },
      { name: 'Moscow Raceway', score: 96.50, points: 139 }
    ], totalPoints: 1032 }
  },
  2: { // 31 Чивчян Георгий
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 93.50, points: 42 }, { name: 'NRING', score: 98.50, points: 87 },
      { name: 'Igora Drive', score: 94.00, points: 32 }, { name: 'ADM Raceway', score: 96.00, points: 195 },
      { name: 'Moscow Raceway', score: 98.00, points: 162 }, { name: 'Красное кольцо', score: 99.00, points: 142 },
      { name: 'Igora Drive', score: 99.00, points: 195 }
    ], totalPoints: 855 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 96.50, points: 83 }, { name: 'Igora Drive', score: 89.00, points: 38 },
      { name: 'NRing', score: 89.00, points: 32 }, { name: 'ADM Raceway', score: 94.00, points: 129 },
      { name: 'Red Ring', score: 89.50, points: 182 }, { name: 'Igora Drive', score: 94.50, points: 197 },
      { name: 'Moscow Raceway', score: 94.00, points: 261 }
    ], totalPoints: 922 }
  },
  3: { // 77 Шабанов Артем
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 92.50, points: 154 }, { name: 'NRING', score: 99.00, points: 199 },
      { name: 'Igora Drive', score: 97.00, points: 192 }, { name: 'ADM Raceway', score: 91.00, points: 255 },
      { name: 'Moscow Raceway', score: 96.00, points: 260 }, { name: 'Красное кольцо', score: 94.00, points: 76 },
      { name: 'Igora Drive', score: 99.50, points: 137 }
    ], totalPoints: 1273 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 98.50, points: 269 }, { name: 'Igora Drive', score: 98.00, points: 49 },
      { name: 'NRing', score: 98.00, points: 272 }, { name: 'ADM Raceway', score: 94.50, points: 12 },
      { name: 'Red Ring', score: 95.00, points: 37 }, { name: 'Igora Drive', score: 70.50, points: 32 },
      { name: 'Moscow Raceway', score: 95.50, points: 160 }
    ], totalPoints: 831 }
  },
  4: { // 9 Идиятулин Дамир
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 88.50, points: 2 }, { name: 'NRING', score: 100.00, points: 272 },
      { name: 'Igora Drive', score: 98.50, points: 265 }, { name: 'ADM Raceway', score: 96.00, points: 47 },
      { name: 'Moscow Raceway', score: 94.00, points: 76 }, { name: 'Красное кольцо', score: 98.00, points: 194 },
      { name: 'Igora Drive', score: 99.50, points: 269 }
    ], totalPoints: 1125 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 99.50, points: 52 }, { name: 'Igora Drive', score: 81.00, points: 147 },
      { name: 'NRing', score: 92.00, points: 80 }, { name: 'ADM Raceway', score: 98.00, points: 272 },
      { name: 'Red Ring', score: 95.50, points: 81 }, { name: 'Igora Drive', score: 89.00, points: 80 },
      { name: 'Moscow Raceway', score: 88.50, points: 32 }
    ], totalPoints: 744 }
  },
  5: { // 73 Козлов Антон
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 86.50, points: 2 }, { name: 'NRING', score: 96.50, points: 79 },
      { name: 'Igora Drive', score: 94.50, points: 4 }, { name: 'ADM Raceway', score: 77.50, points: 2 },
      { name: 'Moscow Raceway', score: 94.00, points: 37 }, { name: 'Красное кольцо', score: 94.50, points: 78 },
      { name: 'Igora Drive', score: 93.50, points: 35 }
    ], totalPoints: 237 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 97.00, points: 194 }, { name: 'Igora Drive', score: 88.00, points: 255 },
      { name: 'NRing', score: 90.50, points: 151 }, { name: 'ADM Raceway', score: 97.50, points: 17 },
      { name: 'Red Ring', score: 95.00, points: 40 }, { name: 'Igora Drive', score: 84.00, points: 4 },
      { name: 'Moscow Raceway', score: 91.50, points: 3 }
    ], totalPoints: 664 }
  },
  6: { // 19 Добровольский Тимофей
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 93.50, points: 83 }, { name: 'NRING', score: 96.00, points: 128 },
      { name: 'Igora Drive', score: 94.50, points: 3 }, { name: 'ADM Raceway', score: 88.50, points: 32 },
      { name: 'Moscow Raceway', score: 0.00, points: 0 }, { name: 'Красное кольцо', score: 0.00, points: 0 },
      { name: 'Igora Drive', score: 0.00, points: 0 }
    ], totalPoints: 246 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 97.50, points: 85 }, { name: 'Igora Drive', score: 93.50, points: 83 },
      { name: 'NRing', score: 89.00, points: 72 }, { name: 'ADM Raceway', score: 93.00, points: 37 },
      { name: 'Red Ring', score: 95.00, points: 256 }, { name: 'Igora Drive', score: 86.00, points: 7 },
      { name: 'Moscow Raceway', score: 90.50, points: 32 }
    ], totalPoints: 572 }
  },
  7: { // 81 Лосев Евгений
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 94.00, points: 134 }, { name: 'NRING', score: 98.00, points: 159 },
      { name: 'Igora Drive', score: 99.00, points: 89 }, { name: 'ADM Raceway', score: 96.00, points: 84 },
      { name: 'Moscow Raceway', score: 85.50, points: 122 }, { name: 'Красное кольцо', score: 96.50, points: 80 },
      { name: 'Igora Drive', score: 98.50, points: 43 }
    ], totalPoints: 711 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 97.50, points: 162 }, { name: 'Igora Drive', score: 87.00, points: 33 },
      { name: 'NRing', score: 88.00, points: 32 }, { name: 'ADM Raceway', score: 95.00, points: 193 },
      { name: 'Red Ring', score: 92.00, points: 32 }, { name: 'Igora Drive', score: 91.50, points: 44 },
      { name: 'Moscow Raceway', score: 91.50, points: 5 }
    ], totalPoints: 501 }
  },
  8: { // 44 Гроссман Максим
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 89.50, points: 36 }, { name: 'NRING', score: 97.00, points: 80 },
      { name: 'Igora Drive', score: 94.00, points: 72 }, { name: 'ADM Raceway', score: 94.50, points: 83 },
      { name: 'Moscow Raceway', score: 98.00, points: 19 }, { name: 'Красное кольцо', score: 99.00, points: 162 },
      { name: 'Igora Drive', score: 94.00, points: 36 }
    ], totalPoints: 488 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 91.50, points: 4 }, { name: 'Igora Drive', score: 90.00, points: 80 },
      { name: 'NRing', score: 95.50, points: 49 }, { name: 'ADM Raceway', score: 98.00, points: 89 },
      { name: 'Red Ring', score: 97.50, points: 142 }, { name: 'Igora Drive', score: 87.50, points: 79 },
      { name: 'Moscow Raceway', score: 95.00, points: 43 }
    ], totalPoints: 486 }
  },
  9: { // 6 Тиводар Роман
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 95.00, points: 85 }, { name: 'NRING', score: 97.50, points: 42 },
      { name: 'Igora Drive', score: 92.50, points: 2 }, { name: 'ADM Raceway', score: 92.00, points: 37 },
      { name: 'Moscow Raceway', score: 97.00, points: 14 }, { name: 'Красное кольцо', score: 99.00, points: 82 },
      { name: 'Igora Drive', score: 97.00, points: 84 }
    ], totalPoints: 346 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 95.00, points: 131 }, { name: 'Igora Drive', score: 98.50, points: 142 },
      { name: 'NRing', score: 92.00, points: 11 }, { name: 'ADM Raceway', score: 96.00, points: 15 },
      { name: 'Red Ring', score: 97.50, points: 89 }, { name: 'Igora Drive', score: 82.50, points: 2 },
      { name: 'Moscow Raceway', score: 95.00, points: 44 }
    ], totalPoints: 434 }
  },
  10: { // 22 Попов Илья
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 93.50, points: 11 }, { name: 'NRING', score: 89.00, points: 2 },
      { name: 'Igora Drive', score: 96.50, points: 11 }, { name: 'ADM Raceway', score: 94.50, points: 156 },
      { name: 'Moscow Raceway', score: 92.50, points: 73 }, { name: 'Красное кольцо', score: 95.50, points: 39 },
      { name: 'Igora Drive', score: 91.50, points: 33 }
    ], totalPoints: 325 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 80.00, points: 2 }, { name: 'Igora Drive', score: 82.00, points: 72 },
      { name: 'NRing', score: 91.00, points: 37 }, { name: 'ADM Raceway', score: 90.50, points: 2 },
      { name: 'Red Ring', score: 94.50, points: 5 }, { name: 'Igora Drive', score: 92.00, points: 83 },
      { name: 'Moscow Raceway', score: 92.50, points: 188 }
    ], totalPoints: 389 }
  },
  11: { // 7 Шнайдер Леонид
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 82.50, points: 2 }, { name: 'NRING', score: 95.50, points: 37 },
      { name: 'Igora Drive', score: 96.00, points: 38 }, { name: 'ADM Raceway', score: 98.50, points: 92 },
      { name: 'Moscow Raceway', score: 96.50, points: 41 }, { name: 'Красное кольцо', score: 93.00, points: 4 },
      { name: 'Igora Drive', score: 95.00, points: 78 }
    ], totalPoints: 292 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 90.50, points: 32 }, { name: 'Igora Drive', score: 97.50, points: 17 },
      { name: 'NRing', score: 89.50, points: 4 }, { name: 'ADM Raceway', score: 95.50, points: 159 },
      { name: 'Red Ring', score: 96.50, points: 45 }, { name: 'Igora Drive', score: 85.00, points: 36 },
      { name: 'Moscow Raceway', score: 92.00, points: 77 }
    ], totalPoints: 370 }
  },
  12: {
    2024: { tracks: [], totalPoints: 0, note: 'Не попал в топ статистики 2024' },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 91.00, points: 2 }, { name: 'Igora Drive', score: 91.50, points: 42 },
      { name: 'NRing', score: 81.00, points: 72 }, { name: 'ADM Raceway', score: 93.00, points: 34 },
      { name: 'Red Ring', score: 87.50, points: 32 }, { name: 'Igora Drive', score: 94.00, points: 160 },
      { name: 'Moscow Raceway', score: 67.20, points: 0 }
    ], totalPoints: 342 }
  },
  13: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 89.00, points: 34 }, { name: 'NRING', score: 97.50, points: 43 },
      { name: 'Igora Drive', score: 95.00, points: 5 }, { name: 'ADM Raceway', score: 88.50, points: 2 },
      { name: 'Moscow Raceway', score: 94.50, points: 189 }, { name: 'Красное кольцо', score: 98.50, points: 45 },
      { name: 'Igora Drive', score: 91.50, points: 2 }
    ], totalPoints: 320 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 94.00, points: 38 }, { name: 'Igora Drive', score: 89.50, points: 9 },
      { name: 'NRing', score: 92.00, points: 129 }, { name: 'ADM Raceway', score: 93.50, points: 38 },
      { name: 'Red Ring', score: 96.50, points: 84 }, { name: 'Igora Drive', score: 87.00, points: 8 },
      { name: 'Moscow Raceway', score: 95.00, points: 12 }
    ], totalPoints: 318 }
  },
  14: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 92.50, points: 10 }, { name: 'NRING', score: 85.50, points: 2 },
      { name: 'Igora Drive', score: 97.00, points: 133 }, { name: 'ADM Raceway', score: 90.00, points: 2 },
      { name: 'Moscow Raceway', score: 94.00, points: 8 }, { name: 'Красное кольцо', score: 97.00, points: 41 },
      { name: 'Igora Drive', score: 0.00, points: 2 }
    ], totalPoints: 198 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 94.00, points: 39 }, { name: 'Igora Drive', score: 93.50, points: 14 },
      { name: 'NRing', score: 93.00, points: 14 }, { name: 'ADM Raceway', score: 93.00, points: 2 },
      { name: 'Red Ring', score: 95.00, points: 9 }, { name: 'Igora Drive', score: 82.50, points: 122 },
      { name: 'Moscow Raceway', score: 97.50, points: 52 }
    ], totalPoints: 252 }
  },
  15: {
    2024: { tracks: [], totalPoints: 0, note: 'Не попал в топ статистики 2024' },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 94.00, points: 40 }, { name: 'Igora Drive', score: 79.00, points: 2 },
      { name: 'NRing', score: 94.00, points: 45 }, { name: 'ADM Raceway', score: 94.00, points: 80 },
      { name: 'Red Ring', score: 90.50, points: 2 }, { name: 'Igora Drive', score: 95.00, points: 19 },
      { name: 'Moscow Raceway', score: 94.00, points: 40 }
    ], totalPoints: 228 }
  },
  16: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 82.00, points: 72 }, { name: 'NRING', score: 94.00, points: 2 },
      { name: 'Igora Drive', score: 86.00, points: 32 }, { name: 'ADM Raceway', score: 81.00, points: 2 },
      { name: 'Moscow Raceway', score: 87.50, points: 2 }, { name: 'Красное кольцо', score: 94.00, points: 35 },
      { name: 'Igora Drive', score: 88.50, points: 32 }
    ], totalPoints: 177 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 92.50, points: 6 }, { name: 'Igora Drive', score: 79.00, points: 32 },
      { name: 'NRing', score: 82.00, points: 32 }, { name: 'ADM Raceway', score: 85.00, points: 72 },
      { name: 'Red Ring', score: 89.50, points: 2 }, { name: 'Igora Drive', score: 65.50, points: 1 },
      { name: 'Moscow Raceway', score: 91.50, points: 72 }
    ], totalPoints: 217 }
  },
  17: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 0.00, points: 0 }, { name: 'NRING', score: 0.00, points: 0 },
      { name: 'Igora Drive', score: 0.00, points: 0 }, { name: 'ADM Raceway', score: 0.00, points: 0 },
      { name: 'Moscow Raceway', score: 91.00, points: 2 }, { name: 'Красное кольцо', score: 0.00, points: 0 },
      { name: 'Igora Drive', score: 0.00, points: 0 }
    ], totalPoints: 2 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 91.00, points: 73 }, { name: 'Igora Drive', score: 71.50, points: 1 },
      { name: 'NRing', score: 93.00, points: 13 }, { name: 'ADM Raceway', score: 94.50, points: 41 },
      { name: 'Red Ring', score: 95.00, points: 8 }, { name: 'Igora Drive', score: 73.00, points: 2 },
      { name: 'Moscow Raceway', score: 93.00, points: 79 }
    ], totalPoints: 217 }
  },
  18: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 96.00, points: 89 }, { name: 'NRING', score: 93.50, points: 2 },
      { name: 'Igora Drive', score: 95.50, points: 37 }, { name: 'ADM Raceway', score: 94.50, points: 132 },
      { name: 'Moscow Raceway', score: 97.00, points: 45 }, { name: 'Красное кольцо', score: 98.00, points: 43 },
      { name: 'Igora Drive', score: 98.00, points: 11 }
    ], totalPoints: 359 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 95.50, points: 12 }, { name: 'Igora Drive', score: 88.00, points: 36 },
      { name: 'NRing', score: 92.50, points: 42 }, { name: 'ADM Raceway', score: 86.00, points: 32 },
      { name: 'Red Ring', score: 95.50, points: 83 }, { name: 'Igora Drive', score: 0.00, points: 0 },
      { name: 'Moscow Raceway', score: 83.50, points: 2 }
    ], totalPoints: 207 }
  },
  19: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 81.50, points: 32 }, { name: 'NRING', score: 88.00, points: 2 },
      { name: 'Igora Drive', score: 85.00, points: 2 }, { name: 'ADM Raceway', score: 92.00, points: 6 },
      { name: 'Moscow Raceway', score: 91.00, points: 72 }, { name: 'Красное кольцо', score: 90.50, points: 32 },
      { name: 'Igora Drive', score: 94.50, points: 7 }
    ], totalPoints: 153 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 85.50, points: 72 }, { name: 'Igora Drive', score: 81.00, points: 2 },
      { name: 'NRing', score: 88.00, points: 2 }, { name: 'ADM Raceway', score: 82.50, points: 1 },
      { name: 'Red Ring', score: 86.50, points: 2 }, { name: 'Igora Drive', score: 69.50, points: 2 },
      { name: 'Moscow Raceway', score: 80.50, points: 72 }
    ], totalPoints: 153 }
  },
  20: {
    2024: { tracks: [
      { name: 'Moscow Raceway', score: 0.00, points: 0 }, { name: 'NRING', score: 0.00, points: 0 },
      { name: 'Igora Drive', score: 92.50, points: 72 }, { name: 'ADM Raceway', score: 0.00, points: 0 },
      { name: 'Moscow Raceway', score: 0.00, points: 0 }, { name: 'Красное кольцо', score: 0.00, points: 0 },
      { name: 'Igora Drive', score: 0.00, points: 0 }
    ], totalPoints: 72 },
    2025: { tracks: [
      { name: 'Moscow Raceway', score: 76.00, points: 1 }, { name: 'Igora Drive', score: 88.50, points: 7 },
      { name: 'NRing', score: 95.00, points: 87 }, { name: 'ADM Raceway', score: 81.50, points: 1 },
      { name: 'Red Ring', score: 0.00, points: 0 }, { name: 'Igora Drive', score: 76.50, points: 32 },
      { name: 'Moscow Raceway', score: 67.00, points: 0 }
    ], totalPoints: 128 }
  }
};

// ─── 2026 CALENDAR ───────────────────────────────────────────
// Source: rdsgp.com/calendar — Season 2026 schedule
// Dates modelled on 2025 structure; Round 1 confirmed (2-3 May 2026)
const EVENTS_2026 = [
  { num:1, type:'round', name:'Этап 1 — Moscow Raceway',  venue:'Moscow Raceway',   city:'Москва',          dates:'2–3 мая',       mon:'МАЯ',  day:'2',   status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:2, type:'round', name:'Этап 2 — Igora Drive',     venue:'Igora Drive',      city:'Санкт-Петербург', dates:'22–25 мая',     mon:'МАЯ',  day:'22',  status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:3, type:'round', name:'Этап 3 — NRing',           venue:'NRing',            city:'Нижний Новгород', dates:'12–15 июня',    mon:'ИЮНЯ', day:'12',  status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:0, type:'fest',  name:'RDS FEST',                  venue:'Moscow Raceway',   city:'Москва',          dates:'июнь 2026',     mon:'',     day:'',    status:'upcoming' },
  { num:4, type:'round', name:'Этап 4 — ADM Raceway',     venue:'ADM Raceway',      city:'Москва',          dates:'17–20 июля',    mon:'ИЮЛЯ', day:'17',  status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:5, type:'round', name:'Этап 5 — Red Ring',        venue:'Red Ring',          city:'Красноярск',      dates:'7–10 августа',  mon:'АВГ',  day:'7',   status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:0, type:'fest',  name:'RDS FEST',                  venue:'Igora Drive',      city:'Санкт-Петербург', dates:'август 2026',   mon:'',     day:'',    status:'upcoming' },
  { num:6, type:'round', name:'Этап 6 — Igora Drive',     venue:'Igora Drive',      city:'Санкт-Петербург', dates:'28–31 августа', mon:'АВГ',  day:'28',  status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:7, type:'round', name:'Этап 7 — Moscow Raceway',  venue:'Moscow Raceway',   city:'Москва',          dates:'сентябрь 2026', mon:'СЕН',  day:'—',   status:'upcoming', url:'https://rdsgp.com/results/rds2026/' },
  { num:0, type:'final', name:'СУПЕРФИНАЛ 2026',           venue:'TBD',              city:'TBD',             dates:'октябрь 2026',  mon:'ОКТ',  day:'—',   status:'upcoming' },
];

// ─── 2025 CALENDAR (archived) ────────────────────────────────
const EVENTS_2025 = [
  { num:1, type:'round', name:'Этап 1 — Moscow Raceway',  venue:'Moscow Raceway',   city:'Москва',          dates:'2–3 мая',        mon:'МАЯ',  day:'2–3', status:'done' },
  { num:2, type:'round', name:'Этап 2 — Igora Drive',     venue:'Igora Drive',      city:'Санкт-Петербург', dates:'23–24 мая',      mon:'МАЯ',  day:'23',  status:'done' },
  { num:3, type:'round', name:'Этап 3 — NRing',           venue:'NRing',            city:'Нижний Новгород', dates:'13–14 июня',     mon:'ИЮНЯ', day:'13',  status:'done' },
  { num:0, type:'fest',  name:'RDS FEST',                  venue:'Moscow Raceway',   city:'Москва',          dates:'20 июня',        mon:'',     day:'',    status:'done' },
  { num:4, type:'round', name:'Этап 4 — ADM Raceway',     venue:'ADM Raceway',      city:'Москва',          dates:'11–12 июля',     mon:'ИЮЛЯ', day:'11',  status:'done' },
  { num:5, type:'round', name:'Этап 5 — RedRing',         venue:'RedRing',          city:'Красноярск',      dates:'1–2 августа',    mon:'АВГ',  day:'1–2', status:'done' },
  { num:0, type:'fest',  name:'RDS FEST',                  venue:'Igora Drive',      city:'Санкт-Петербург', dates:'22–23 августа',  mon:'',     day:'',    status:'done' },
  { num:6, type:'round', name:'Этап 6 — Moscow Raceway',  venue:'Moscow Raceway',   city:'Москва',          dates:'29–30 августа',  mon:'АВГ',  day:'29',  status:'done' },
  { num:0, type:'final', name:'СУПЕРФИНАЛ',                venue:'Ростов Арена',     city:'Ростов-на-Дону',  dates:'26–27 сентября', mon:'СЕН',  day:'26',  status:'done' },
];

// ─── TELEMETRY (illustrative) ─────────────────────────────────
const DEMO_TELEM_DATA = {
  tsaregradtsev: { lap:'1:11.8', reaction:398, accuracy:89, maxSpd:168, sectors:[144,120,158,136,168,150,124], angles:[34,50,30,56,37,44,31] },
  chivchyan:     { lap:'1:12.6', reaction:420, accuracy:93, maxSpd:161, sectors:[137,124,150,130,161,142,119], angles:[29,54,25,60,31,48,27] },
  shabanov:      { lap:'1:12.1', reaction:415, accuracy:88, maxSpd:164, sectors:[140,117,154,132,164,146,121], angles:[31,47,27,52,34,41,28] },
  idiyatulin:    { lap:'1:11.4', reaction:395, accuracy:84, maxSpd:172, sectors:[150,122,162,140,172,154,128], angles:[36,45,33,51,39,42,31] },
  kozlov_a:      { lap:'1:12.9', reaction:430, accuracy:86, maxSpd:159, sectors:[136,119,149,129,159,141,117], angles:[30,46,26,51,33,40,27] },
  dobrovolsky:   { lap:'1:13.4', reaction:442, accuracy:90, maxSpd:156, sectors:[133,121,146,127,156,138,115], angles:[27,51,23,57,29,45,25] },
  losev:         { lap:'1:13.0', reaction:428, accuracy:83, maxSpd:160, sectors:[138,118,151,131,160,143,120], angles:[31,46,27,51,34,41,28] },
  grossman:      { lap:'1:13.7', reaction:445, accuracy:81, maxSpd:155, sectors:[132,120,145,126,155,137,114], angles:[28,44,24,49,30,39,26] },
};

// ─── STATE ────────────────────────────────────────────────────
let activeStandingsYear = '2025';
let calendarYear = '2026';

// ─── TAB SWITCHER ─────────────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

  const panel = document.getElementById('tab-' + id);
  if (panel) panel.classList.add('active');
  if (btn) btn.classList.add('active');

  if (id === 'standings') renderStandings();
  if (id === 'live') renderLive();
  if (id === 'calendar') renderCalendar();
  if (id === 'telemetry') {
    renderTelemDriverSel();
    renderTelemStats();
    drawTelemCharts();
  }

  if (id === 'drivers') renderDriversFromApi();
  if (id === 'teams') renderTeamsFromApi();
  if (id === 'cars') renderCarsFromApi();
}

// ─── STANDINGS ────────────────────────────────────────────────
function getStandingsForYear(year) {
  if (year === '2024') return STANDINGS_2024;
  if (year === '2026') return []; // season not started
  return STANDINGS_2025;
}

function renderStandings() {
  const container = document.getElementById('standings-rows');
  if (!container) return;

  // Inject year selector if not present
  let header = document.querySelector('.data-page-sub.standings-sub');
  if (!header) {
    const subEl = document.querySelector('#tab-standings .data-page-sub');
    if (subEl) {
      subEl.classList.add('standings-sub');
      subEl.innerHTML = `
        <span>Чемпионат RDS GP</span>
        <span class="year-toggle-group">
          <button class="year-btn ${activeStandingsYear==='2024'?'active':''}" onclick="setStandingsYear('2024')">2024</button>
          <button class="year-btn ${activeStandingsYear==='2025'?'active':''}" onclick="setStandingsYear('2025')">2025</button>
          <button class="year-btn ${activeStandingsYear==='2026'?'active':''}" onclick="setStandingsYear('2026')">2026</button>
        </span>
      `;
    }
  } else {
    header.querySelectorAll('.year-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.trim() === activeStandingsYear);
    });
  }

  // Update title
  const titleEl = document.querySelector('#tab-standings .data-page-title');
  if (titleEl) titleEl.textContent = `Турнирная таблица ${activeStandingsYear}`;

  const data = getStandingsForYear(activeStandingsYear);

  if (data.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:40px 20px;color:var(--dim);">
        <div style="font-size:32px;margin-bottom:12px">🏁</div>
        <div style="font-family:var(--head);font-size:14px;color:var(--text);margin-bottom:6px">Сезон 2026 ещё не стартовал</div>
        <div style="font-size:12px;">Первый этап — 2–3 мая 2026 · Moscow Raceway</div>
        <div style="margin-top:16px">
          <a href="https://rdsgp.com/results/rds2026/" target="_blank"
             style="color:var(--accent);font-family:var(--mono);font-size:11px;text-decoration:none;">
            rdsgp.com/results/rds2026/ →
          </a>
        </div>
      </div>`;
    return;
  }

  const maxPts = data[0].pts;
  container.innerHTML = data.map((d, i) => {
    const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
    const wins = d.wins || 0;
    const barW = Math.round(d.pts / maxPts * 100);
    return `
      <div class="st-row">
        <div class="st-pos ${posClass}">${i + 1}</div>
        <div class="st-driver">
          <img class="st-avatar" src="${d.avatar}" alt="${d.name}" onerror="this.style.display='none'">
          <div>
            <div class="st-name">${d.name}</div>
            <div class="st-num">No.${d.num}</div>
          </div>
        </div>
        <div class="st-team">${d.team}</div>
        <div class="st-wins">${wins > 0 ? '🏆 ' + wins : '—'}</div>
        <div>
          <div class="st-pts">${d.pts}</div>
          <div style="height:3px;background:rgba(255,255,255,.07);border-radius:2px;margin-top:4px;width:80px">
            <div style="height:100%;width:${barW}%;background:linear-gradient(90deg,#ff0066,#00d9ff);border-radius:2px"></div>
          </div>
        </div>
        <div class="st-chg eq">—</div>
      </div>`;
  }).join('');
}

function setStandingsYear(year) {
  activeStandingsYear = year;
  renderStandings();
}

// ─── LIVE — 2026 DATA FROM rdsgp.com ─────────────────────────
// The 2026 season hasn't started yet. We attempt to fetch the live
// standings from rdsgp.com/results/rds2026/ via a CORS proxy.
// If no data exists yet, we show a holding screen with a direct link.

async function fetchLive2026() {
  const container = document.getElementById('live-rows');
  const upd = document.getElementById('live-updated');
  const llr = document.getElementById('llr-text');

  if (upd) upd.textContent = 'RDS GP 2026 — синхронизация с rdsgp.com…';
  if (llr) llr.innerHTML = '';
  if (container) container.innerHTML = `
    <div style="text-align:center;padding:20px;color:var(--dim);font-size:12px;">
      <span class="live-dot" style="display:inline-block;margin-right:6px"></span>Загрузка данных…
    </div>`;

  try {
    // Use a CORS proxy to fetch the RDS page
    const proxyUrl = 'https://api.allorigins.win/get?url=' + encodeURIComponent('https://rdsgp.com/results/rds2026/');
    const resp = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
    const json = await resp.json();
    const html = json.contents || '';

    // Parse the table from the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const rows = doc.querySelectorAll('table tr');

    const drivers = [];
    rows.forEach(tr => {
      const cells = tr.querySelectorAll('td');
      if (cells.length < 4) return;
      const pos = cells[0]?.textContent.trim();
      const num = cells[1]?.textContent.trim();
      const nameCell = cells[2]?.textContent.trim();
      const ptsText = cells[cells.length - 1]?.textContent.trim().replace(',', '.');
      const pts = parseFloat(ptsText);
      if (!isNaN(parseInt(pos)) && nameCell && !isNaN(pts)) {
        // Parse Cyrillic name (before the slash)
        const nameParts = nameCell.split('/');
        const name = nameParts[0].trim();
        drivers.push({ pos: parseInt(pos), num, name, pts });
      }
    });

    if (drivers.length === 0) {
      showLiveEmpty();
      return;
    }

    if (upd) upd.textContent = `RDS GP 2026 — Актуальная таблица · rdsgp.com · обновлено только что`;
    if (llr) llr.innerHTML = `Лидер: ${drivers[0].name} · ${drivers[0].pts} очков`;

    const maxPts = drivers[0].pts;
    container.innerHTML = drivers.map((d, i) => {
      const posClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
      const barW = maxPts > 0 ? Math.round(d.pts / maxPts * 100) : 0;
      // Try to match with known avatar
      const known = [...STANDINGS_2025, ...STANDINGS_2024].find(s =>
        s.name.toLowerCase().includes(d.name.split(' ')[0].toLowerCase())
      );
      const avatar = known ? known.avatar : '';
      return `
        <div class="st-row st-row-live">
          <div class="st-pos ${posClass}">${d.pos}</div>
          <div class="st-driver">
            ${avatar ? `<img class="st-avatar" src="${avatar}" alt="${d.name}" onerror="this.style.display='none'">` : '<div class="st-avatar" style="background:rgba(255,255,255,.06)"></div>'}
            <div>
              <div class="st-name">${d.name}</div>
              <div class="st-num">No.${d.num}</div>
            </div>
          </div>
          <div>${scoreChip(d.pts)}</div>
          <div>—</div>
          <div>${scoreChip(d.pts)}</div>
          <div class="run-status"style="color:var(--safe);font-size:10px">LIVE</div>
        </div>`;
    }).join('');

  } catch (e) {
    showLiveEmpty();
  }
}

function showLiveEmpty() {
  const container = document.getElementById('live-rows');
  const upd = document.getElementById('live-updated');
  const llr = document.getElementById('llr-text');

  if (upd) upd.textContent = 'RDS GP 2026 — Сезон ещё не начался';
  if (llr) llr.innerHTML = 'Первый старт: 2–3 мая 2026 · Moscow Raceway';
  if (container) container.innerHTML = `
    <div style="text-align:center;padding:40px 20px;color:var(--dim);">
      <div style="font-size:32px;margin-bottom:12px">⏳</div>
      <div style="font-family:var(--head);font-size:14px;color:var(--text);margin-bottom:6px">
        Данные появятся после старта сезона
      </div>
      <div style="font-size:12px;margin-bottom:16px">
        Этап 1 · Moscow Raceway · 2–3 мая 2026
      </div>
      <a href="https://rdsgp.com/results/rds2026/" target="_blank"
         style="display:inline-block;background:linear-gradient(135deg,#ff0066,#00d9ff);color:white;font-family:var(--head);font-size:11px;font-weight:800;padding:8px 20px;border-radius:3px;text-decoration:none;">
        ОТКРЫТЬ НА RDSGP.COM →
      </a>
      <div style="margin-top:20px;font-size:10px;color:var(--dim)">
        Страница обновляется автоматически после публикации результатов
      </div>
    </div>`;

  const badge = document.querySelector('#tab-live .live-badge .live-text');
  if (badge) badge.textContent = 'СЕЗОН 2026 СКОРО';
}

function scoreChip(val) {
  if (val === null || val === undefined) return '—';
  const cls = val >= 200 ? 'chip-hi' : val >= 100 ? 'chip-mid' : 'chip-lo';
  return `<span class="score-chip ${cls}">${val}</span>`;
}

function renderLive() {
  fetchLive2026();
}

// ─── CALENDAR ─────────────────────────────────────────────────
async function renderCalendar() {
  const container = document.getElementById('calendar-list');
  if (!container) return;

  // Build year toggle
  const pageHeader = document.querySelector('#tab-calendar .data-page-header');
  let yearToggle = document.getElementById('cal-year-toggle');

  if (!yearToggle && pageHeader) {
    yearToggle = document.createElement('div');
    yearToggle.id = 'cal-year-toggle';
    yearToggle.style.cssText = 'display:flex;gap:6px;margin-top:8px;';
    yearToggle.innerHTML = `
      <button class="year-btn active" onclick="setCalYear('2025')">2025</button>
    `;
    pageHeader.appendChild(yearToggle);
  }

  if (yearToggle) {
    yearToggle.querySelectorAll('.year-btn').forEach((button) => {
      button.classList.toggle('active', button.textContent.trim() === calendarYear);
    });
  }

  const subEl = document.querySelector('#tab-calendar .data-page-sub');
  if (subEl) {
    subEl.textContent = `RDS GP ${calendarYear} — этапы и фестивали`;
  }

  container.innerHTML = `
    <div style="text-align:center;padding:28px 20px;color:var(--dim);">
      <div style="font-size:28px;margin-bottom:10px">⏳</div>
      <div style="font-family:var(--head);font-size:13px;color:var(--text);">
        Загрузка календаря из локального API…
      </div>
      <div style="font-size:11px;margin-top:6px;">
        GET /api/events?season=${calendarYear}
      </div>
    </div>
  `;

  try {
    const response = await fetch(`http://localhost:3000/api/events?season=${calendarYear}`);

    if (!response.ok) {
      throw new Error(`API returned HTTP ${response.status}`);
    }

    const payload = await response.json();
    const events = payload.data || [];

    if (!events.length) {
      container.innerHTML = `
        <div style="text-align:center;padding:40px 20px;color:var(--dim);">
          <div style="font-size:32px;margin-bottom:12px">🏁</div>
          <div style="font-family:var(--head);font-size:14px;color:var(--text);margin-bottom:6px">
            Нет событий для сезона ${calendarYear}
          </div>
          <div style="font-size:12px;">Проверь /api/events?season=${calendarYear}</div>
        </div>
      `;
      return;
    }

    container.innerHTML = events.map((event) => {
      if (event.type === 'fest') {
        return `
          <div class="cal-fest-row">
            <div class="cal-fest-name">${event.name}</div>
            <div class="cal-fest-detail">
              ${event.dates} / ${event.city} / <b>${event.venue}</b>
            </div>
          </div>
        `;
      }

      const isFinal = event.type === 'final';
      const accent = isFinal
        ? 'var(--secondary)'
        : event.num % 2 === 0
          ? 'var(--warn)'
          : 'var(--accent)';

      const badgeText =
        event.status === 'done'
          ? 'ЗАВЕРШЁН'
          : event.status === 'live'
            ? '● LIVE'
            : 'ПРЕДСТОЯЩИЙ';

      const monthText = getEventMonthLabel(event.dates);
      const dayText = getEventDayLabel(event.dates);

      return `
        <div class="cal-card status-${event.status}" data-event-id="${event.id}">
          <div class="cal-date-box">
            ${
              event.num
                ? `<div class="cal-round-num" style="color:${accent};font-family:var(--head);font-style:italic;font-size:26px;font-weight:800;line-height:1">${event.num}</div>`
                : ''
            }
            <div class="cal-mon">${monthText}</div>
            <div class="cal-day-small" style="font-family:var(--mono);font-size:11px;color:var(--dim)">
              ${dayText}
            </div>
          </div>

          <div>
            <div class="cal-name">${isFinal ? '🏆 ' : ''}${event.name}</div>
            <div class="cal-venue">${event.venue} · ${event.city}</div>
            <div class="cal-dates-str" style="font-family:var(--mono);font-size:10px;color:var(--dim);margin-top:3px">
              ${event.dates}
            </div>

            <span class="cal-badge badge-${event.status}">${badgeText}</span>

            ${
              event.trackId
                ? `<button
                    type="button"
                    onclick="openTrackFromCalendar('${event.trackId}')"
                    style="margin-left:8px;background:transparent;border:0;color:var(--accent);font-family:var(--mono);font-size:9px;cursor:pointer;padding:0;">
                    track map →
                  </button>`
                : ''
            }
          </div>

          <span class="cal-done-label">${event.status === 'done' ? 'Архив' : ''}</span>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Calendar API error:', error);

    const fallbackEvents = calendarYear === '2025' ? EVENTS_2025 : EVENTS_2026;

    container.innerHTML = `
      <div style="margin-bottom:14px;padding:10px 14px;border:1px solid rgba(255,193,7,.35);background:rgba(255,193,7,.08);color:var(--warn);font-family:var(--mono);font-size:11px;">
        API недоступен. Показаны локальные данные из _legacy/tabs.js.
      </div>
      ${fallbackEvents.map((event) => {
        if (event.type === 'fest') {
          return `
            <div class="cal-fest-row">
              <div class="cal-fest-name">${event.name}</div>
              <div class="cal-fest-detail">${event.dates} / ${event.city} / <b>${event.venue}</b></div>
            </div>
          `;
        }

        const isFinal = event.type === 'final';
        const accent = isFinal
          ? 'var(--secondary)'
          : event.num % 2 === 0
            ? 'var(--warn)'
            : 'var(--accent)';

        const badgeText =
          event.status === 'done'
            ? 'ЗАВЕРШЁН'
            : event.status === 'live'
              ? '● LIVE'
              : 'ПРЕДСТОЯЩИЙ';

        return `
          <div class="cal-card status-${event.status}">
            <div class="cal-date-box">
              ${
                event.num
                  ? `<div class="cal-round-num" style="color:${accent};font-family:var(--head);font-style:italic;font-size:26px;font-weight:800;line-height:1">${event.num}</div>`
                  : ''
              }
              <div class="cal-mon">${event.mon || getEventMonthLabel(event.dates)}</div>
              <div class="cal-day-small" style="font-family:var(--mono);font-size:11px;color:var(--dim)">
                ${event.day || getEventDayLabel(event.dates)}
              </div>
            </div>
            <div>
              <div class="cal-name">${isFinal ? '🏆 ' : ''}${event.name}</div>
              <div class="cal-venue">${event.venue} · ${event.city}</div>
              <div class="cal-dates-str" style="font-family:var(--mono);font-size:10px;color:var(--dim);margin-top:3px">
                ${event.dates}
              </div>
              <span class="cal-badge badge-${event.status}">${badgeText}</span>
            </div>
            <span class="cal-done-label">${event.status === 'done' ? 'Архив' : ''}</span>
          </div>
        `;
      }).join('')}
    `;
  }
}

function getEventMonthLabel(dates) {
  const value = String(dates || '').toLowerCase();

  if (value.includes('мая')) return 'МАЯ';
  if (value.includes('июня')) return 'ИЮНЯ';
  if (value.includes('июля')) return 'ИЮЛЯ';
  if (value.includes('августа')) return 'АВГ';
  if (value.includes('сентября')) return 'СЕН';
  if (value.includes('октября')) return 'ОКТ';

  return '';
}

function getEventDayLabel(dates) {
  const value = String(dates || '');
  const match = value.match(/\d+(?:[–-]\d+)?/);
  return match ? match[0] : '';
}

function openTrackFromCalendar(trackId) {
  switchTab('telemetry', document.querySelector('[data-tab="telemetry"]') || document.querySelector('.tab-btn'));
  window.__selectedTrackId = trackId;

  if (typeof renderTrackMapFromApi === 'function') {
    renderTrackMapFromApi(trackId);
  }
}

function setCalYear(year) {
  calendarYear = year;
  renderCalendar();
}

// ─── TELEMETRY ────────────────────────────────────────────────
let currentTelemDriver = 'tsaregradtsev';

// Data mode label: 'demo' | 'evidence' | 'estimated'
let telemDataMode = 'demo';

function injectTelemWarning() {
  const tab = document.getElementById('tab-telemetry');
  if (!tab || tab.querySelector('.telem-demo-banner')) return;
  const header = tab.querySelector('.data-page-header');
  if (!header) return;

  // Mode label
  const modeLabelEl = document.createElement('div');
  modeLabelEl.id = 'telem-mode-label';
  modeLabelEl.style.cssText = 'display:inline-flex;align-items:center;gap:6px;margin-top:6px;';
  modeLabelEl.innerHTML = '<span style="font-family:var(--mono);font-size:9px;color:var(--dim);">Режим данных:</span><span style="font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 8px;border-radius:2px;color:#fff;background:#6c757d;border:1px solid rgba(108,117,125,.4);">DEMO</span>';
  header.appendChild(modeLabelEl);

  // Warning banner
  const banner = document.createElement('div');
  banner.className = 'telem-demo-banner';
  banner.style.cssText = 'margin:0 0 16px 0;padding:12px 16px;background:rgba(108,117,125,0.10);border:1px solid rgba(108,117,125,0.30);border-radius:4px;';
  banner.innerHTML = '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;"><span style="font-family:var(--mono);font-size:9px;font-weight:700;padding:2px 8px;border-radius:2px;color:#6c757d;background:rgba(108,117,125,0.15);border:1px solid rgba(108,117,125,0.3);">DEMO</span><span style="font-family:var(--mono);font-size:11px;color:var(--warn);font-weight:700;">Демо-телеметрия — не является официальными данными РДС</span></div><div style="margin-top:6px;font-size:11px;color:var(--dim);line-height:1.5;">Публичная телеметрия (GPS-трек, скорость по секторам, угол скольжения) недоступна как открытый API. Данные ниже являются <b style="color:var(--mid)">иллюстративными</b> — они не отражают реальные показатели гонщиков. Официальные результаты соревнований доступны на <a href="https://rdsgp.com" target="_blank" style="color:var(--accent);font-family:var(--mono);text-decoration:none;">rdsgp.com →</a></div><div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;font-size:10px;font-family:var(--mono);color:var(--dim);"><span>Официальный результат: <span style="color:#00d9ff">✓ доступен</span></span><span style="color:var(--rim)">|</span><span>GPS-телеметрия: <span style="color:var(--crit)">✗ нет</span></span><span style="color:var(--rim)">|</span><span>Угол скольжения: <span style="color:var(--crit)">✗ нет</span></span></div>';

  const dataPage = tab.querySelector('.data-page');
  const statsGrid = tab.querySelector('.telem-stats-grid');
  if (dataPage && statsGrid) dataPage.insertBefore(banner, statsGrid);
  else if (dataPage) dataPage.appendChild(banner);
}

function renderTelemDriverSel() {
  injectTelemWarning();
  const wrap = document.getElementById('telem-driver-sel');
  if (!wrap) return;
  wrap.innerHTML = Object.keys(DEMO_TELEM_DATA).map(id => {
    const d = STANDINGS_DATA.find(x => x.id === id) || { name: id };
    const lastName = d.name.split(' ').slice(-1)[0];
    const active = id === currentTelemDriver ? ' active' : '';
    return `<button class="telem-dsel-btn${active}" onclick="selectTelemDriver('${id}')">${lastName}</button>`;
  }).join('');
}

function selectTelemDriver(id) {
  currentTelemDriver = id;
  renderTelemDriverSel();
  renderTelemStats();
  drawTelemCharts();
}

function renderTelemStats() {
  const t = DEMO_TELEM_DATA[currentTelemDriver];
  const container = document.getElementById('telem-stats-grid');
  if (!t || !container) return;
  const stats = [
    { val:t.maxSpd,                        unit:' км/ч', label:'Макс. скорость',     fill:t.maxSpd/200*100,            color:'var(--accent)' },
    { val:t.lap,                            unit:'',      label:'Время круга',         fill:null,                         color:'var(--secondary)' },
    { val:(t.reaction/1000).toFixed(3),    unit:' с',    label:'Время реакции',       fill:(500-t.reaction)/200*100,    color:'var(--secondary)' },
    { val:t.accuracy,                       unit:'%',     label:'Точность траектории', fill:t.accuracy,                   color:'var(--safe)' },
  ];
  container.innerHTML = stats.map(s => `
    <div class="telem-stat-card">
      <div class="telem-stat-val" style="color:${s.color}">${s.val}<span class="telem-stat-unit">${s.unit}</span></div>
      <div class="telem-stat-label">${s.label}</div>
      ${s.fill !== null ? `<div class="telem-bar-bg"><div class="telem-bar-fill" style="width:${s.fill}%;background:${s.color}"></div></div>` : ''}
    </div>
  `).join('');
}

function drawTelemCharts() {
  const t = DEMO_TELEM_DATA[currentTelemDriver];
  if (!t) return;
  drawLineChart('speed-canvas', t.sectors, 'var(--accent)',    200);
  drawLineChart('angle-canvas', t.angles,  'var(--secondary)', 70);
}

function drawLineChart(canvasId, data, color, maxVal) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.width = canvas.offsetWidth || 860;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const pad = 28, cW = W-pad*2, cH = H-pad*2;
  const step = cW / (data.length - 1);
  ctx.clearRect(0, 0, W, H);
  const grad = ctx.createLinearGradient(0, pad, 0, pad+cH);
  grad.addColorStop(0, color+'44');
  grad.addColorStop(1, color+'00');
  ctx.beginPath();
  data.forEach((v,i) => { const x=pad+i*step, y=pad+cH-(v/maxVal*cH); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.lineTo(pad+(data.length-1)*step, pad+cH);
  ctx.lineTo(pad, pad+cH);
  ctx.closePath(); ctx.fillStyle=grad; ctx.fill();
  ctx.beginPath(); ctx.strokeStyle=color; ctx.lineWidth=2; ctx.lineJoin='round';
  data.forEach((v,i) => { const x=pad+i*step, y=pad+cH-(v/maxVal*cH); i===0?ctx.moveTo(x,y):ctx.lineTo(x,y); });
  ctx.stroke();
  data.forEach((v,i) => {
    const x=pad+i*step, y=pad+cH-(v/maxVal*cH);
    ctx.beginPath(); ctx.arc(x,y,3,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
    ctx.fillStyle=color; ctx.font='10px monospace'; ctx.textAlign='center';
    ctx.fillText(v, x, y-8);
    ctx.fillStyle='rgba(107,114,128,.7)'; ctx.fillText('S'+(i+1), x, pad+cH+14);
  });
}

// ─── CSS INJECTION — year-toggle buttons ────────────────────
(function injectYearToggleCSS() {
  const style = document.createElement('style');
  style.textContent = `
    .year-toggle-group { display:inline-flex; gap:4px; margin-left:12px; vertical-align:middle; }
    .year-btn {
      background: rgba(255,255,255,.05);
      border: 1px solid var(--rim, rgba(255,255,255,.1));
      border-radius: 3px;
      color: var(--dim, #888);
      font-family: var(--head, monospace);
      font-size: 11px;
      font-weight: 700;
      padding: 3px 10px;
      cursor: pointer;
      transition: all .18s;
    }
    .year-btn:hover { color: var(--text, #fff); border-color: rgba(255,255,255,.3); }
    .year-btn.active {
      background: linear-gradient(135deg, #ff0066, #00d9ff);
      border-color: transparent;
      color: #fff;
    }
    .standings-sub { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
    #cal-year-toggle { margin-top:8px; }
  `;
  document.head.appendChild(style);
})();

// ─── API ENCYCLOPEDIA TABS: DRIVERS / TEAMS / CARS ─────────────

function metaValue(field, fallback = '—') {
  if (field === null || field === undefined) return fallback;
  if (typeof field === 'object' && 'value' in field) return field.value ?? fallback;
  return field || fallback;
}

function shortSourceBadge(field) {
  if (!field || typeof field !== 'object') return '';
  const sourceType = field.source_type || field.source?.source_type;
  const confidence = field.confidence ?? field.source?.confidence;

  if (!sourceType) return '';

  return `
    <div style="margin-top:6px;font-family:var(--mono);font-size:9px;color:var(--dim);">
      ${sourceType}${confidence !== undefined ? ` · ${Math.round(confidence * 100)}%` : ''}
    </div>
  `;
}

function renderApiLoading(container, label) {
  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:42px 20px;color:var(--dim);">
      <div style="font-size:30px;margin-bottom:10px;">⏳</div>
      <div style="font-family:var(--head);font-size:14px;color:var(--text);">
        Загрузка: ${label}
      </div>
    </div>
  `;
}

function renderApiError(container, error, endpoint) {
  container.innerHTML = `
    <div style="grid-column:1/-1;padding:18px;border:1px solid rgba(255,51,51,.35);background:rgba(255,51,51,.08);border-radius:12px;color:var(--crit);">
      <div style="font-family:var(--head);font-size:16px;font-weight:800;margin-bottom:6px;">
        Ошибка загрузки данных
      </div>
      <div style="font-family:var(--mono);font-size:11px;color:var(--mid);">
        ${endpoint}
      </div>
      <div style="margin-top:8px;font-size:12px;color:var(--dim);">
        ${error.message}
      </div>
    </div>
  `;
}

async function renderDriversFromApi() {
  const container = document.getElementById('drivers-grid');
  if (!container) return;

  renderApiLoading(container, '/api/drivers');

  try {
    const drivers = await window.RDS_API.getDrivers();

    if (!drivers.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--dim);">
          Нет пилотов в API.
        </div>
      `;
      return;
    }

    container.innerHTML = drivers.map((driver) => {
      const teamName = driver.currentTeam?.name || 'Команда не указана';
      const carName = driver.currentCar?.displayName || 'Автомобиль не указан';

      return `
        <article class="rds-api-card">
          <div class="rds-api-card-top">
            <div class="rds-api-number">#${driver.number ?? '—'}</div>
            <div class="rds-api-tag">DRIVER</div>
          </div>

          <div class="rds-api-title">${driver.fullName || 'Без имени'}</div>
          <div class="rds-api-sub">${teamName}</div>

          <div class="rds-api-row">
            <span>Авто</span>
            <b>${carName}</b>
          </div>

          <div class="rds-api-row">
            <span>Национальность</span>
            <b>${driver.nationality || '—'}</b>
          </div>

          <button class="rds-api-link-btn" onclick="openDriverDetail('${driver.id}')">
            открыть профиль →
          </button>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.error('Drivers API error:', error);
    renderApiError(container, error, '/api/drivers');
  }
}

async function renderTeamsFromApi() {
  const container = document.getElementById('teams-grid');
  if (!container) return;

  renderApiLoading(container, '/api/teams');

  try {
    const teams = await window.RDS_API.getTeams();

    if (!teams.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--dim);">
          Нет команд в API.
        </div>
      `;
      return;
    }

    container.innerHTML = teams.map((team) => `
      <article class="rds-api-card">
        <div class="rds-api-card-top">
          <div class="rds-api-number">${team.rosterCount ?? 0}</div>
          <div class="rds-api-tag">TEAM</div>
        </div>

        <div class="rds-api-title">${team.name || 'Без названия'}</div>
        <div class="rds-api-sub">${team.description || 'Описание пока не добавлено'}</div>

        <div class="rds-api-row">
          <span>Пилотов</span>
          <b>${team.rosterCount ?? 0}</b>
        </div>

        <button class="rds-api-link-btn" onclick="openTeamDetail('${team.id}')">
          открыть команду →
        </button>
      </article>
    `).join('');
  } catch (error) {
    console.error('Teams API error:', error);
    renderApiError(container, error, '/api/teams');
  }
}

async function renderCarsFromApi() {
  const container = document.getElementById('cars-grid');
  if (!container) return;

  renderApiLoading(container, '/api/cars');

  try {
    const cars = await window.RDS_API.getCars();

    if (!cars.length) {
      container.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--dim);">
          Нет автомобилей в API.
        </div>
      `;
      return;
    }

    container.innerHTML = cars.map((car) => {
      const driverName = car.driver?.fullName || 'Пилот не указан';
      const modelName = car.modelName || car.displayName || metaValue(car.model);

      return `
        <article class="rds-api-card">
          <div class="rds-api-card-top">
            <div class="rds-api-number">CAR</div>
            <div class="rds-api-tag">TECH</div>
          </div>

          <div class="rds-api-title">${modelName}</div>
          <div class="rds-api-sub">${driverName}</div>

          <div class="rds-api-row">
            <span>Пилот</span>
            <b>${driverName}</b>
          </div>

          <button class="rds-api-link-btn" onclick="openCarDetail('${car.id}')">
            открыть техкарту →
          </button>
        </article>
      `;
    }).join('');
  } catch (error) {
    console.error('Cars API error:', error);
    renderApiError(container, error, '/api/cars');
  }
}

async function openDriverDetail(driverId) {
  const container = document.getElementById('drivers-grid');
  if (!container) return;

  renderApiLoading(container, `/api/drivers/${driverId}`);

  try {
    const driver = await window.RDS_API.getDriver(driverId);
    const car = driver.currentCar;
    const team = driver.currentTeam;

    container.innerHTML = `
      <article class="rds-api-detail-card">
        <button class="rds-api-link-btn" onclick="renderDriversFromApi()">← назад к пилотам</button>

        <div class="rds-api-detail-head">
          <div class="rds-api-number">#${driver.number ?? '—'}</div>
          <div>
            <div class="rds-api-title">${driver.fullName}</div>
            <div class="rds-api-sub">${team?.name || 'Команда не указана'}</div>
          </div>
        </div>

        <div class="rds-api-detail-grid">
          <div class="rds-api-row"><span>Город</span><b>${metaValue(driver.city)}</b></div>
          <div class="rds-api-row"><span>Дата рождения</span><b>${metaValue(driver.birthDate)}</b></div>
          <div class="rds-api-row"><span>Автомобиль</span><b>${car?.displayName || '—'}</b></div>
          <div class="rds-api-row"><span>Источник</span><b>${driver.source?.source_type || '—'}</b></div>
        </div>

        <div style="margin-top:14px;font-size:11px;color:var(--dim);font-family:var(--mono);">
          ${driver.source?.source_url ? `<a href="${driver.source.source_url}" target="_blank" style="color:var(--accent);text-decoration:none;">${driver.source.source_url}</a>` : ''}
        </div>
      </article>
    `;
  } catch (error) {
    renderApiError(container, error, `/api/drivers/${driverId}`);
  }
}

async function openTeamDetail(teamId) {
  const container = document.getElementById('teams-grid');
  if (!container) return;

  renderApiLoading(container, `/api/teams/${teamId}`);

  try {
    const team = await window.RDS_API.getTeam(teamId);

    container.innerHTML = `
      <article class="rds-api-detail-card">
        <button class="rds-api-link-btn" onclick="renderTeamsFromApi()">← назад к командам</button>

        <div class="rds-api-detail-head">
          <div class="rds-api-number">${team.roster?.length ?? 0}</div>
          <div>
            <div class="rds-api-title">${team.name}</div>
            <div class="rds-api-sub">${team.description || 'Описание пока не добавлено'}</div>
          </div>
        </div>

        <div class="rds-api-section-title">Состав</div>

        <div class="rds-api-mini-list">
          ${(team.roster || []).length
            ? team.roster.map((member) => `
                <div class="rds-api-mini-row">
                  <span>${member.driver?.fullName || '—'}</span>
                  <b>${member.car?.displayName || '—'}</b>
                </div>
              `).join('')
            : '<div style="color:var(--dim);font-size:12px;">Состав не связан с импортированными пилотами.</div>'
          }
        </div>
      </article>
    `;
  } catch (error) {
    renderApiError(container, error, `/api/teams/${teamId}`);
  }
}

async function openCarDetail(carId) {
  const container = document.getElementById('cars-grid');
  if (!container) return;

  renderApiLoading(container, `/api/cars/${carId}`);

  try {
    const car = await window.RDS_API.getCar(carId);
    const tech = car.technicalCard || {};

    container.innerHTML = `
      <article class="rds-api-detail-card">
        <button class="rds-api-link-btn" onclick="renderCarsFromApi()">← назад к автомобилям</button>

        <div class="rds-api-detail-head">
          <div class="rds-api-number">CAR</div>
          <div>
            <div class="rds-api-title">${car.displayName}</div>
            <div class="rds-api-sub">${car.driver?.fullName || 'Пилот не указан'}</div>
          </div>
        </div>

        <div class="rds-api-detail-grid">
          <div class="rds-api-row"><span>Модель</span><b>${metaValue(car.model)}</b></div>
          <div class="rds-api-row"><span>Двигатель</span><b>${metaValue(tech.engine)}</b></div>
          <div class="rds-api-row"><span>Объём</span><b>${metaValue(tech.displacementLiters)} л</b></div>
          <div class="rds-api-row"><span>Мощность</span><b>${metaValue(tech.horsepower)} ${tech.horsepower?.unit || 'hp'}</b></div>
          <div class="rds-api-row"><span>Момент</span><b>${metaValue(tech.torque)} ${tech.torque?.unit || 'Nm'}</b></div>
          <div class="rds-api-row"><span>Подвеска</span><b>${metaValue(tech.suspensionSetup)}</b></div>
        </div>

        <div style="margin-top:14px;font-size:11px;color:var(--dim);font-family:var(--mono);">
          ${car.model?.source_url ? `<a href="${car.model.source_url}" target="_blank" style="color:var(--accent);text-decoration:none;">${car.model.source_url}</a>` : ''}
        </div>
      </article>
    `;
  } catch (error) {
    renderApiError(container, error, `/api/cars/${carId}`);
  }
}

// ─── INIT ──────────────────────────────────────────────────────
(function init() {
  renderStandings();
  renderLive();
  renderCalendar();
  renderTelemDriverSel();
  renderTelemStats();
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (document.getElementById('tab-telemetry').classList.contains('active')) {
        setTimeout(drawTelemCharts, 50);
      }
    });
  });
})();

window.switchTab = switchTab;
window.setCalYear = setCalYear;
window.setStandingsYear = setStandingsYear;
window.selectTelemDriver = selectTelemDriver;

window.renderDriversFromApi = renderDriversFromApi;
window.renderTeamsFromApi = renderTeamsFromApi;
window.renderCarsFromApi = renderCarsFromApi;

window.openDriverDetail = openDriverDetail;
window.openTeamDetail = openTeamDetail;
window.openCarDetail = openCarDetail;

if (typeof openTrackFromCalendar === 'function') {
  window.openTrackFromCalendar = openTrackFromCalendar;
}