// ─── CONFIG ─────────────────────────────────────────────
const CLAUDE_MODEL = "node-ai-proxy";
const AI_PROXY_URL = `${window.location.origin}/ai/chat`;

// Keep this equal to APP_BEARER_TOKEN in your .env for local dev.
const APP_BEARER_TOKEN = "change_this_to_a_long_random_secret_min_32_chars";

let runCount = 0;

// ─── HARD-CODED DRIVER IMAGES ONLY ───────────────────────
// Driver data still comes from /api/drivers.
// Images are frontend-only fallbacks because generated drivers currently have profilePhotoUrl: null.
const DRIVER_IMAGE_MAP = {
  "caregradcev-arkadij": "https://rdsgp.com/images/s234350/pilots/174561446468241.jpg",
  "chivchyan-georgij": "https://rdsgp.com/images/s234350/pilots/174561449636535.jpg",
  "shabanov-artem": "https://rdsgp.com/images/s234350/pilots/174561453349920.jpg",
  "idiyatulin-damir": "https://rdsgp.com/images/s234350/pilots/174561341117688.jpg",
  "kozlov-anton": "https://rdsgp.com/images/s234350/pilots/174561358894696.jpg",
  "dobrovolskij-timofej": "https://rdsgp.com/images/s234350/pilots/17456131857324.jpg",
  "losev-evgenij": "https://rdsgp.com/images/s234350/pilots/174561380192839.jpg",
  "grossman-maksim": "https://rdsgp.com/images/s234350/pilots/174561306566849.jpg",
  "tivodar-roman": "https://rdsgp.com/images/s234350/pilots/174561432427756.jpg",
  "popov-ilya": "https://rdsgp.com/images/s234350/pilots/174561408629651.jpg",
  "shnajder-leonid": "https://rdsgp.com/images/s234350/pilots/174561458551821.jpg",
  "skorobogatov-danila": "https://rdsgp.com/images/s234350/pilots/17456142288374.jpg",
  "astapov-andrej": "https://rdsgp.com/images/s234350/pilots/174561262667848.jpg",
  "klyamko-anton": "https://rdsgp.com/images/s234350/pilots/174561354112537.jpg",
  "vorobev-danila": "https://rdsgp.com/images/s234350/pilots/174561293011637.jpg",
  "migal-denis": "https://rdsgp.com/images/s234350/pilots/174561388917349.jpg",
  "mackevich-kirill": "https://rdsgp.com/images/s234350/pilots/174561385222726.jpg",
  "kuznecov-sergej": "https://rdsgp.com/images/s234350/pilots/174561373126096.jpg",
  "sak-sergej": "https://rdsgp.com/images/s234350/pilots/174561416966550.jpg",
  "kozlov-aleksej": "https://rdsgp.com/images/s234350/pilots/174561356651716.jpg"
};

function getDriverImage(driver) {
  return driver?.profilePhotoUrl || DRIVER_IMAGE_MAP[driver?.id] || null;
}

// ─── HISTORY ─────────────────────────────────────────────
let analysisHistory = [];

try {
  analysisHistory = JSON.parse(localStorage.getItem("rds_history") || "[]");
} catch {
  analysisHistory = [];
}

function saveHistory(entry) {
  analysisHistory.unshift(entry);
  if (analysisHistory.length > 20) {
    analysisHistory = analysisHistory.slice(0, 20);
  }

  try {
    localStorage.setItem("rds_history", JSON.stringify(analysisHistory));
  } catch {
    // Ignore localStorage failures.
  }

  renderHistory();
}

function renderHistory() {
  let panel = document.getElementById("historyPanel");
  let list = document.getElementById("historyList");

  if (!panel || !list) {
    const outputCol = document.getElementById("outputCol");
    if (!outputCol) return;

    panel = document.createElement("div");
    panel.id = "historyPanel";
    panel.className = "info-card";
    panel.style.display = "none";

    panel.innerHTML = `
      <div class="info-card-header">
        <div class="info-card-title">История анализов</div>
        <div class="info-card-tag">LOCAL</div>
      </div>
      <div id="historyList" class="info-card-body"></div>
    `;

    outputCol.appendChild(panel);
    list = document.getElementById("historyList");
  }

  if (analysisHistory.length === 0) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  list.innerHTML = analysisHistory.map((h) => `
    <div
      style="background:var(--card);border:1px solid var(--rim);border-radius:3px;padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer;"
      onclick='setDriver(${toJsString(h.driver)})'
    >
      <div>
        <div style="font-family:var(--mono);font-size:10px;color:var(--text)">${escapeHtml(h.driver)}</div>
        <div style="font-size:9px;color:var(--dim);margin-top:2px">${escapeHtml(h.track)} · ${escapeHtml(h.date)}</div>
      </div>
      <div style="font-family:var(--head);font-size:16px;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">
        ${escapeHtml(h.score)}
      </div>
    </div>
  `).join("");
}

// ─── HELPERS ────────────────────────────────────────────
function setDriver(name) {
  const input = document.getElementById("driverInput");
  if (!input) return;

  input.value = name;
  input.dispatchEvent(new Event("change"));
}

function log(msg, type = "") {
  const c = document.getElementById("logContainer");
  if (!c) return;

  const ts = new Date().toTimeString().split(" ")[0];
  const el = document.createElement("div");
  el.className = `log-line ${type}`;
  el.innerHTML = `<span class="ts">${ts}</span> ${escapeHtml(msg)}`;
  c.appendChild(el);
  c.scrollTop = c.scrollHeight;
}

function setNode(id, state) {
  const node = document.getElementById(`node-${id}`);
  const name = document.getElementById(`name-${id}`);

  if (node) node.className = `flow-node ${state || ""}`;
  if (name) name.className = `flow-name ${state || ""}`;
}

function resetNodes() {
  ["A", "B", "C", "D"].forEach((id) => setNode(id, ""));
}

function normalizeName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^а-яa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function realValue(value) {
  if (value === null || value === undefined) return false;

  if (typeof value === "object" && "value" in value) {
    value = value.value;
  }

  const text = String(value || "").trim().toLowerCase();

  if (!text) return false;

  return ![
    "unknown",
    "неизвестно",
    "нет данных",
    "n/a",
    "none",
    "null",
    "estimated",
    "оценка",
    "не указано",
    "—",
    "-"
  ].includes(text);
}

