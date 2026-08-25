// Aeros Mock Domain Data and Client Database Simulation

export const initialAirports = [
  {
    id: "3c5c0000-97c6-fc34-a0cb-08db322230c8",
    name: "Lisbon International Airport",
    code: "LIS",
    address: "Lisbon, Portugal",
    city: "Lisbon",
    country: "Portugal"
  },
  {
    id: "3c5c0000-97c6-fc34-fc3c-08db322230c8",
    name: "Sao Paulo International Airport",
    code: "GRU",
    address: "Sao Paulo, Brazil",
    city: "Sao Paulo",
    country: "Brazil"
  },
  {
    id: "3c5c0000-97c6-fc34-fc3c-08db322230c9",
    name: "London Heathrow Airport",
    code: "LHR",
    address: "London, United Kingdom",
    city: "London",
    country: "United Kingdom"
  },
  {
    id: "3c5c0000-97c6-fc34-fc3c-08db322230ca",
    name: "John F. Kennedy International Airport",
    code: "JFK",
    address: "New York, USA",
    city: "New York",
    country: "United States"
  },
  {
    id: "3c5c0000-97c6-fc34-fc3c-08db322230cb",
    name: "Dubai International Airport",
    code: "DXB",
    address: "Dubai, United Arab Emirates",
    city: "Dubai",
    country: "UAE"
  },
  {
    id: "3c5c0000-97c6-fc34-fc3c-08db322230cc",
    name: "Tokyo Haneda Airport",
    code: "HND",
    address: "Tokyo, Japan",
    city: "Tokyo",
    country: "Japan"
  }
];

export const initialAircrafts = [
  {
    id: "3c5c0000-97c6-fc34-fcd3-08db322230c8",
    name: "Boeing 737-800",
    model: "B737",
    manufacturingYear: 2018,
    totalSeats: 160
  },
  {
    id: "3c5c0000-97c6-fc34-2e04-08db322230c9",
    name: "Airbus A320neo",
    model: "A320neo",
    manufacturingYear: 2021,
    totalSeats: 180
  },
  {
    id: "3c5c0000-97c6-fc34-2e11-08db322230c9",
    name: "Boeing 787 Dreamliner",
    model: "B787-9",
    manufacturingYear: 2022,
    totalSeats: 290
  }
];

export const initialFlights = [
  {
    id: "3c5c0000-97c6-fc34-2eb9-08db322230c9",
    flightNumber: "AE-467",
    aircraftId: "3c5c0000-97c6-fc34-fcd3-08db322230c8",
    aircraftName: "Boeing 737-800",
    departureAirportId: "3c5c0000-97c6-fc34-a0cb-08db322230c8",
    departureAirportCode: "LIS",
    departureCity: "Lisbon",
    arriveAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230c8",
    arriveAirportCode: "GRU",
    arriveCity: "Sao Paulo",
    departureDate: "2026-09-15T09:30:00",
    arriveDate: "2026-09-15T19:30:00",
    flightDate: "2026-09-15",
    durationMinutes: 600,
    status: "On Time",
    price: 780,
    availableSeatsCount: 42
  },
  {
    id: "01949849-1608-7e16-975a-e7f4cf1d029d",
    flightNumber: "AE-812",
    aircraftId: "3c5c0000-97c6-fc34-2e04-08db322230c9",
    aircraftName: "Airbus A320neo",
    departureAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230c9",
    departureAirportCode: "LHR",
    departureCity: "London",
    arriveAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230ca",
    arriveAirportCode: "JFK",
    arriveCity: "New York",
    departureDate: "2026-09-16T14:15:00",
    arriveDate: "2026-09-16T17:45:00",
    flightDate: "2026-09-16",
    durationMinutes: 450,
    status: "Flying",
    price: 650,
    availableSeatsCount: 28
  },
  {
    id: "01949849-1608-7e16-975a-e7f4cf1d0301",
    flightNumber: "AE-209",
    aircraftId: "3c5c0000-97c6-fc34-2e11-08db322230c9",
    aircraftName: "Boeing 787 Dreamliner",
    departureAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230cb",
    departureAirportCode: "DXB",
    departureCity: "Dubai",
    arriveAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230cc",
    arriveAirportCode: "HND",
    arriveCity: "Tokyo",
    departureDate: "2026-09-18T22:00:00",
    arriveDate: "2026-09-19T13:30:00",
    flightDate: "2026-09-18",
    durationMinutes: 570,
    status: "Delay",
    price: 920,
    availableSeatsCount: 15
  },
  {
    id: "01949849-1608-7e16-975a-e7f4cf1d0302",
    flightNumber: "AE-104",
    aircraftId: "3c5c0000-97c6-fc34-2e04-08db322230c9",
    aircraftName: "Airbus A320neo",
    departureAirportId: "3c5c0000-97c6-fc34-a0cb-08db322230c8",
    departureAirportCode: "LIS",
    departureCity: "Lisbon",
    arriveAirportId: "3c5c0000-97c6-fc34-fc3c-08db322230c9",
    arriveAirportCode: "LHR",
    arriveCity: "London",
    departureDate: "2026-09-20T07:45:00",
    arriveDate: "2026-09-20T10:30:00",
    flightDate: "2026-09-20",
    durationMinutes: 165,
    status: "On Time",
    price: 210,
    availableSeatsCount: 56
  }
];

