const RDS_API_BASE = window.location.origin;

async function apiGet(path) {
  const response = await fetch(`${RDS_API_BASE}${path}`);

  if (!response.ok) {
    throw new Error(`API error ${response.status}: ${path}`);
  }

  return response.json();
}

window.RDS_API = {
  async getEvents() {
    const res = await apiGet('/api/events');
    return res.data || [];
  },

  async getTracks() {
    const res = await apiGet('/api/tracks');
    return res.data || [];
  },

  async getTrack(trackId) {
    const res = await apiGet(`/api/tracks/${trackId}`);
    return res.data;
  },

  async getDrivers() {
    const res = await apiGet('/api/drivers');
    return res.data || [];
  },

  async getDriver(driverId) {
    const res = await apiGet(`/api/drivers/${driverId}`);
    return res.data;
  },

  async getTeams() {
    const res = await apiGet('/api/teams');
    return res.data || [];
  },

  async getTeam(teamId) {
    const res = await apiGet(`/api/teams/${teamId}`);
    return res.data;
  },

  async getCars() {
    const res = await apiGet('/api/cars');
    return res.data || [];
  },

  async getCar(carId) {
    const res = await apiGet(`/api/cars/${carId}`);
    return res.data;
  },
};