function metaValue(field, fallback = "—") {
  if (field === null || field === undefined) return fallback;
  if (typeof field === "object" && "value" in field) return field.value ?? fallback;
  return field || fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toJsString(value) {
  return JSON.stringify(String(value ?? ""));
}

function metricCard(label, value, sub = "", color = "var(--text)") {
  return `
    <div style="
      border:1px solid var(--rim);
      background:rgba(255,255,255,.025);
      border-radius:14px;
      padding:14px;
      min-height:82px;
    ">
      <div style="font-family:var(--mono);font-size:9px;color:var(--dim);text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px;">
        ${escapeHtml(label)}
      </div>
      <div style="font-family:var(--head);font-size:25px;font-weight:900;font-style:italic;line-height:1;color:${color};">
        ${escapeHtml(value)}
      </div>
      ${sub ? `<div style="margin-top:6px;font-size:10px;color:var(--dim);line-height:1.35;">${escapeHtml(sub)}</div>` : ""}
    </div>
  `;
}

function compactList(items, emptyText = "Нет данных") {
  if (!items || !items.length) {
    return `<div style="font-size:12px;color:var(--dim);">${escapeHtml(emptyText)}</div>`;
  }

  return items.map((item) => `
    <div style="
      display:flex;
      gap:8px;
      align-items:flex-start;
      padding:8px 0;
      border-bottom:1px solid rgba(255,255,255,.05);
      font-size:12px;
      color:var(--mid);
      line-height:1.45;
    ">
      <span style="color:var(--accent);font-family:var(--mono);font-size:11px;">▸</span>
      <span>${escapeHtml(item)}</span>
    </div>
  `).join("");
}

function confidenceColor(conf) {
  if (conf >= 75) return "var(--safe)";
  if (conf >= 55) return "var(--warn)";
  return "var(--crit)";
}

// ─── TRACK DATABASE ───────────────────────────────────────
const TRACK_DB = {
  auto: {
    id: "auto",
    apiTrackId: "moscow-raceway",
    name: "Авто-определение",
    city: "Moscow",
    venue: "Авто-определение",
    surface: "Не определено",
    zones: 5,
    layout: "Автоматическое определение трассы на основе выбранного этапа."
  },
  moscow_raceway: {
    id: "moscow_raceway",
    apiTrackId: "moscow-raceway",
    name: "Moscow Raceway",
    city: "Volokolamsk",
    venue: "Moscow Raceway, Волоколамск",
    surface: "Гладкий гоночный асфальт",
    zones: 5,
    layout: "Широкий скоростной вход, длинная дуга с контролем угла, технический выход из шпильки."
  },
  igora: {
    id: "igora",
    apiTrackId: "igora-drive",
    name: "Igora Drive",
    city: "Saint Petersburg",
    venue: "Igora Drive, Ленинградская область",
    surface: "FIA-grade асфальт",
    zones: 6,
    layout: "Быстрые входы с длинными дугами, переходы под нагрузкой и техничный финальный сектор."
  },
  nring: {
    id: "nring",
    apiTrackId: "nring",
    name: "NRing",
    city: "Nizhny Novgorod",
    venue: "NRing, Нижегородская область",
    surface: "Абразивный асфальт",
    zones: 5,
    layout: "Узкие зоны с бетонными стенами, высокий риск контакта, агрессивные перекладки."
  },
  adm: {
    id: "adm",
    apiTrackId: "adm-raceway",
    name: "ADM Raceway",
    city: "Moscow",
    venue: "ADM Raceway, Мячково",
    surface: "Технический асфальт",
    zones: 4,
    layout: "Короткий техничный конфиг, плотные клипы и высокая зависимость от точности перекладок."
  },
  red_ring: {
    id: "red_ring",
    apiTrackId: "redring",
    name: "Red Ring",
    city: "Krasnoyarsk",
    venue: "Red Ring, Красноярск",
    surface: "Высокое сцепление, асфальт",
    zones: 5,
    layout: "Скоростной вход с мощной загрузкой, длинные дуги и критические зоны у внешних клипов."
  },
  rostov_arena: {
    id: "rostov_arena",
    apiTrackId: "rostov-arena",
    name: "Ростов Арена",
    city: "Rostov-on-Don",
    venue: "Ростов Арена, Ростов-на-Дону",
    surface: "Временный асфальт",
    zones: 4,
    layout: "Городская конфигурация с ограниченными зонами безопасности и нестабильным зацепом."
  },
  atron: {
    id: "atron",
    apiTrackId: null,
    name: "ATRON International Circuit",
    city: "Ryazan",
    venue: "ATRON, Рязань",
    surface: "Гоночный асфальт",
    zones: 5,
    layout: "Комбинация скоростных и техничных секций, важна стабильность угла на дуге."
  },
  chelyabinsk: {
    id: "chelyabinsk",
    apiTrackId: null,
    name: "Трасса 74",
    city: "Chelyabinsk",
    venue: "Трасса 74, Челябинск",
    surface: "Средний зацеп",
    zones: 4,
    layout: "Локальная техничная трасса с короткими перекладками и ограниченным пространством."
  },
  kazan: {
    id: "kazan",
    apiTrackId: null,
    name: "KazanRing Canyon",
    city: "Kazan",
    venue: "KazanRing Canyon, Казань",
    surface: "Гладкий асфальт",
    zones: 5,
    layout: "Перепады высот, слепые зоны и техничные входы с высокой нагрузкой на подвеску."
  }
};

window.TRACK_DB = TRACK_DB;

const CITY_COORDS = {
  Moscow: [55.5915, 37.9975],
  Volokolamsk: [56.0786, 35.9467],
  "Saint Petersburg": [60.1040, 30.3016],
  "Nizhny Novgorod": [56.1300, 43.5120],
  Krasnoyarsk: [56.0097, 92.7917],
  "Rostov-on-Don": [47.2096, 39.7388],
  Ryazan: [54.6020, 39.7440],
  Chelyabinsk: [55.1600, 61.4026],
  Kazan: [55.8304, 49.0661]
};

const WMO = {
  0: "Ясно",
  1: "Преимущественно ясно",
  2: "Переменная облачность",
  3: "Пасмурно",
  45: "Туман",
  51: "Лёгкая морось",
  61: "Лёгкий дождь",
  63: "Дождь",
  65: "Сильный дождь",
  80: "Ливень",
  95: "Гроза",
  99: "Гроза с градом"
};

// ─── WEATHER FETCH ────────────────────────────────────────
async function fetchWeather(city) {
  const coords = CITY_COORDS[city] || CITY_COORDS.Moscow;
  const [lat, lon] = coords;

  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation,weather_code` +
    `&wind_speed_unit=kmh&timezone=auto`;

  try {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Open-Meteo HTTP ${r.status}`);

    const d = await r.json();
    const c = d.current || {};

    const airTemp = Number(c.temperature_2m ?? 22);
    const code = Number(c.weather_code ?? 0);
    const solarOffset = code <= 2 ? 15 : code <= 3 ? 6 : 1;

    return {
      air_temp_c: airTemp,
      asphalt_temp_c: Math.round((airTemp + solarOffset) * 10) / 10,
      humidity_pct: Number(c.relative_humidity_2m ?? 55),
      wind_speed_kmh: Number(c.wind_speed_10m ?? 8),
      precipitation_mm: Number(c.precipitation ?? 0),
      condition: WMO[code] || "Неизвестно",
      source: "Open-Meteo"
    };
  } catch {
    return {
      air_temp_c: 22,
      asphalt_temp_c: 38,
      humidity_pct: 55,
      wind_speed_kmh: 8,
      precipitation_mm: 0,
      condition: "Данные недоступны",
      source: "fallback_estimated"
    };
  }
}

