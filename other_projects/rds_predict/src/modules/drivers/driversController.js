import drivers from '../../data/generated/drivers.generated.js';
import cars from '../../data/generated/cars.generated.js';
import teams from '../../data/generated/teams.generated.js';

export function getDrivers(req, res) {
  const response = drivers.map((driver) => {
    const team = teams.find((item) => item.id === driver.currentTeamId);
    const car = cars.find((item) => item.id === driver.currentCarId);

    return {
      id: driver.id,
      fullName: driver.fullName,
      nickname: driver.nickname,
      number: driver.number,
      nationality: driver.nationality,
      profilePhotoUrl: driver.profilePhotoUrl,
      currentTeam: team
        ? {
            id: team.id,
            name: team.name,
            logoUrl: team.logoUrl,
          }
        : null,
      currentCar: car
        ? {
            id: car.id,
            displayName: car.displayName,
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

export function getDriverById(req, res) {
  const { driverId } = req.params;
  const driver = drivers.find((item) => item.id === driverId);

  if (!driver) {
    return res.status(404).json({
      ok: false,
      error: 'Driver not found',
      code: 'DRIVER_NOT_FOUND',
    });
  }

  const team = teams.find((item) => item.id === driver.currentTeamId);
  const car = cars.find((item) => item.id === driver.currentCarId);

  return res.json({
    ok: true,
    data: {
      ...driver,
      currentTeam: team || null,
      currentCar: car || null,
    },
  });
}