import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import slugify from 'slugify';

const BASE_URL = 'https://rdsgp.com';
const OUTPUT_DIR = path.resolve('src/data/generated');

const RESULT_PAGE_URLS = [
  'https://rdsgp.com/results/rds2025/',
  'https://rdsgp.com/results/rdsgp2024/',
];

const now = new Date().toISOString();

function cleanText(value) {
  return String(value || '')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function makeId(value, fallback = 'item') {
  const clean = slugify(String(value || fallback), {
    lower: true,
    strict: true,
    locale: 'ru',
  });

  return clean || fallback;
}

function absoluteUrl(url) {
  if (!url) return null;

  if (url.startsWith('http')) {
    return url;
  }

  if (url.startsWith('/')) {
    return `${BASE_URL}${url}`;
  }

  return `${BASE_URL}/${url}`;
}

function parseNumber(value) {
  if (value === null || value === undefined) return null;

  const normalized = String(value)
    .replace(',', '.')
    .replace(/[^\d.]/g, '');

  if (!normalized) return null;

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function sourceMeta(sourceUrl, notes = '') {
  return {
    source_type: 'official_website',
    source_url: sourceUrl,
    confidence: 0.9,
    extraction_method: 'html_scrape',
    timestamp: now,
    notes,
  };
}

function unavailableValue(notes, sourceUrl = null) {
  return {
    value: null,
    source_type: 'unavailable',
    source_url: sourceUrl,
    confidence: 0,
    extraction_method: 'not_available',
    timestamp: now,
    notes,
  };
}

function officialValue(value, sourceUrl, notes = '') {
  const hasValue = value !== null && value !== undefined && value !== '';

  return {
    value: hasValue ? value : null,
    source_type: hasValue ? 'official_website' : 'unavailable',
    source_url: sourceUrl,
    confidence: hasValue ? 0.9 : 0,
    extraction_method: hasValue ? 'html_scrape' : 'not_available',
    timestamp: now,
    notes,
  };
}

async function fetchHtml(url) {
  const response = await axios.get(url, {
    headers: {
      'User-Agent':
        'rds_predict importer for RDS Digital Ecosystem local development',
      Accept: 'text/html,application/xhtml+xml',
    },
    timeout: 20000,
  });

  return response.data;
}

function getPageLines($) {
  return $('body')
    .text()
    .split('\n')
    .map(cleanText)
    .filter(Boolean);
}

function findValueAfterLabel(lines, label) {
  const normalizedLabel = label.toLowerCase();

  const index = lines.findIndex((line) => line.toLowerCase() === normalizedLabel);

  if (index === -1) {
    return null;
  }

  return lines[index + 1] || null;
}

function uniqueById(items) {
  const map = new Map();

  for (const item of items) {
    if (!item?.id) continue;
    map.set(item.id, item);
  }

  return [...map.values()];
}

function isPilotUrl(url) {
  try {
    const parsed = new URL(url);
    return /^\/pilots\/\d+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

function isTeamUrl(url) {
  try {
    const parsed = new URL(url);
    return /^\/teams\/\d+\/?$/.test(parsed.pathname);
  } catch {
    return false;
  }
}

async function discoverProfileUrlsFromResults() {
  const pilotUrls = new Set();
  const teamUrls = new Set();

  for (const resultPageUrl of RESULT_PAGE_URLS) {
    console.log(`Discovering profile links from ${resultPageUrl}`);

    const html = await fetchHtml(resultPageUrl);
    const $ = cheerio.load(html);

    $('a[href]').each((_, element) => {
      const href = $(element).attr('href');
      const url = absoluteUrl(href);

      if (!url) return;

      if (isPilotUrl(url)) {
        pilotUrls.add(url);
      }

      if (isTeamUrl(url)) {
        teamUrls.add(url);
      }
    });
  }

  return {
    pilotUrls: [...pilotUrls],
    teamUrls: [...teamUrls],
  };
}

function parsePilotHeading(heading) {
  /**
   * Common format:
   * "42 / Вахтин Алексей / VSTeam"
   */
  const parts = cleanText(heading)
    .replace(/^Профиль пилота:\s*/i, '')
    .split('/')
    .map(cleanText)
    .filter(Boolean);

  if (parts.length >= 3) {
    return {
      number: parseNumber(parts[0]),
      fullName: parts[1],
      teamName: parts.slice(2).join(' / '),
    };
  }

  if (parts.length === 2) {
    return {
      number: parseNumber(parts[0]),
      fullName: parts[1],
      teamName: null,
    };
  }

  return {
    number: null,
    fullName: cleanText(heading).replace(/^Профиль пилота:\s*/i, ''),
    teamName: null,
  };
}

function extractPilotSocialLinks($) {
  const socialLinks = {
    instagram: null,
    vk: null,
    youtube: null,
    telegram: null,
  };

  $('a[href]').each((_, element) => {
    const href = $(element).attr('href');
    if (!href) return;

    if (href.includes('instagram.com')) socialLinks.instagram = href;
    if (href.includes('vk.com')) socialLinks.vk = href;
    if (href.includes('youtube.com') || href.includes('youtu.be')) {
      socialLinks.youtube = href;
    }
    if (href.includes('t.me') || href.includes('telegram')) {
      socialLinks.telegram = href;
    }
  });

  return socialLinks;
}

function extractCarName(lines) {
  const engineIndex = lines.findIndex((line) => line.toLowerCase() === 'двигатель');

  if (engineIndex > 0) {
    return lines[engineIndex - 1];
  }

  return null;
}

async function scrapePilotProfile(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const lines = getPageLines($);

  const heading = cleanText($('h1').first().text());

  if (
    !heading ||
    heading.toLowerCase().includes('пилоты rds') ||
    heading.toLowerCase().includes('сезон 2025') ||
    heading.toLowerCase().includes('сезон 2024')
  ) {
    throw new Error(`Skipped non-driver pilot page: ${heading || url}`);
  }

  const parsedHeading = parsePilotHeading(heading);

  const looksLikeDriverProfile =
    parsedHeading.number !== null &&
    parsedHeading.fullName &&
    !parsedHeading.fullName.toLowerCase().includes('пилоты rds');

  if (!looksLikeDriverProfile) {
    throw new Error(`Skipped page that does not look like a driver profile: ${heading}`);
  }

  const birthDate = findValueAfterLabel(lines, 'дата рождения');
  const city = findValueAfterLabel(lines, 'город');
  const teamNameFromLabel = findValueAfterLabel(lines, 'команда');

  const teamName = teamNameFromLabel || parsedHeading.teamName || null;
  const teamId = teamName ? makeId(teamName, 'team') : null;

  const carName = extractCarName(lines);
  const engine = findValueAfterLabel(lines, 'двигатель');
  const displacementLiters = findValueAfterLabel(lines, 'рабочий объём (л)');
  const horsepower = findValueAfterLabel(lines, 'мощность (л. с.)');

  const driverId = makeId(parsedHeading.fullName || url, `pilot-${Date.now()}`);
  const carId = `car-${driverId}`;

  const driver = {
    id: driverId,
    fullName: parsedHeading.fullName,
    nickname: null,
    number: parsedHeading.number,
    nationality: null,
    city: officialValue(city, url, 'Driver city extracted from official pilot profile.'),
    birthDate: officialValue(
      birthDate,
      url,
      'Driver birth date extracted from official pilot profile.',
    ),
    profilePhotoUrl: null,
    biography: null,
    source: sourceMeta(url, 'Driver profile extracted from official RDS GP pilot page.'),
    socialLinks: extractPilotSocialLinks($),
    careerStatistics: {
      seasons: unavailableValue('Season count is not extracted yet.', url),
      podiums: unavailableValue('Official podium statistics are not extracted yet.', url),
      wins: unavailableValue('Official win statistics are not extracted yet.', url),
      winRate: unavailableValue(
        'Win rate cannot be calculated without official result history.',
        url,
      ),
      qualificationAverageScore: unavailableValue(
        'Qualification average score is not extracted yet.',
        url,
      ),
    },
    currentTeamId: teamId,
    currentCarId: carId,
  };

  const car = {
    id: carId,
    driverId,
    displayName: carName || `${parsedHeading.fullName} drift car`,
    make: unavailableValue('Car make is not separated on the official pilot profile.', url),
    model: officialValue(
      carName,
      url,
      'Car name/model extracted from official pilot profile.',
    ),
    year: unavailableValue('Car year is not shown on the parsed official pilot profile.', url),
    technicalCard: {
      engine: officialValue(engine, url, 'Engine extracted from official pilot profile.'),
      displacementLiters: officialValue(
        parseNumber(displacementLiters),
        url,
        'Engine displacement extracted from official pilot profile.',
      ),
      horsepower: {
        ...officialValue(
          parseNumber(horsepower),
          url,
          'Horsepower extracted from official pilot profile.',
        ),
        unit: 'hp',
      },
      torque: {
        ...unavailableValue('Torque is not shown on the parsed official pilot profile.', url),
        unit: 'Nm',
      },
      suspensionSetup: unavailableValue(
        'Suspension setup is not shown on the parsed official pilot profile.',
        url,
      ),
      drivetrain: unavailableValue(
        'Drivetrain is not shown on the parsed official pilot profile.',
        url,
      ),
    },
  };

  const partialTeam = teamName
    ? {
        id: teamId,
        name: teamName,
        logoUrl: null,
        description: null,
        source: sourceMeta(url, 'Team name extracted from official pilot profile.'),
        roster: [
          {
            driverId,
            role: 'driver',
          },
        ],
        historicalPerformance: {
          championships: unavailableValue('Championship count is not extracted yet.', url),
          podiums: unavailableValue('Team podium count is not extracted yet.', url),
        },
        sponsors: [],
      }
    : null;

  return {
    driver,
    car,
    partialTeam,
  };
}

async function scrapeTeamProfile(url) {
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);
  const lines = getPageLines($);

  const heading = cleanText($('h1').first().text());
  const name = heading || cleanText($('title').text()).split('-')[0];

  const foundationYear = findValueAfterLabel(lines, 'год основания');
  const city = findValueAfterLabel(lines, 'город');
  const founder = findValueAfterLabel(lines, 'основатель');

  return {
    id: makeId(name, 'team'),
    name,
    logoUrl: null,
    description: null,
    source: sourceMeta(url, 'Team profile discovered from official RDS GP results page.'),
    foundationYear: officialValue(
      parseNumber(foundationYear),
      url,
      'Foundation year extracted from official team profile if available.',
    ),
    city: officialValue(city, url, 'Team city extracted from official team profile if available.'),
    founder: officialValue(
      founder,
      url,
      'Team founder extracted from official team profile if available.',
    ),
    roster: [],
    historicalPerformance: {
      championships: unavailableValue('Championship count is not extracted yet.', url),
      podiums: unavailableValue('Team podium count is not extracted yet.', url),
    },
    sponsors: [],
  };
}

function mergeTeams(profileTeams, partialTeams) {
  const teamMap = new Map();

  for (const team of profileTeams) {
    teamMap.set(team.id, team);
  }

  for (const team of partialTeams.filter(Boolean)) {
    const existing = teamMap.get(team.id);

    if (!existing) {
      teamMap.set(team.id, team);
      continue;
    }

    const existingDriverIds = new Set(existing.roster.map((member) => member.driverId));

    for (const member of team.roster) {
      if (!existingDriverIds.has(member.driverId)) {
        existing.roster.push(member);
      }
    }
  }

  return [...teamMap.values()];
}

function buildTracks() {
  return [
    {
      id: 'moscow-raceway',
      name: 'Moscow Raceway',
      country: 'Russia',
      city: 'Volokolamsk',
      layoutName: 'RDS GP Moscow layout',
      mapType: 'svg',
      svgViewBox: '0 0 1000 600',
      trackPath:
        'M120 420 C180 300, 260 240, 380 260 C520 285, 570 120, 710 150 C830 175, 890 280, 815 380 C735 485, 540 500, 410 455 C290 415, 220 505, 120 420',
      startPoint: {
        x: 120,
        y: 420,
      },
      finishPoint: {
        x: 815,
        y: 380,
      },
      clippingZones: [],
      source: {
        source_type: 'mixed',
        source_url: 'https://rdsgp.com/results/rds2025/',
        confidence: 0.4,
        extraction_method: 'official_results_context_plus_manual_svg_placeholder',
        timestamp: now,
        notes:
          'Track/event names are based on official results context. SVG geometry is a manual placeholder and is not official track geometry.',
      },
      telemetryPolicy: {
        officialTelemetryAvailable: false,
        note:
          'No official telemetry or official SVG geometry is included. Speed, angle, trajectory, clipping-zone score, or technical stats must be marked as manually verified, extracted from video, estimated, demo/simulated, or unavailable.',
      },
    },
  ];
}

async function writeGeneratedModule(filename, exportName, data) {
  const content = `// Auto-generated by scripts/import-rdsgp-data.js
// Do not edit manually. Re-run npm run import:rdsgp to update.

export const ${exportName} = ${JSON.stringify(data, null, 2)};

export default ${exportName};
`;

  await fs.writeFile(path.join(OUTPUT_DIR, filename), content, 'utf8');
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  const { pilotUrls, teamUrls } = await discoverProfileUrlsFromResults();

  console.log(`Discovered ${pilotUrls.length} pilot profile URLs.`);
  console.log(`Discovered ${teamUrls.length} team profile URLs.`);

  console.log('Importing team profiles...');
  const teamProfiles = [];

  for (const url of teamUrls) {
    try {
      const team = await scrapeTeamProfile(url);
      teamProfiles.push(team);
      console.log(`  OK team: ${team.name}`);
    } catch (error) {
      console.warn(`  Failed team ${url}: ${error.message}`);
    }
  }

  console.log('Importing pilot profiles...');
  const drivers = [];
  const cars = [];
  const partialTeams = [];

  for (const url of pilotUrls) {
    try {
      const result = await scrapePilotProfile(url);
      drivers.push(result.driver);
      cars.push(result.car);

      if (result.partialTeam) {
        partialTeams.push(result.partialTeam);
      }

      console.log(`  OK pilot: ${result.driver.fullName}`);
    } catch (error) {
      console.warn(`  Failed pilot ${url}: ${error.message}`);
    }
  }

  const finalDrivers = uniqueById(drivers);
  const finalCars = uniqueById(cars);
  const finalTeams = mergeTeams(uniqueById(teamProfiles), partialTeams);
  const tracks = buildTracks();

  await writeGeneratedModule('drivers.generated.js', 'drivers', finalDrivers);
  await writeGeneratedModule('cars.generated.js', 'cars', finalCars);
  await writeGeneratedModule('teams.generated.js', 'teams', finalTeams);
  await writeGeneratedModule('tracks.generated.js', 'tracks', tracks);

  await writeGeneratedModule('metadata.generated.js', 'rdsgpImportMetadata', {
    importedAt: now,
    sourcePages: RESULT_PAGE_URLS,
    strategy: 'discover_pilot_and_team_links_from_results_pages_then_scrape_profiles',
    counts: {
      discoveredPilotUrls: pilotUrls.length,
      discoveredTeamUrls: teamUrls.length,
      drivers: finalDrivers.length,
      cars: finalCars.length,
      teams: finalTeams.length,
      tracks: tracks.length,
    },
    notes:
      'Drivers and teams are discovered from official RDS results pages. Driver team and car technical values are extracted from linked official pilot profiles.',
  });

  console.log('Import complete.');
  console.log({
    discoveredPilotUrls: pilotUrls.length,
    discoveredTeamUrls: teamUrls.length,
    drivers: finalDrivers.length,
    cars: finalCars.length,
    teams: finalTeams.length,
    tracks: tracks.length,
  });
}

main().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});