// ─── NODE API CONTEXT + CONFIDENCE ──────────────────────
async function safeApiCall(apiFunction, fallback) {
  try {
    if (typeof apiFunction !== "function") return fallback;
    return await apiFunction();
  } catch {
    return fallback;
  }
}

async function buildNodeRdsContext(driverName, track) {
  const context = {
    driver: null,
    car: null,
    team: null,
    track: null,
    events: [],
    sources: {
      driverProfileFound: false,
      carSpecsFound: false,
      teamFound: false,
      trackContextFound: false,
      eventContextFound: false,
      officialResultsFound: false
    }
  };

  if (!window.RDS_API) return context;

  const [drivers, events, tracks] = await Promise.all([
    safeApiCall(window.RDS_API.getDrivers, []),
    safeApiCall(window.RDS_API.getEvents, []),
    safeApiCall(window.RDS_API.getTracks, [])
  ]);

  context.events = Array.isArray(events) ? events : [];
  context.sources.eventContextFound = context.events.length > 0;

  const wanted = normalizeName(driverName);

  const driverSummary =
    drivers.find((d) => normalizeName(d.fullName) === wanted) ||
    drivers.find((d) => normalizeName(d.fullName).includes(wanted)) ||
    drivers.find((d) => wanted.includes(normalizeName(d.fullName)));

  if (driverSummary) {
    context.driver = await window.RDS_API.getDriver(driverSummary.id).catch(() => driverSummary);
    context.sources.driverProfileFound = true;

    const carId = context.driver.currentCarId || context.driver.currentCar?.id;

    if (carId) {
      context.car = await window.RDS_API.getCar(carId).catch(() => null);
    }

    const teamId = context.driver.currentTeamId || context.driver.currentTeam?.id;

    if (teamId) {
      context.team = await window.RDS_API.getTeam(teamId).catch(() => null);
      context.sources.teamFound = Boolean(context.team);
    }
  }

  if (context.car) {
    const tech = context.car.technicalCard || {};

    context.sources.carSpecsFound =
      realValue(context.car.displayName) ||
      realValue(context.car.model) ||
      realValue(tech.engine) ||
      realValue(tech.horsepower) ||
      realValue(tech.displacementLiters);
  }

  const matchedTrack = track.apiTrackId
    ? tracks.find((t) => t.id === track.apiTrackId)
    : tracks.find((t) => {
        const apiName = normalizeName(t.name);
        const uiName = normalizeName(track.name || track.venue);
        return uiName.includes(apiName) || apiName.includes(uiName);
      });

  if (matchedTrack) {
    context.track = await window.RDS_API.getTrack(matchedTrack.id).catch(() => matchedTrack);
    context.sources.trackContextFound = Boolean(context.track);
  }

  // Keep false until detailed season result rows are imported.
  context.sources.officialResultsFound = false;

  return context;
}

function calculateNodeConfidence(context) {
  let confidence = 35;

  if (context.sources.driverProfileFound) confidence += 20;

  if (context.sources.carSpecsFound) confidence += 20;
  else confidence -= 10;

  if (context.sources.officialResultsFound) confidence += 15;
  else confidence -= 10;

  if (context.sources.trackContextFound || context.sources.eventContextFound) confidence += 10;

  // Weather is fetched before the AI request.
  confidence += 5;

  // Node-only mode is valid, but detailed result history is not imported yet.
  confidence -= 3;

  return Math.max(15, Math.min(85, Math.round(confidence)));
}

