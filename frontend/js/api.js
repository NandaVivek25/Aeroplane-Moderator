// Aeros API Client with Dual-Mode Support (Live Gateway vs Client Mock)

import { 
  initialAirports, 
  initialAircrafts, 
  initialFlights, 
  initialPassengers, 
  initialBookings, 
  generateSeatsForFlight 
} from './mockData.js';

const STORAGE_KEYS = {
  AIRPORTS: 'aeros_airports',
  AIRCRAFTS: 'aeros_aircrafts',
  FLIGHTS: 'aeros_flights',
  PASSENGERS: 'aeros_passengers',
  BOOKINGS: 'aeros_bookings',
  SEATS_PREFIX: 'aeros_seats_',
  CONFIG: 'aeros_config'
};

class AerosApiClient {
  constructor() {
    this.config = this.loadConfig();
    this.initLocalStorage();
  }

  loadConfig() {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    return saved ? JSON.parse(saved) : {
      isLiveMode: false,
      gatewayUrl: 'http://localhost:8081',
      flightServiceUrl: 'http://localhost:8082',
      passengerServiceUrl: 'http://localhost:8083',
      bookingServiceUrl: 'http://localhost:8084',
      keycloakUrl: 'http://localhost:8080',
      token: ''
    };
  }

  saveConfig() {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(this.config));
  }

  setLiveMode(enabled) {
    this.config.isLiveMode = enabled;
    this.saveConfig();
  }

  initLocalStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.AIRPORTS)) {
      localStorage.setItem(STORAGE_KEYS.AIRPORTS, JSON.stringify(initialAirports));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AIRCRAFTS)) {
      localStorage.setItem(STORAGE_KEYS.AIRCRAFTS, JSON.stringify(initialAircrafts));
    }
    if (!localStorage.getItem(STORAGE_KEYS.FLIGHTS)) {
      localStorage.setItem(STORAGE_KEYS.FLIGHTS, JSON.stringify(initialFlights));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PASSENGERS)) {
      localStorage.setItem(STORAGE_KEYS.PASSENGERS, JSON.stringify(initialPassengers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.BOOKINGS)) {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(initialBookings));
    }
  }

  getStorage(key) {
    return JSON.parse(localStorage.getItem(key) || '[]');
  }

  setStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // --- Health Checks ---
  async checkServicesHealth() {
    const results = {
      gateway: false,
      flight: false,
      passenger: false,
      booking: false,
      keycloak: false
    };

    const ping = async (url) => {
      try {
        const ctrl = new AbortController();
        const tid = setTimeout(() => ctrl.abort(), 1200);
        const res = await fetch(url, { method: 'GET', signal: ctrl.signal, mode: 'no-cors' });
        clearTimeout(tid);
        return true;
      } catch (e) {
        return false;
      }
    };

    const checks = await Promise.allSettled([
      ping(`${this.config.gatewayUrl}`),
      ping(`${this.config.flightServiceUrl}/swagger-ui/index.html`),
      ping(`${this.config.passengerServiceUrl}/swagger-ui/index.html`),
      ping(`${this.config.bookingServiceUrl}/swagger-ui/index.html`),
      ping(`${this.config.keycloakUrl}`)
    ]);

    results.gateway = checks[0].status === 'fulfilled' && checks[0].value;
    results.flight = checks[1].status === 'fulfilled' && checks[1].value;
    results.passenger = checks[2].status === 'fulfilled' && checks[2].value;
    results.booking = checks[3].status === 'fulfilled' && checks[3].value;
    results.keycloak = checks[4].status === 'fulfilled' && checks[4].value;

    return results;
  }

  // --- Flight API ---
  async getAvailableFlights(filters = {}) {
    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/flight/get-available-flights`, { headers });
        if (res.ok) {
          const data = await res.json();
          return data;
        }
      } catch (err) {
        console.warn('Live API request failed, falling back to local database:', err);
      }
    }

    let flights = this.getStorage(STORAGE_KEYS.FLIGHTS);
    const airports = this.getStorage(STORAGE_KEYS.AIRPORTS);
    const aircrafts = this.getStorage(STORAGE_KEYS.AIRCRAFTS);

    flights = flights.map(f => {
      const dep = airports.find(a => a.id === f.departureAirportId) || { code: f.departureAirportCode, name: f.departureCity, city: f.departureCity };
      const arr = airports.find(a => a.id === f.arriveAirportId) || { code: f.arriveAirportCode, name: f.arriveCity, city: f.arriveCity };
      const air = aircrafts.find(ac => ac.id === f.aircraftId) || { name: f.aircraftName || 'Airbus A320' };

      return {
        ...f,
        departureAirport: dep,
        arriveAirport: arr,
        aircraft: air
      };
    });

    if (filters.fromAirport) {
      flights = flights.filter(f => 
        f.departureAirportId === filters.fromAirport || 
        f.departureAirportCode === filters.fromAirport ||
        f.departureCity.toLowerCase().includes(filters.fromAirport.toLowerCase())
      );
    }

    if (filters.toAirport) {
      flights = flights.filter(f => 
        f.arriveAirportId === filters.toAirport || 
        f.arriveAirportCode === filters.toAirport ||
        f.arriveCity.toLowerCase().includes(filters.toAirport.toLowerCase())
      );
    }

    if (filters.flightDate) {
      flights = flights.filter(f => f.flightDate?.startsWith(filters.flightDate));
    }

    return flights;
  }

  async getFlightById(flightId) {
    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/flight/${flightId}`, { headers });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Live API failed:', err);
      }
    }

    const flights = await this.getAvailableFlights();
    return flights.find(f => f.id === flightId) || null;
  }

  async createFlight(flightData) {
    const newFlight = {
      id: crypto.randomUUID ? crypto.randomUUID() : `flight-${Date.now()}`,
      flightNumber: flightData.flightNumber || `AE-${Math.floor(100 + Math.random() * 900)}`,
      aircraftId: flightData.aircraftId,
      departureAirportId: flightData.departureAirportId,
      arriveAirportId: flightData.arriveAirportId,
      departureDate: flightData.departureDate,
      arriveDate: flightData.arriveDate,
      flightDate: flightData.departureDate.split('T')[0],
      durationMinutes: Number(flightData.durationMinutes) || 120,
      status: flightData.status || 'On Time',
      price: Number(flightData.price) || 500,
      availableSeatsCount: 50
    };

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/flight`, {
          method: 'POST',
          headers,
          body: JSON.stringify(flightData)
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Live create flight failed, saving locally:', err);
      }
    }

    const flights = this.getStorage(STORAGE_KEYS.FLIGHTS);
    flights.unshift(newFlight);
    this.setStorage(STORAGE_KEYS.FLIGHTS, flights);
    return newFlight;
  }

  // --- Airports & Aircrafts ---
  async getAirports() {
    return this.getStorage(STORAGE_KEYS.AIRPORTS);
  }

  async createAirport(airportData) {
    const newAirport = {
      id: crypto.randomUUID ? crypto.randomUUID() : `airport-${Date.now()}`,
      name: airportData.name,
      code: airportData.code.toUpperCase(),
      address: airportData.address,
      city: airportData.address.split(',')[0].trim(),
      country: airportData.address.split(',')[1]?.trim() || 'Global'
    };

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        await fetch(`${this.config.gatewayUrl}/api/v1/flight/airport`, {
          method: 'POST',
          headers,
          body: JSON.stringify(airportData)
        });
      } catch (e) {
        console.warn('Live API airport create error:', e);
      }
    }

    const airports = this.getStorage(STORAGE_KEYS.AIRPORTS);
    airports.push(newAirport);
    this.setStorage(STORAGE_KEYS.AIRPORTS, airports);
    return newAirport;
  }

  async getAircrafts() {
    return this.getStorage(STORAGE_KEYS.AIRCRAFTS);
  }

  async createAircraft(aircraftData) {
    const newAircraft = {
      id: crypto.randomUUID ? crypto.randomUUID() : `aircraft-${Date.now()}`,
      name: aircraftData.name,
      model: aircraftData.model,
      manufacturingYear: Number(aircraftData.manufacturingYear) || new Date().getFullYear(),
      totalSeats: 160
    };

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        await fetch(`${this.config.gatewayUrl}/api/v1/flight/aircraft`, {
          method: 'POST',
          headers,
          body: JSON.stringify(aircraftData)
        });
      } catch (e) {
        console.warn('Live API aircraft create error:', e);
      }
    }

    const aircrafts = this.getStorage(STORAGE_KEYS.AIRCRAFTS);
    aircrafts.push(newAircraft);
    this.setStorage(STORAGE_KEYS.AIRCRAFTS, aircrafts);
    return newAircraft;
  }

  // --- Seat Selection & Reservation ---
  async getAvailableSeats(flightId) {
    const seatKey = `${STORAGE_KEYS.SEATS_PREFIX}${flightId}`;
    let seats = JSON.parse(localStorage.getItem(seatKey) || 'null');

    if (!seats) {
      seats = generateSeatsForFlight(flightId);
      localStorage.setItem(seatKey, JSON.stringify(seats));
    }

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/flight/get-available-seats/${flightId}`, { headers });
        if (res.ok) {
          const liveSeats = await res.json();
          if (Array.isArray(liveSeats) && liveSeats.length > 0) {
            return liveSeats;
          }
        }
      } catch (err) {
        console.warn('Live seats fetch error:', err);
      }
    }

    return seats;
  }

  async reserveSeat(flightId, seatNumber) {
    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/flight/reserve-seat`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ flightId, seatNumber })
        });
        if (res.ok) return true;
      } catch (err) {
        console.warn('Live reserve seat error:', err);
      }
    }

    const seatKey = `${STORAGE_KEYS.SEATS_PREFIX}${flightId}`;
    const seats = await this.getAvailableSeats(flightId);
    const targetSeat = seats.find(s => s.seatNumber === seatNumber);
    if (targetSeat) {
      targetSeat.isReserved = true;
      targetSeat.status = 'Reserved';
      localStorage.setItem(seatKey, JSON.stringify(seats));
      return true;
    }
    return false;
  }

  // --- Passenger API ---
  async getPassengers() {
    return this.getStorage(STORAGE_KEYS.PASSENGERS);
  }

  async getPassengerById(id) {
    const passengers = await this.getPassengers();
    return passengers.find(p => p.id === id) || null;
  }

  async registerPassenger(passengerData) {
    const newPassenger = {
      id: crypto.randomUUID ? crypto.randomUUID() : `pass-${Date.now()}`,
      name: passengerData.name,
      passportNumber: passengerData.passportNumber,
      passengerType: passengerData.passengerType || 'Adult',
      age: Number(passengerData.age) || 30,
      email: passengerData.email || `${passengerData.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      phone: passengerData.phone || '+1 (555) 000-1122'
    };

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        const res = await fetch(`${this.config.gatewayUrl}/api/v1/passenger`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: newPassenger.name,
            passportNumber: newPassenger.passportNumber,
            passengerType: newPassenger.passengerType === 'Adult' ? 1 : 2,
            age: newPassenger.age
          })
        });
        if (res.ok) return await res.json();
      } catch (err) {
        console.warn('Live passenger registration failed:', err);
      }
    }

    const passengers = this.getStorage(STORAGE_KEYS.PASSENGERS);
    passengers.unshift(newPassenger);
    this.setStorage(STORAGE_KEYS.PASSENGERS, passengers);
    return newPassenger;
  }

  // --- Booking API ---
  async getBookings() {
    return this.getStorage(STORAGE_KEYS.BOOKINGS);
  }

  async createBooking(bookingPayload) {
    const flight = await this.getFlightById(bookingPayload.flightId);
    const passenger = await this.getPassengerById(bookingPayload.passengerId);

    const bookingId = crypto.randomUUID ? crypto.randomUUID() : `bk-${Date.now()}`;
    const bookingNumber = `BK-${Math.floor(10000 + Math.random() * 90000)}`;

    const newBooking = {
      id: bookingId,
      bookingNumber: bookingNumber,
      flightId: bookingPayload.flightId,
      flightNumber: flight ? flight.flightNumber : 'AE-100',
      departureCity: flight ? `${flight.departureCity} (${flight.departureAirportCode || flight.departureAirport?.code || 'LIS'})` : 'Origin',
      arriveCity: flight ? `${flight.arriveCity} (${flight.arriveAirportCode || flight.arriveAirport?.code || 'GRU'})` : 'Destination',
      departureDate: flight ? flight.departureDate : new Date().toISOString(),
      arriveDate: flight ? flight.arriveDate : new Date().toISOString(),
      passengerId: bookingPayload.passengerId,
      passengerName: passenger ? passenger.name : 'Passenger',
      passengerPassport: passenger ? passenger.passportNumber : 'P000000',
      seatNumber: bookingPayload.seatNumber || '12A',
      seatClass: bookingPayload.seatClass || 'Economy',
      totalPrice: bookingPayload.totalPrice || (flight ? flight.price : 500),
      description: bookingPayload.description || 'Flight Reservation',
      status: 'Confirmed',
      gate: `G${Math.floor(1 + Math.random() * 20)}`,
      terminal: `T${Math.floor(1 + Math.random() * 4)}`,
      boardingTime: '45 mins before departure',
      createdAt: new Date().toISOString()
    };

    if (this.config.isLiveMode) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (this.config.token) headers['Authorization'] = `Bearer ${this.config.token}`;
        await fetch(`${this.config.gatewayUrl}/api/v1/booking`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            passengerId: bookingPayload.passengerId,
            flightId: bookingPayload.flightId,
            description: bookingPayload.description || 'Aeros Flight Reservation'
          })
        });
      } catch (err) {
        console.warn('Live create booking failed:', err);
      }
    }

    // Reserve seat in store
    if (bookingPayload.seatNumber) {
      await this.reserveSeat(bookingPayload.flightId, bookingPayload.seatNumber);
    }

    const bookings = this.getStorage(STORAGE_KEYS.BOOKINGS);
    bookings.unshift(newBooking);
    this.setStorage(STORAGE_KEYS.BOOKINGS, bookings);
    return newBooking;
  }
}

export const api = new AerosApiClient();
