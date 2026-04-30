import cars from '../../data/generated/cars.generated.js';
import drivers from '../../data/generated/drivers.generated.js';

export function getCars(req, res) {
  const response = cars.map((car) => {
    const driver = drivers.find((item) => item.id === car.driverId);

    return {
      id: car.id,
      displayName: car.displayName,
      modelName: car.model?.value || car.displayName,
      driver: driver
        ? {
            id: driver.id,
            fullName: driver.fullName,
            number: driver.number,
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

export function getCarById(req, res) {
  const { carId } = req.params;
  const car = cars.find((item) => item.id === carId);

  if (!car) {
    return res.status(404).json({
      ok: false,
      error: 'Car not found',
      code: 'CAR_NOT_FOUND',
    });
  }

  const driver = drivers.find((item) => item.id === car.driverId);

  return res.json({
    ok: true,
    data: {
      ...car,
      driver: driver || null,
    },
  });
}