// ─── AI SYSTEM PROMPT ────────────────────────────────────
const SYSTEM_PROMPT = `Ты — DRIFT-ANALYST, элитная система анализа дрифта для РДС.

КРИТИЧЕСКАЯ ИНСТРУКЦИЯ ПО ДАННЫМ:
1. НИКОГДА не выдумывай официальную телеметрию.
2. В текущей версии проекта официальная телеметрия не используется.
3. НЕ используй отсутствие телеметрии как главный фактор уверенности.
4. НЕ изобретай скорость, угол, траекторию, клип-зоны или официальные технические данные.
5. Используй только предоставленные данные: профиль пилота, авто, команда, трасса, погода.
6. Итоговый рейтинг уверенности будет рассчитан программно после ответа модели.
7. Весь вывод строго на русском языке.

ФОРМАТ ВЫВОДА — отвечай ТОЛЬКО валидным JSON-объектом. Без markdown, без преамбулы.
Схема:
{
  "идентификация_гонщика": "<имя и команда>",
  "характеристики_авто": "<марка, двигатель, л.с., детали сетапа>",
  "снимок_условий": "<погода + состояние трассы>",
  "официальные_данные": {
    "результаты_найдены": false,
    "характеристики_авто_найдены": false,
    "телеметрия_найдена": false
  },
  "прогноз_ии": {
    "ожидаемый_диапазон_баллов": "<например 64-78 баллов>",
    "наиболее_вероятный": 70,
    "риск_ошибок": "<конкретные вероятные ошибки>",
    "тактическое_преимущество": "<где данный гонщик/авто выигрывает>"
  },
  "предупреждения_об_отсутствии_данных": [],
  "разбивка_по_секторам": {
    "КЗ-1": { "ожидаемые_баллы": 14.5, "уровень_риска": "СРЕДНИЙ", "примечание": "Инициация и первый вход." },
    "КЗ-2": { "ожидаемые_баллы": 14.5, "уровень_риска": "СРЕДНИЙ", "примечание": "Основная дуга." },
    "КЗ-3": { "ожидаемые_баллы": 14.5, "уровень_риска": "СРЕДНИЙ", "примечание": "Переход." },
    "КЗ-4": { "ожидаемые_баллы": 14.5, "уровень_риска": "СРЕДНИЙ", "примечание": "Техническая зона." },
    "КЗ-5": { "ожидаемые_баллы": 14.5, "уровень_риска": "СРЕДНИЙ", "примечание": "Финишный сектор." }
  },
  "оценка_рисков": {
    "вероятность_нулевого_заезда_проц": 20,
    "основные_риски": ["риск 1", "риск 2", "риск 3"],
    "механический_риск": "СРЕДНИЙ",
    "влияние_погоды": "влияние условий"
  },
  "тактический_анализ": {
    "преимущества": ["преимущество 1", "преимущество 2"],
    "недостатки": ["недостаток 1", "недостаток 2"],
    "оптимальная_стратегия": "рекомендуемый подход",
    "синергия_с_трассой": 0.65
  },
  "рейтинг_уверенности": 0,
  "техническое_обоснование": "3-4 предложения технического анализа."
}

Правила:
- Баллы за заезд: 0-100.
- Реалистичный соревновательный прогноз обычно в диапазоне 55-85.
- Для разбивки по секторам всегда возвращай минимум КЗ-1, КЗ-2, КЗ-3, КЗ-4, КЗ-5.
- Не утверждай наличие телеметрии.
- Не добавляй markdown.
- Не добавляй текст вне JSON.`;

