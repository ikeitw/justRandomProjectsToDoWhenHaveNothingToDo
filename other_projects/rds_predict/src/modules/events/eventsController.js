import events from '../../data/generated/events.generated.js';
import tracks from '../../data/generated/tracks.generated.js';

export function getEvents(req, res) {
  const { season, type, status } = req.query;

  let filtered = [...events];

  if (season) {
    filtered = filtered.filter((event) => String(event.season) === String(season));
  }

  if (type) {
    filtered = filtered.filter((event) => event.type === type);
  }

  if (status) {
    filtered = filtered.filter((event) => event.status === status);
  }

  const response = filtered.map((event) => {
    const track = tracks.find((item) => item.id === event.trackId);

    return {
      ...event,
      track: track
        ? {
            id: track.id,
            name: track.name,
            city: track.city,
            venueType: track.venueType,
          }
        : null,
    };
  });

  res.json({
    ok: true,
    count: response.length,
    data: response,
  });
}

export function getEventById(req, res) {
  const { eventId } = req.params;

  const event = events.find((item) => item.id === eventId);

  if (!event) {
    return res.status(404).json({
      ok: false,
      error: 'Event not found',
      code: 'EVENT_NOT_FOUND',
    });
  }

  const track = tracks.find((item) => item.id === event.trackId);

  return res.json({
    ok: true,
    data: {
      ...event,
      track: track || null,
    },
  });
}