export const initialPassengers = [
  {
    id: "4c5c0000-97c6-fc34-a0cb-08db322230c0",
    name: "Sai Inapakolla",
    passportNumber: "P89234110",
    passengerType: "Adult",
    age: 28,
    email: "sai.inapakolla@aeros.io",
    phone: "+1 (555) 234-8901"
  },
  {
    id: "4c5c0000-97c6-fc34-a0cb-08db322230c1",
    name: "Elena Rostova",
    passportNumber: "E44210984",
    passengerType: "Adult",
    age: 32,
    email: "elena.r@example.com",
    phone: "+44 20 7946 0912"
  },
  {
    id: "4c5c0000-97c6-fc34-a0cb-08db322230c2",
    name: "Marcus Vance",
    passportNumber: "M90823415",
    passengerType: "Adult",
    age: 45,
    email: "marcus.vance@example.org",
    phone: "+1 (555) 789-0123"
  }
];

export function generateSeatsForFlight(flightId) {
  const seats = [];
  const rows = [
    { row: 1, class: "FirstClass", priceMultiplier: 2.5 },
    { row: 2, class: "FirstClass", priceMultiplier: 2.5 },
    { row: 3, class: "Business", priceMultiplier: 1.8 },
    { row: 4, class: "Business", priceMultiplier: 1.8 },
    { row: 5, class: "Business", priceMultiplier: 1.8 },
    { row: 6, class: "Economy", priceMultiplier: 1.0 },
    { row: 7, class: "Economy", priceMultiplier: 1.0 },
    { row: 8, class: "Economy", priceMultiplier: 1.0 },
    { row: 9, class: "Economy", priceMultiplier: 1.0 },
    { row: 10, class: "Economy", priceMultiplier: 1.0 },
    { row: 11, class: "Economy", priceMultiplier: 1.0 },
    { row: 12, class: "Economy", priceMultiplier: 1.0 }
  ];

  const cols = [
    { col: "A", type: "Window" },
    { col: "B", type: "Middle" },
    { col: "C", type: "Aisle" },
    { col: "D", type: "Aisle" },
    { col: "E", type: "Middle" },
    { col: "F", type: "Window" }
  ];

  rows.forEach(r => {
    cols.forEach(c => {
      const seatNumber = `${r.row}${c.col}`;
      // Seed a few occupied seats deterministically
      const isOccupied = (r.row === 1 && c.col === "B") || 
                         (r.row === 4 && (c.col === "A" || c.col === "D")) || 
                         (r.row === 7 && c.col === "C") || 
                         (r.row === 10 && (c.col === "E" || c.col === "F"));
      
      seats.push({
        id: `seat-${flightId}-${seatNumber}`,
        flightId: flightId,
        seatNumber: seatNumber,
        row: r.row,
        col: c.col,
        seatClass: r.class,
        seatType: c.type,
        priceMultiplier: r.priceMultiplier,
        isReserved: isOccupied,
        status: isOccupied ? "Reserved" : "Available"
      });
    });
  });

  return seats;
}

export const initialBookings = [
  {
    id: "01949849-5511-7e16-975a-e7f4cf1d0001",
    bookingNumber: "BK-84920",
    flightId: "3c5c0000-97c6-fc34-2eb9-08db322230c9",
    flightNumber: "AE-467",
    departureCity: "Lisbon (LIS)",
    arriveCity: "Sao Paulo (GRU)",
    departureDate: "2026-09-15T09:30:00",
    arriveDate: "2026-09-15T19:30:00",
    passengerId: "4c5c0000-97c6-fc34-a0cb-08db322230c0",
    passengerName: "Sai Inapakolla",
    passengerPassport: "P89234110",
    seatNumber: "12A",
    seatClass: "Economy",
    totalPrice: 780,
    status: "Confirmed",
    gate: "B14",
    terminal: "T2",
    boardingTime: "08:45 AM",
    createdAt: "2026-08-25T14:20:00"
  },
  {
    id: "01949849-5511-7e16-975a-e7f4cf1d0002",
    bookingNumber: "BK-90123",
    flightId: "01949849-1608-7e16-975a-e7f4cf1d029d",
    flightNumber: "AE-812",
    departureCity: "London (LHR)",
    arriveCity: "New York (JFK)",
    departureDate: "2026-09-16T14:15:00",
    arriveDate: "2026-09-16T17:45:00",
    passengerId: "4c5c0000-97c6-fc34-a0cb-08db322230c1",
    passengerName: "Elena Rostova",
    passengerPassport: "E44210984",
    seatNumber: "4A",
    seatClass: "Business",
    totalPrice: 1170,
    status: "Confirmed",
    gate: "A08",
    terminal: "T5",
    boardingTime: "01:30 PM",
    createdAt: "2026-08-25T18:45:00"
  }
];