// ─── NODE AI PROXY CALL ───────────────────────────────────
async function callClaudeAPI(driverName, weather, track, rdsContext) {
  const driver = rdsContext?.driver;
  const car = rdsContext?.car;
  const team = rdsContext?.team;
  const tech = car?.technicalCard || {};

  const driverDisplay = driver?.fullName || driverName;
  const teamDisplay = team?.name || driver?.currentTeam?.name || "не указана";
  const carDisplay = car?.displayName || driver?.currentCar?.displayName || "не указан";

  const engine = metaValue(tech.engine, "не указан");
  const hp = metaValue(tech.horsepower, "не указана");
  const displacement = metaValue(tech.displacementLiters, "не указан");

  const sourceUrl =
    car?.model?.source_url ||
    tech.engine?.source_url ||
    tech.horsepower?.source_url ||
    driver?.source?.source_url ||
    null;

  const userPrompt = `
ГОНЩИК: ${driverDisplay}
КОМАНДА: ${teamDisplay}

ОФИЦИАЛЬНЫЙ КОНТЕКСТ ИЗ NODE API:
Профиль пилота найден: ${Boolean(rdsContext?.sources?.driverProfileFound)}
Авто-профиль найден: ${Boolean(rdsContext?.sources?.carSpecsFound)}
Команда найдена: ${Boolean(rdsContext?.sources?.teamFound)}
Контекст трассы найден: ${Boolean(rdsContext?.sources?.trackContextFound)}
События сезона доступны: ${Boolean(rdsContext?.sources?.eventContextFound)}
Подробная история результатов импортирована: ${Boolean(rdsContext?.sources?.officialResultsFound)}

АВТОМОБИЛЬ:
Модель: ${carDisplay}
Двигатель: ${engine}
Рабочий объём: ${displacement}
Мощность: ${hp}
Источник: ${sourceUrl || "URL не указан"}

ТРАССА:
Трасса: ${track.venue}
Покрытие: ${track.surface}
Клип-зоны: ${track.zones}
Конфигурация: ${track.layout}

УСЛОВИЯ:
Воздух ${weather.air_temp_c}°C
Асфальт ~${weather.asphalt_temp_c}°C
Влажность ${weather.humidity_pct}%
Ветер ${weather.wind_speed_kmh} км/ч
Осадки ${weather.precipitation_mm} мм
Погода: ${weather.condition}

ВАЖНО:
- Не используй Python/FastAPI.
- Не выдумывай официальную телеметрию.
- Не выдумывай скорость, угол, траекторию или фактические клип-зоны.
- Для секторной таблицы верни ${track.zones || 5} зон.
- Если подробной истории результатов нет, учти это только в анализе, но не показывай пользователю технический debug.
- Рейтинг уверенности будет заменён программно после ответа модели.

Весь вывод на русском языке.`.trim();

  const response = await fetch(AI_PROXY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${APP_BEARER_TOKEN}`
    },
    body: JSON.stringify({
      message: userPrompt,
      system: SYSTEM_PROMPT
    })
  });

  if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);

  const data = await response.json();

  if (!data.ok || !data.output_text) {
    throw new Error("Неверный ответ API");
  }

  let raw = data.output_text.trim().replace(/^```[a-z]*\n?/i, "").replace(/\n?```$/, "");

  let prediction;

  try {
    prediction = JSON.parse(raw);
  } catch (err) {
    console.error("RAW AI OUTPUT:", raw);
    throw new Error(`AI вернул невалидный JSON: ${err.message}`);
  }

  prediction.рейтинг_уверенности = calculateNodeConfidence(rdsContext);

  prediction.официальные_данные = {
    ...(prediction.официальные_данные || {}),
    результаты_найдены: Boolean(rdsContext?.sources?.officialResultsFound),
    характеристики_авто_найдены: Boolean(rdsContext?.sources?.carSpecsFound),
    телеметрия_найдена: false
  };

  prediction._meta = {
    ...(prediction._meta || {}),
    pipeline_version: "node-only-no-python",
    model_used: CLAUDE_MODEL,
    confidence_model: "node_api_driver_car_track_weather",
    telemetry_used_for_confidence: false,
    official_results_count: rdsContext?.sources?.officialResultsFound ? 1 : 0
  };

  return prediction;
}

// ─── SECTOR NORMALIZER ───────────────────────────────────
function normalizeSectorRows(pred, track, score) {
  const raw = pred.разбивка_по_секторам;
  let sectors = [];

  if (Array.isArray(raw)) {
    sectors = raw.map((s, index) => ({
      зона: s.зона || s.zone || `КЗ-${index + 1}`,
      ожидаемые_баллы: s.ожидаемые_баллы ?? s.points ?? null,
      уровень_риска: s.уровень_риска || s.risk || "СРЕДНИЙ",
      примечание: s.примечание || s.note || "AI-анализ зоны."
    }));
  } else if (raw && typeof raw === "object") {
    sectors = Object.entries(raw).map(([key, val]) => ({
      зона: key,
      ожидаемые_баллы: val?.ожидаемые_баллы ?? val?.points ?? null,
      уровень_риска: val?.уровень_риска || val?.risk || "СРЕДНИЙ",
      примечание: val?.примечание || val?.note || "AI-анализ зоны."
    }));
  }

  const expectedCount = Math.max(1, Number(track.zones || 5));
  const averageScore = Number.isFinite(Number(score)) ? Number(score) / expectedCount : 14;

  const existingByZone = new Map(
    sectors.map((s) => [String(s.зона || "").toUpperCase(), s])
  );

  const fallbackNotes = [
    "Инициация и первый вход: важно сохранить угол без потери скорости.",
    "Основная дуга: оценка стабильности, линии и контроля газа.",
    "Переход: критична точность перекладки и удержание траектории.",
    "Технический сектор: риск ошибки выше при низком сцеплении.",
    "Финальный сектор: важно завершить заезд без коррекции и потери линии.",
    "Дополнительная зона: оценка плавности и стабильности."
  ];

  const normalized = [];

  for (let i = 1; i <= expectedCount; i += 1) {
    const zoneName = `КЗ-${i}`;
    const existing = existingByZone.get(zoneName.toUpperCase());

    if (existing) {
      normalized.push({
        зона: zoneName,
        ожидаемые_баллы: Number(existing.ожидаемые_баллы ?? averageScore),
        уровень_риска: existing.уровень_риска || "СРЕДНИЙ",
        примечание: existing.примечание || fallbackNotes[i - 1] || fallbackNotes[fallbackNotes.length - 1]
      });
    } else {
      normalized.push({
        зона: zoneName,
        ожидаемые_баллы: Number((averageScore + (i % 2 === 0 ? 0.4 : -0.2)).toFixed(1)),
        уровень_риска: i === 1 || i === expectedCount ? "СРЕДНИЙ" : "НИЗКИЙ",
        примечание: fallbackNotes[i - 1] || fallbackNotes[fallbackNotes.length - 1]
      });
    }
  }

  return normalized;
}

// ─── RENDER RESULTS ──────────────────────────────────────
function renderResults(pred, weather, track, driverName) {
  const col = document.getElementById("outputCol");
  if (!col) return;

  const ap = pred.прогноз_ии || {};
  const ra = pred.оценка_рисков || {};
  const ta = pred.тактический_анализ || {};

  const conf = Number(pred.рейтинг_уверенности || 50);
  const score = Number(ap.наиболее_вероятный || 65);
  const sectors = normalizeSectorRows(pred, track, score);
  const zeroPct = Number(ra.вероятность_нулевого_заезда_проц || 20);
  const synergy = Number(ta.синергия_с_трассой || 0.65) * 100;

  const circumference = 2 * Math.PI * 32;
  const confOffset = circumference * (1 - conf / 100);
  const confColor = confidenceColor(conf);

  const mechColor = ra.механический_риск === "ВЫСОКИЙ"
    ? "var(--crit)"
    : ra.механический_риск === "СРЕДНИЙ"
      ? "var(--warn)"
      : "var(--safe)";

  const zeroColor = zeroPct > 30
    ? "var(--crit)"
    : zeroPct > 18
      ? "var(--warn)"
      : "var(--safe)";

  const riskTags = (ra.основные_риски || []).map((r, i) => {
    const cls = i === 0 ? "crit" : i === 1 ? "warn" : "low";
    return `<div class="risk-tag ${cls}">${escapeHtml(r)}</div>`;
  }).join("");

  const RISK_RU = {
    "НИЗКИЙ": "LOW",
    "СРЕДНИЙ": "MEDIUM",
    "ВЫСОКИЙ": "HIGH",
    "КРИТИЧЕСКИЙ": "CRITICAL"
  };

  const sectorRows = sectors.map((s) => `
    <tr>
      <td>${escapeHtml(s.зона || "—")}</td>
      <td>${s.ожидаемые_баллы !== undefined ? Number(s.ожидаемые_баллы).toFixed(1) : "—"}</td>
      <td><span class="risk-pill ${escapeHtml(RISK_RU[s.уровень_риска] || s.уровень_риска || "")}">${escapeHtml(s.уровень_риска || "—")}</span></td>
      <td>${escapeHtml(s.примечание || "—")}</td>
    </tr>
  `).join("");

  const confText = conf >= 75
    ? "Высокая уверенность: профиль пилота, авто-профиль и контекст трассы найдены."
    : conf >= 55
      ? "Средняя уверенность: доступна часть официального контекста, но история результатов пока неполная."
      : "Низкая уверенность: официальных данных недостаточно, прогноз нужно читать осторожно.";

  const reasoning = pred.техническое_обоснование || pred.цепочка_рассуждений || "Недоступна.";

  col.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:14px;">

      <div class="animate-in" style="
        border:1px solid var(--rim);
        border-radius:20px;
        padding:18px;
        overflow:hidden;
        background:
          radial-gradient(circle at top left, rgba(255,0,102,.18), transparent 34%),
          radial-gradient(circle at bottom right, rgba(0,217,255,.14), transparent 38%),
          linear-gradient(135deg, rgba(255,255,255,.045), rgba(255,255,255,.018));
        box-shadow:0 18px 45px rgba(0,0,0,.28);
      ">
        <div style="display:grid;grid-template-columns:1fr auto;gap:18px;align-items:center;">
          <div>
            <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;">
              <span style="font-family:var(--mono);font-size:9px;color:var(--accent);border:1px solid rgba(255,0,102,.35);background:rgba(255,0,102,.08);border-radius:99px;padding:4px 9px;">AI PREDICTION</span>
              <span style="font-family:var(--mono);font-size:9px;color:var(--secondary);border:1px solid rgba(0,217,255,.35);background:rgba(0,217,255,.08);border-radius:99px;padding:4px 9px;">RDS DATA</span>
            </div>

            <div style="font-family:var(--mono);font-size:10px;color:var(--dim);text-transform:uppercase;letter-spacing:.9px;margin-bottom:5px;">
              Гонщик
            </div>
            <div style="font-family:var(--head);font-size:28px;font-weight:900;font-style:italic;line-height:1.05;color:var(--text);margin-bottom:10px;">
              ${escapeHtml(pred.идентификация_гонщика || driverName)}
            </div>

            <div style="font-size:12px;color:var(--mid);line-height:1.55;max-width:720px;">
              ${escapeHtml(pred.характеристики_авто || "Авто-данные не указаны.")}
            </div>
          </div>

          <div style="min-width:150px;text-align:right;">
            <div style="font-family:var(--mono);font-size:10px;color:var(--dim);text-transform:uppercase;margin-bottom:5px;">
              Прогноз баллов
            </div>
            <div style="font-family:var(--head);font-size:58px;font-weight:900;font-style:italic;line-height:.9;color:var(--accent);">
              ${Number(score).toFixed(1)}
            </div>
            <div style="font-family:var(--mono);font-size:11px;color:var(--mid);margin-top:8px;">
              ${escapeHtml(ap.ожидаемый_диапазон_баллов || ap.ожидаемый_счёт || "60–75 баллов")}
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;">
        ${metricCard("Уверенность", `${Number(conf).toFixed(0)}%`, "расчёт по данным", confColor)}
        ${metricCard("Синергия", `${Number(synergy).toFixed(0)}%`, "пилот + авто + трасса", synergy >= 70 ? "var(--safe)" : synergy >= 50 ? "var(--warn)" : "var(--crit)")}
        ${metricCard("Мех. риск", ra.механический_риск || "—", "оценка риска", mechColor)}
        ${metricCard("Нулевой заезд", `${Number(zeroPct).toFixed(1)}%`, "вероятность ошибки", zeroColor)}
      </div>

      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;">
        <div class="info-card animate-in">
          <div class="info-card-header">
            <div class="info-card-title">Основные риски</div>
            <div class="info-card-tag">RISK</div>
          </div>
          <div class="info-card-body">
            <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:12px;">
              ${riskTags || '<span style="color:var(--dim);font-size:11px">Критических рисков не обнаружено</span>'}
            </div>
            <div style="font-size:12px;color:var(--mid);line-height:1.55;">
              ${escapeHtml(ap.риск_ошибок || "—")}
            </div>
          </div>
        </div>

        <div class="info-card animate-in">
          <div class="info-card-header">
            <div class="info-card-title">Преимущества</div>
            <div class="info-card-tag">STRONG</div>
          </div>
          <div class="info-card-body">
            ${compactList(ta.преимущества || [], "Преимущества не указаны")}
            ${ap.тактическое_преимущество ? `
              <div style="margin-top:10px;font-size:12px;color:var(--mid);line-height:1.55;">
                ${escapeHtml(ap.тактическое_преимущество)}
              </div>
            ` : ""}
          </div>
        </div>

        <div class="info-card animate-in">
          <div class="info-card-header">
            <div class="info-card-title">Слабые стороны</div>
            <div class="info-card-tag">WEAK</div>
          </div>
          <div class="info-card-body">
            ${compactList(ta.недостатки || [], "Недостатки не указаны")}
            <div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);font-size:12px;color:var(--dim);line-height:1.55;">
              <b style="color:var(--text);">Стратегия:</b> ${escapeHtml(ta.оптимальная_стратегия || "—")}
            </div>
          </div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:minmax(250px,.8fr) minmax(320px,1.4fr);gap:14px;">
        <div class="info-card animate-in">
          <div class="info-card-header">
            <div class="info-card-title">Актуальные условия</div>
            <div class="info-card-tag">WEATHER</div>
          </div>
          <div class="info-card-body">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              ${metricCard("Асфальт", `${escapeHtml(weather.asphalt_temp_c)}°C`)}
              ${metricCard("Влажность", `${escapeHtml(weather.humidity_pct)}%`)}
              ${metricCard("Ветер", `${escapeHtml(weather.wind_speed_kmh)} км/ч`)}
              ${metricCard("Условия", weather.condition)}
            </div>
            <div style="margin-top:12px;font-size:11px;color:var(--dim);line-height:1.55;">
              ${escapeHtml(ra.влияние_погоды || pred.снимок_условий || "—")}
            </div>
          </div>
        </div>

        <div class="info-card animate-in">
          <div class="info-card-header">
            <div class="info-card-title">Разбивка по секторам</div>
            <div class="info-card-tag">${escapeHtml(track.venue)}</div>
          </div>
          <div class="info-card-body" style="overflow-x:auto;">
            <table class="sector-table" style="min-width:620px;">
              <thead>
                <tr>
                  <th>Зона</th>
                  <th>Ожид. баллы</th>
                  <th>Риск</th>
                  <th>Анализ</th>
                </tr>
              </thead>
              <tbody>
                ${sectorRows || '<tr><td colspan="4" style="color:var(--dim)">Нет данных</td></tr>'}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="reasoning-card animate-in" style="
        border-radius:16px;
        border:1px solid var(--rim);
        background:linear-gradient(135deg,rgba(255,255,255,.04),rgba(255,255,255,.015));
      ">
        <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px;">
          <div>
            <div style="font-family:var(--mono);font-size:10px;color:var(--dim);text-transform:uppercase;">Техническое обоснование</div>
            <div style="font-family:var(--head);font-size:17px;font-weight:800;color:var(--text);margin-top:3px;">Почему такой прогноз</div>
          </div>
          <div style="font-family:var(--head);font-size:22px;font-weight:900;color:${confColor};">${Number(conf).toFixed(0)}%</div>
        </div>
        <div style="font-size:12px;line-height:1.65;color:var(--mid);">
          ${escapeHtml(reasoning)}
        </div>
      </div>

      <div class="st-row animate-in" style="display:flex;gap:16px;align-items:center;">
        <div class="conf-ring-wrap">
          <svg viewBox="0 0 80 80">
            <defs>
              <linearGradient id="confGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ff0066"/>
                <stop offset="100%" stop-color="#00d9ff"/>
              </linearGradient>
            </defs>
            <circle class="conf-track" cx="40" cy="40" r="32"/>
            <circle class="conf-fill" id="confArc" cx="40" cy="40" r="32" stroke-dasharray="${circumference.toFixed(2)}" stroke-dashoffset="${circumference.toFixed(2)}"/>
          </svg>
          <div class="conf-ring-label">
            <div class="conf-pct-val">${Number(conf).toFixed(0)}%</div>
            <div class="conf-pct-sub">УВЕР.</div>
          </div>
        </div>

        <div>
          <div style="font-family:var(--head);font-size:14px;font-weight:800;margin-bottom:4px;">Оценка уверенности</div>
          <div style="font-size:12px;color:var(--mid);line-height:1.45;">${escapeHtml(confText)}</div>
        </div>
      </div>

      <div class="reasoning-card animate-in">
        <div style="font-family:var(--mono);font-size:9px;letter-spacing:1px;color:var(--dim);margin-bottom:10px;">
          КОММЕНТАРИИ СООБЩЕСТВА · ${escapeHtml(track.name || track.venue)}
        </div>
        <div id="commentList" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;">
          <input id="commentInput" type="text" placeholder="Оставить комментарий..." autocomplete="off" style="flex:1;background:rgba(255,255,255,0.04);border:1px solid var(--rim);border-radius:8px;color:var(--text);font-family:var(--mono);font-size:12px;padding:10px;outline:none;">
          <button onclick='addComment(${toJsString(track.id || "auto")})' style="background:var(--gradient-primary);border:none;border-radius:8px;color:white;font-family:var(--head);font-size:11px;font-weight:900;padding:0 14px;cursor:pointer;">→</button>
        </div>
      </div>

    </div>
  `;

  renderComments(track.id || "auto");

  requestAnimationFrame(() => {
    const arc = document.getElementById("confArc");
    if (arc) {
      setTimeout(() => {
        arc.style.strokeDashoffset = confOffset;
      }, 100);
    }
  });

  const hRunCount = document.getElementById("hRunCount");
  const hLastScore = document.getElementById("hLastScore");
  const hLastConf = document.getElementById("hLastConf");

  if (hRunCount) hRunCount.textContent = ++runCount;
  if (hLastScore) hLastScore.textContent = Number(score).toFixed(1);
  if (hLastConf) hLastConf.textContent = Number(conf).toFixed(0) + "%";
}

// ─── COMMENTS ────────────────────────────────────────────
function getComments(trackId) {
  try {
    return JSON.parse(localStorage.getItem(`comments_${trackId}`) || "[]");
  } catch {
    return [];
  }
}

function renderComments(trackId) {
  const list = document.getElementById("commentList");
  if (!list) return;

  const comments = getComments(trackId);

  if (comments.length === 0) {
    list.innerHTML = '<div style="color:var(--dim);font-size:11px;text-align:center;padding:8px;">Будьте первым, кто оставит комментарий</div>';
    return;
  }

  list.innerHTML = comments.map((c) => `
    <div style="background:rgba(255,255,255,0.03);border:1px solid var(--rim);border-radius:3px;padding:10px;">
      <div style="font-size:12px;color:var(--text);">${escapeHtml(c.text)}</div>
      <div style="font-size:9px;color:var(--dim);margin-top:4px;font-family:var(--mono);">${escapeHtml(c.author)} · ${escapeHtml(c.date)}</div>
    </div>
  `).join("");
}

function addComment(trackId) {
  const input = document.getElementById("commentInput");
  const text = (input?.value || "").trim();

  if (!text) return;

  const comments = getComments(trackId);

  comments.unshift({
    text,
    author: "Болельщик",
    date: new Date().toLocaleDateString("ru-RU")
  });

  try {
    localStorage.setItem(`comments_${trackId}`, JSON.stringify(comments.slice(0, 50)));
  } catch {
    // Ignore localStorage failures.
  }

  if (input) input.value = "";

  renderComments(trackId);
}

// ─── MAIN ANALYSIS ────────────────────────────────────────
async function runAnalysis() {
  const driverInput = document.getElementById("driverInput");
  const trackSelect = document.getElementById("trackSelect");
  const btn = document.getElementById("analyzeBtn");

  const driverName = driverInput?.value?.trim();

  if (!driverName) {
    log("ОШИБКА: Не введено имя гонщика.", "err");
    return;
  }

  const trackKey = trackSelect?.value || "auto";
  const track = TRACK_DB[trackKey] || TRACK_DB.auto;

  if (btn) {
    btn.disabled = true;
    btn.textContent = "АНАЛИЗИРУЮ...";
  }

  resetNodes();
  document.getElementById("emptyState")?.remove();

  log(`Запуск конвейера для: ${driverName}`);

  try {
    setNode("A", "active");
    log("Этап A: Загрузка официального контекста из Node API…");

    const rdsContext = await buildNodeRdsContext(driverName, track);

    if (rdsContext.sources.driverProfileFound) {
      log(`Профиль пилота найден: ${rdsContext.driver.fullName}`, "ok");
    } else {
      log("Профиль пилота не найден в /api/drivers.", "warn");
    }

    if (rdsContext.sources.carSpecsFound) {
      log(`Авто-профиль найден: ${rdsContext.car.displayName}`, "ok");
    } else {
      log("Авто-профиль не найден или неполный.", "warn");
    }

    if (rdsContext.sources.trackContextFound) {
      log(`Контекст трассы найден: ${rdsContext.track.name}`, "ok");
    } else {
      log("Контекст трассы из /api/tracks не найден. Использую UI-данные.", "warn");
    }

    setNode("A", "done");

    setNode("B", "active");
    log(`Этап B: Трасса — ${track.name}, ${track.city}. Получаю погоду…`);

    const weather = await fetchWeather(track.city);

    log(`Трасса: ${track.venue}`, "ok");
    log(`Погода: ${weather.condition} · Воздух ${weather.air_temp_c}°C · Асфальт ~${weather.asphalt_temp_c}°C`, "ok");

    setNode("B", "done");

    setNode("C", "active");
    log("Этап C: Отправка в AI движок через Node /ai/chat…");

    const prediction = await callClaudeAPI(driverName, weather, track, rdsContext);

    log("Парсинг структурированного JSON…", "ok");

    setNode("C", "done");
    setNode("D", "done");

    const scoreVal = prediction.прогноз_ии?.наиболее_вероятный;
    const confVal = prediction.рейтинг_уверенности;

    log(`Прогноз готов. Счёт: ${scoreVal ? Number(scoreVal).toFixed(1) : "—"} бал · Уверенность: ${confVal ? Number(confVal).toFixed(0) : "—"}%`, "ok");

    if (rdsContext.sources.officialResultsFound) {
      log("Официальная история результатов использована.", "ok");
    } else {
      log("Подробная история результатов пока не импортирована — компонент уверенности снижен.", "warn");
    }

    if (rdsContext.sources.carSpecsFound) {
      log("Официальный авто-профиль использован.", "ok");
    }

    log("Телеметрия не используется в текущей версии прогноза.", "ok");

    saveHistory({
      driver: driverName,
      track: track.name,
      score: scoreVal ? Number(scoreVal).toFixed(1) : "—",
      date: new Date().toLocaleDateString("ru-RU")
    });

    renderResults(prediction, weather, track, driverName);
  } catch (err) {
    setNode("C", "");
    log(`ОШИБКА: ${err.message}`, "err");
    log("Проверь Node server, APP_BEARER_TOKEN и GITHUB_MODELS_TOKEN.", "warn");

    const outputCol = document.getElementById("outputCol");

    if (outputCol) {
      outputCol.innerHTML = `
        <div style="text-align:center;padding:30px;color:var(--crit);">
          ⚠ Ошибка Конвейера<br>
          <span style="font-size:11px;color:var(--dim)">${escapeHtml(err.message)}</span>
        </div>
      `;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "АНАЛИЗИРОВАТЬ ГОНЩИКА";
    }
  }
}

// ─── DRIVER DROPDOWN ──────────────────────────────────────
async function initializeDriverDropdown() {
  const toggle = document.getElementById("driverSelectToggle");
  const dropdown = document.getElementById("driverSelectDropdown");
  const driverList = document.getElementById("driverList");
  const driverInput = document.getElementById("driverInput");

  if (!toggle || !dropdown || !driverList || !driverInput) return;

  let drivers = [];

  try {
    drivers = await window.RDS_API.getDrivers();
  } catch (error) {
    console.error("Failed to load drivers from API:", error);

    driverList.innerHTML = `
      <div style="padding:12px;color:var(--crit);font-family:var(--mono);font-size:11px;">
        Не удалось загрузить пилотов из /api/drivers
      </div>
    `;

    return;
  }

  driverList.innerHTML = drivers.map((driver) => {
    const imageUrl = getDriverImage(driver);
    const driverName = driver.fullName || "Без имени";

    const avatarHtml = imageUrl
      ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(driverName)}" class="driver-avatar" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
      : "";

    const fallbackHtml = `
      <div class="driver-avatar"
           style="${imageUrl ? "display:none;" : "display:flex;"}align-items:center;justify-content:center;font-family:var(--head);font-weight:900;color:var(--accent);background:rgba(255,255,255,.06);">
        ${escapeHtml(driver.number ?? "—")}
      </div>
    `;

    return `
      <div class="driver-item" onclick='selectDriver(${toJsString(driverName)}, event)'>
        ${avatarHtml}
        ${fallbackHtml}
        <div>
          <div style="font-size:12px;">${escapeHtml(driverName)}</div>
          <div style="font-size:10px;color:var(--dim);">
            №${escapeHtml(driver.number ?? "—")} · ${escapeHtml(driver.currentTeam?.name || "RDS GP")}
          </div>
        </div>
      </div>
    `;
  }).join("");

  toggle.addEventListener("click", () => {
    const isOpen = dropdown.style.display !== "none";
    dropdown.style.display = isOpen ? "none" : "block";
    toggle.classList.toggle("open", !isOpen);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".driver-select-wrapper")) {
      dropdown.style.display = "none";
      toggle.classList.remove("open");
    }
  });

  function updateToggleLabel() {
    const label = toggle.querySelector(".driver-select-label");

    if (label) {
      label.textContent = driverInput.value || "Выберите гонщика...";
    }
  }

  driverInput.addEventListener("change", updateToggleLabel);
  updateToggleLabel();
}

function selectDriver(name, event) {
  if (event) event.stopPropagation();

  const input = document.getElementById("driverInput");
  const dropdown = document.getElementById("driverSelectDropdown");
  const toggle = document.getElementById("driverSelectToggle");

  if (input) {
    input.value = name;
    input.dispatchEvent(new Event("change"));
  }

  if (dropdown) dropdown.style.display = "none";
  if (toggle) toggle.classList.remove("open");
}

// ─── INIT ────────────────────────────────────────────────
function initializeScript() {
  renderHistory();
  initializeDriverDropdown();

  document.getElementById("driverInput")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") runAnalysis();
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeScript);
} else {
  initializeScript();
}

// Expose functions for inline onclick handlers.
window.runAnalysis = runAnalysis;
window.selectDriver = selectDriver;
window.setDriver = setDriver;
window.addComment = addComment;
window.renderHistory = renderHistory;