import teams from '../../data/generated/teams.generated.js';
import drivers from '../../data/generated/drivers.generated.js';
import cars from '../../data/generated/cars.generated.js';

export function getTeams(req, res) {
  const response = teams.map((team) => ({
    id: team.id,
    name: team.name,
    logoUrl: team.logoUrl,
    description: team.description,
    rosterCount: team.roster.length,
  }));

  res.json({
    ok: true,
    count: response.length,
    data: response,
  });
}

export function getTeamById(req, res) {
  const { teamId } = req.params;
  const team = teams.find((item) => item.id === teamId);

  if (!team) {
    return res.status(404).json({
      ok: false,
      error: 'Team not found',
      code: 'TEAM_NOT_FOUND',
    });
  }

  const roster = team.roster.map((member) => {
    const driver = drivers.find((item) => item.id === member.driverId);
    const car = driver ? cars.find((item) => item.id === driver.currentCarId) : null;

    return {
      role: member.role,
      driver: driver
        ? {
            id: driver.id,
            fullName: driver.fullName,
            nickname: driver.nickname,
            number: driver.number,
            nationality: driver.nationality,
          }
        : null,
      car: car
        ? {
            id: car.id,
            displayName: car.displayName,
            make: car.make,
            model: car.model,
          }
        : null,
    };
  });

  return res.json({
    ok: true,
    data: {
      ...team,
      roster,
    },
  });
}