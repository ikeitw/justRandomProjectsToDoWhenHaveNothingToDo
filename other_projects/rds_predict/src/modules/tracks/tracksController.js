import tracks from '../../data/generated/tracks.generated.js';

export function getTracks(req, res) {
  res.json({
    ok: true,
    count: tracks.length,
    data: tracks.map((track) => ({
      id: track.id,
      name: track.name,
      country: track.country,
      city: track.city,
      layoutName: track.layoutName,
      mapType: track.mapType,
      telemetryPolicy: track.telemetryPolicy,
    })),
  });
}

export function getTrackById(req, res) {
  const { trackId } = req.params;
  const track = tracks.find((item) => item.id === trackId);

  if (!track) {
    return res.status(404).json({
      ok: false,
      error: 'Track not found',
      code: 'TRACK_NOT_FOUND',
    });
  }

  return res.json({
    ok: true,
    data: track,
  });
}