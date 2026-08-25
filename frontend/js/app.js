// Aeros Main Application Controller & UI Logic

import { api } from './api.js';

class AerosApp {
  constructor() {
    this.currentTab = 'flights';
    this.selectedFlight = null;
    this.selectedSeat = null;
    this.selectedPassenger = null;
    this.healthInterval = null;

    this.init();
  }

  async init() {
    this.setupTheme();
    this.setupNavigation();
    this.setupEventListeners();
    this.updateModeUI();

    // Initial Data Loads
    await this.populateAirportDropdowns();
    await this.populateAircraftDropdowns();
    await this.loadFlights();
    await this.loadPassengers();
    await this.loadBookings();
    await this.loadAdminOverview();

    // Start background health monitor
    this.checkHealth();
    this.healthInterval = setInterval(() => this.checkHealth(), 15000);
  }

  // --- Theme Management ---
  setupTheme() {
    const savedTheme = localStorage.getItem('aeros_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  }

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('aeros_theme', next);
    this.updateThemeButton(next);
  }

  updateThemeButton(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.innerHTML = theme === 'dark' 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg> Light`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> Dark`;
    }
  }

  // --- Navigation & Tabs ---
  setupNavigation() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    
    // Update nav button active classes
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    // Update tab panels
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    // Hook for tab-specific actions
    if (tabId === 'flights') this.loadFlights();
    if (tabId === 'passengers') this.loadPassengers();
    if (tabId === 'bookings') this.loadBookings();
    if (tabId === 'admin') this.loadAdminOverview();
    if (tabId === 'seats' && this.selectedFlight) this.renderCabinSeats(this.selectedFlight.id);
  }

  // --- Health Checks ---
  async checkHealth() {
    const pill = document.getElementById('healthStatusPill');
    if (!pill) return;

    const health = await api.checkServicesHealth();
    const anyOnline = Object.values(health).some(v => v === true);

    if (api.config.isLiveMode) {
      if (health.gateway) {
        pill.className = 'status-pill';
        pill.innerHTML = `<span class="status-dot"></span> Live Gateway: Connected`;
      } else {
        pill.className = 'status-pill offline';
        pill.innerHTML = `<span class="status-dot"></span> Live Gateway: Connecting (8081)`;
      }
    } else {
      pill.className = 'status-pill';
      pill.innerHTML = `<span class="status-dot"></span> Demo Mode: Offline Active`;
    }
  }

  toggleLiveMode() {
    const newState = !api.config.isLiveMode;
    api.setLiveMode(newState);
    this.updateModeUI();
    this.checkHealth();
    this.showToast(newState ? 'Switched to Live API Gateway (8081)' : 'Switched to Interactive Demo Mode', 'info');
  }

  updateModeUI() {
    const modeBtn = document.getElementById('modeToggleBtn');
    if (modeBtn) {
      modeBtn.innerHTML = api.config.isLiveMode 
        ? `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"/></svg> Live API`
        : `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg> Mock Mode`;
    }
  }

  // --- Flight Operations & Search ---
  async populateAirportDropdowns() {
    const airports = await api.getAirports();
    const selects = ['searchFromAirport', 'searchToAirport', 'adminDepAirport', 'adminArrAirport'];
    
    selects.forEach(selectId => {
      const select = document.getElementById(selectId);
      if (!select) return;

      const isSearch = selectId.startsWith('search');
      let options = isSearch ? '<option value="">All Airports</option>' : '<option value="" disabled selected>Select Airport</option>';

      airports.forEach(a => {
        options += `<option value="${a.id}">${a.name} (${a.code}) - ${a.city}</option>`;
      });

      select.innerHTML = options;
    });
  }

  async populateAircraftDropdowns() {
    const aircrafts = await api.getAircrafts();
    const select = document.getElementById('adminAircraft');
    if (!select) return;

    let options = '<option value="" disabled selected>Select Aircraft Model</option>';
    aircrafts.forEach(ac => {
      options += `<option value="${ac.id}">${ac.name} (${ac.model}) - ${ac.manufacturingYear}</option>`;
    });
    select.innerHTML = options;
  }

  async loadFlights() {
    const grid = document.getElementById('flightsGrid');
    if (!grid) return;

    const fromAirport = document.getElementById('searchFromAirport')?.value;
    const toAirport = document.getElementById('searchToAirport')?.value;
    const flightDate = document.getElementById('searchFlightDate')?.value;

    grid.innerHTML = '<div class="loading-state">Loading flights...</div>';

    const flights = await api.getAvailableFlights({ fromAirport, toAirport, flightDate });

    if (!flights || flights.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">
          <h3>No matching flights found</h3>
          <p>Try clearing your search criteria or add a flight in the Operations tab.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = flights.map(flight => {
      const depCode = flight.departureAirportCode || flight.departureAirport?.code || 'LIS';
      const depCity = flight.departureCity || flight.departureAirport?.city || 'Lisbon';
      const arrCode = flight.arriveAirportCode || flight.arriveAirport?.code || 'GRU';
      const arrCity = flight.arriveCity || flight.arriveAirport?.city || 'Sao Paulo';
      const depTime = flight.departureDate ? new Date(flight.departureDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '09:00 AM';
      const arrTime = flight.arriveDate ? new Date(flight.arriveDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '07:00 PM';
      const hours = Math.floor((flight.durationMinutes || 120) / 60);
      const mins = (flight.durationMinutes || 120) % 60;
      const statusClass = (flight.status || 'On Time').toLowerCase().replace(/\s+/g, '-');

      return `
        <div class="flight-card">
          <div class="flight-card-top">
            <div class="flight-number-tag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
              ${flight.flightNumber}
            </div>
            <span class="flight-status-badge ${statusClass}">${flight.status || 'On Time'}</span>
          </div>

          <div class="flight-route">
            <div class="route-endpoint">
              <span class="airport-code">${depCode}</span>
              <span class="city-name">${depCity}</span>
              <span class="flight-time">${depTime}</span>
            </div>

            <div class="route-middle">
              <span class="duration-text">${hours}h ${mins}m</span>
              <div class="route-line">
                <svg class="route-plane-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L8 9H3L2 11L7 13L6 18L9 16L12 22L15 16L18 18L17 13L22 11L21 9H16L12 2Z"/></svg>
              </div>
              <span style="font-size: 0.7rem; color: var(--text-muted);">${flight.aircraftName || 'Airbus A320'}</span>
            </div>

            <div class="route-endpoint right">
              <span class="airport-code">${arrCode}</span>
              <span class="city-name">${arrCity}</span>
              <span class="flight-time">${arrTime}</span>
            </div>
          </div>

          <div class="flight-card-bottom">
            <div class="price-container">
              <span class="price-label">Starting From</span>
              <span class="price-value">$${flight.price} <span>USD</span></span>
            </div>
            <button class="btn btn-primary select-flight-btn" data-flight-id="${flight.id}">
              Select & Book
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners to select flight buttons
    document.querySelectorAll('.select-flight-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const flightId = btn.getAttribute('data-flight-id');
        await this.selectFlightForBooking(flightId);
      });
    });
  }

  async selectFlightForBooking(flightId) {
    this.selectedFlight = await api.getFlightById(flightId);
    this.selectedSeat = null;
    this.switchTab('seats');
    this.renderCabinSeats(flightId);
  }

  // --- Cabin Seat Map Management ---
  async renderCabinSeats(flightId) {
    if (!this.selectedFlight) {
      this.selectedFlight = await api.getFlightById(flightId) || (await api.getAvailableFlights())[0];
    }

    const titleEl = document.getElementById('seatMapFlightTitle');
    if (titleEl && this.selectedFlight) {
      titleEl.innerHTML = `
        <strong>${this.selectedFlight.flightNumber}</strong>: 
        ${this.selectedFlight.departureCity || 'LIS'} &rarr; ${this.selectedFlight.arriveCity || 'GRU'}
      `;
    }

    const cabinGrid = document.getElementById('cabinSeatGrid');
    if (!cabinGrid) return;

    cabinGrid.innerHTML = '<div class="loading-state">Loading cabin seating...</div>';

    const seats = await api.getAvailableSeats(this.selectedFlight.id);

    // Group seats by row
    const rowMap = new Map();
    seats.forEach(s => {
      if (!rowMap.has(s.row)) rowMap.set(s.row, []);
      rowMap.get(s.row).push(s);
    });

    let html = '';
    let currentSection = '';

    rowMap.forEach((rowSeats, rowNum) => {
      const seatClass = rowSeats[0]?.seatClass || 'Economy';
      
      if (seatClass !== currentSection) {
        currentSection = seatClass;
        const sectionName = seatClass === 'FirstClass' ? 'First Class Cabin' : 
                            seatClass === 'Business' ? 'Business Class Cabin' : 'Economy Cabin';
        html += `<div class="cabin-section-label">${sectionName}</div>`;
      }

      // Sort by column A-F
      rowSeats.sort((a, b) => a.col.localeCompare(b.col));
      const leftTriplet = rowSeats.filter(s => ['A', 'B', 'C'].includes(s.col));
      const rightTriplet = rowSeats.filter(s => ['D', 'E', 'F'].includes(s.col));

      html += `
        <div class="seat-row">
          <span class="row-number">${rowNum}</span>
          <div class="seat-triplet">
            ${leftTriplet.map(s => this.renderSeatButton(s)).join('')}
          </div>
          <div class="aisle-gap"></div>
          <div class="seat-triplet">
            ${rightTriplet.map(s => this.renderSeatButton(s)).join('')}
          </div>
          <span class="row-number">${rowNum}</span>
        </div>
      `;
    });

    cabinGrid.innerHTML = html;

    // Attach seat click events
    document.querySelectorAll('.seat-btn:not(.reserved)').forEach(btn => {
      btn.addEventListener('click', () => {
        const seatNum = btn.getAttribute('data-seat-num');
        const seatObj = seats.find(s => s.seatNumber === seatNum);
        this.selectSeat(seatObj);
      });
    });

    this.updateSeatSummary();
  }

  renderSeatButton(seat) {
    const isSelected = this.selectedSeat && this.selectedSeat.seatNumber === seat.seatNumber;
    const classType = seat.seatClass.toLowerCase();
    let cssClasses = `seat-btn ${classType}`;
    if (seat.isReserved) cssClasses += ' reserved';
    if (isSelected) cssClasses += ' selected';

    return `
      <button 
        class="${cssClasses}" 
        data-seat-num="${seat.seatNumber}" 
        title="Seat ${seat.seatNumber} (${seat.seatClass}, ${seat.seatType})"
        ${seat.isReserved ? 'disabled' : ''}
      >
        ${seat.seatNumber}
      </button>
    `;
  }

  selectSeat(seat) {
    this.selectedSeat = seat;
    document.querySelectorAll('.seat-btn').forEach(btn => {
      btn.classList.toggle('selected', btn.getAttribute('data-seat-num') === seat.seatNumber);
    });
    this.updateSeatSummary();
  }

  updateSeatSummary() {
    const summaryCard = document.getElementById('seatSummaryPanel');
    if (!summaryCard) return;

    if (!this.selectedFlight) {
      summaryCard.innerHTML = `<p class="text-muted">Please select a flight first.</p>`;
      return;
    }

    const basePrice = this.selectedFlight.price || 500;
    const multiplier = this.selectedSeat ? (this.selectedSeat.priceMultiplier || 1.0) : 1.0;
    const finalPrice = Math.round(basePrice * multiplier);

    summaryCard.innerHTML = `
      <div class="summary-flight-info">
        <div>
          <h4 style="font-family: var(--font-display); font-size: 1.15rem;">${this.selectedFlight.flightNumber}</h4>
          <span style="font-size: 0.82rem; color: var(--text-secondary);">${this.selectedFlight.departureCity} &rarr; ${this.selectedFlight.arriveCity}</span>
        </div>
        <span class="flight-status-badge on-time">${this.selectedFlight.status}</span>
      </div>

      <div class="selection-details-box">
        <div class="detail-row">
          <span class="label">Selected Seat:</span>
          <span class="value" style="color: var(--accent-cyan); font-size: 1.1rem;">${this.selectedSeat ? this.selectedSeat.seatNumber : 'None Selected'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Cabin Class:</span>
          <span class="value">${this.selectedSeat ? this.selectedSeat.seatClass : '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Seat Feature:</span>
          <span class="value">${this.selectedSeat ? `${this.selectedSeat.seatType} Position` : '-'}</span>
        </div>
        <div class="detail-row">
          <span class="label">Base Fare:</span>
          <span class="value">$${basePrice}</span>
        </div>
        <div class="detail-row total">
          <span class="label">Total Price:</span>
          <span class="value">$${finalPrice}</span>
        </div>
      </div>

      <button class="btn btn-primary" id="proceedToBookingBtn" ${!this.selectedSeat ? 'disabled' : ''} style="width: 100%;">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        Proceed with Passenger & Booking
      </button>
    `;

    const proceedBtn = document.getElementById('proceedToBookingBtn');
    if (proceedBtn) {
      proceedBtn.addEventListener('click', () => {
        this.openBookingModal();
      });
    }
  }

  // --- Passenger Management ---
  async loadPassengers() {
    const list = document.getElementById('passengersTableBody');
    if (!list) return;

    list.innerHTML = '<tr><td colspan="5" style="text-align: center;">Loading passengers...</td></tr>';
    const passengers = await api.getPassengers();

    if (passengers.length === 0) {
      list.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">No passengers registered yet.</td></tr>';
      return;
    }

    list.innerHTML = passengers.map(p => `
      <tr>
        <td>
          <div style="display: flex; align-items: center;">
            <span class="passenger-avatar">${p.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>${p.name}</strong>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${p.email || 'N/A'}</div>
            </div>
          </div>
        </td>
        <td><code>${p.passportNumber}</code></td>
        <td><span class="flight-status-badge flying">${p.passengerType || 'Adult'}</span></td>
        <td>${p.age} yrs</td>
        <td>
          <button class="btn btn-secondary quick-book-pass-btn" data-passenger-id="${p.id}" style="padding: 0.35rem 0.75rem; font-size: 0.78rem;">
            Book Flight
          </button>
        </td>
      </tr>
    `).join('');

    document.querySelectorAll('.quick-book-pass-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const passId = btn.getAttribute('data-passenger-id');
        this.selectedPassenger = passengers.find(p => p.id === passId);
        this.switchTab('flights');
        this.showToast(`Selected passenger: ${this.selectedPassenger.name}. Please select a flight.`, 'info');
      });
    });
  }

  async handleRegisterPassenger(e) {
    e.preventDefault();
    const name = document.getElementById('passName').value.trim();
    const passportNumber = document.getElementById('passPassport').value.trim();
    const age = document.getElementById('passAge').value;
    const passengerType = document.getElementById('passType').value;
    const email = document.getElementById('passEmail').value.trim();
    const phone = document.getElementById('passPhone').value.trim();

    if (!name || !passportNumber) {
      this.showToast('Please provide passenger name and passport number', 'error');
      return;
    }

    try {
      const passenger = await api.registerPassenger({
        name,
        passportNumber,
        age,
        passengerType,
        email,
        phone
      });

      this.showToast(`Passenger ${passenger.name} registered successfully!`, 'success');
      document.getElementById('registerPassengerForm').reset();
      await this.loadPassengers();
    } catch (err) {
      this.showToast('Failed to register passenger', 'error');
    }
  }

  // --- Bookings & Boarding Pass Generator ---
  async loadBookings() {
    const list = document.getElementById('bookingsList');
    if (!list) return;

    list.innerHTML = '<div class="loading-state">Loading reservations...</div>';
    const bookings = await api.getBookings();

    if (bookings.length === 0) {
      list.innerHTML = `
        <div style="text-align: center; padding: 3rem; color: var(--text-muted);">
          <h3>No confirmed bookings found</h3>
          <p>Select a flight and complete a booking to view and print boarding passes.</p>
        </div>
      `;
      return;
    }

    list.innerHTML = bookings.map(b => `
      <div class="boarding-pass-card">
        <div class="pass-main">
          <div class="pass-header">
            <div>
              <span class="pass-field-label">AEROS BOARDING PASS</span>
              <div class="pass-flight-number">${b.flightNumber}</div>
            </div>
            <span class="flight-status-badge on-time">${b.status || 'Confirmed'}</span>
          </div>

          <div class="grid-cols-4">
            <div>
              <span class="pass-field-label">Passenger</span>
              <div class="pass-field-value">${b.passengerName}</div>
            </div>
            <div>
              <span class="pass-field-label">Passport</span>
              <div class="pass-field-value">${b.passengerPassport}</div>
            </div>
            <div>
              <span class="pass-field-label">From</span>
              <div class="pass-field-value">${b.departureCity}</div>
            </div>
            <div>
              <span class="pass-field-label">To</span>
              <div class="pass-field-value">${b.arriveCity}</div>
            </div>
          </div>

          <div class="grid-cols-4" style="border-top: 1px solid var(--border-subtle); padding-top: 1rem;">
            <div>
              <span class="pass-field-label">Gate</span>
              <div class="pass-field-value" style="color: var(--accent-cyan);">${b.gate || 'G12'}</div>
            </div>
            <div>
              <span class="pass-field-label">Terminal</span>
              <div class="pass-field-value">${b.terminal || 'T1'}</div>
            </div>
            <div>
              <span class="pass-field-label">Boarding Time</span>
              <div class="pass-field-value">${b.boardingTime || '45m prior'}</div>
            </div>
            <div>
              <span class="pass-field-label">Seat Class</span>
              <div class="pass-field-value">${b.seatClass || 'Economy'}</div>
            </div>
          </div>

          <div class="barcode-strip"></div>
        </div>

        <div class="pass-stub">
          <div style="width: 100%;">
            <span class="pass-field-label">FLIGHT PASS STUB</span>
            <div style="font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; margin-top: 0.4rem;">${b.seatNumber}</div>
            <span style="font-size: 0.8rem; color: var(--text-secondary);">${b.passengerName}</span>
          </div>

          <div class="qr-placeholder">
            <div class="qr-pattern"></div>
          </div>

          <div style="width: 100%;">
            <div style="font-size: 0.72rem; color: var(--text-muted);">REF: ${b.bookingNumber}</div>
            <button class="btn btn-secondary print-pass-btn" onclick="window.print()" style="width: 100%; margin-top: 0.75rem; padding: 0.4rem;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
              Print Ticket
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // --- Booking Checkout Modal ---
  async openBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (!modal) return;

    // Populate passenger selection dropdown
    const passengers = await api.getPassengers();
    const passSelect = document.getElementById('modalPassengerSelect');
    if (passSelect) {
      let options = '<option value="" disabled selected>Choose Passenger</option>';
      passengers.forEach(p => {
        const isSel = this.selectedPassenger && this.selectedPassenger.id === p.id;
        options += `<option value="${p.id}" ${isSel ? 'selected' : ''}>${p.name} (Passport: ${p.passportNumber})</option>`;
      });
      passSelect.innerHTML = options;
    }

    const flightSummaryEl = document.getElementById('modalFlightSummary');
    if (flightSummaryEl && this.selectedFlight && this.selectedSeat) {
      const basePrice = this.selectedFlight.price || 500;
      const total = Math.round(basePrice * (this.selectedSeat.priceMultiplier || 1.0));
      flightSummaryEl.innerHTML = `
        <div class="selection-details-box">
          <div class="detail-row">
            <span class="label">Flight:</span>
            <span class="value">${this.selectedFlight.flightNumber} (${this.selectedFlight.departureCity} &rarr; ${this.selectedFlight.arriveCity})</span>
          </div>
          <div class="detail-row">
            <span class="label">Seat:</span>
            <span class="value" style="color: var(--accent-cyan); font-weight: 700;">${this.selectedSeat.seatNumber} (${this.selectedSeat.seatClass})</span>
          </div>
          <div class="detail-row total">
            <span class="label">Total Payment:</span>
            <span class="value">$${total}</span>
          </div>
        </div>
      `;
    }

    modal.classList.add('active');
  }

  closeBookingModal() {
    const modal = document.getElementById('bookingModal');
    if (modal) modal.classList.remove('active');
  }

  async handleConfirmBooking(e) {
    e.preventDefault();
    const passengerId = document.getElementById('modalPassengerSelect').value;
    const description = document.getElementById('modalBookingNotes').value;

    if (!passengerId) {
      this.showToast('Please select a passenger for this booking', 'error');
      return;
    }

    const basePrice = this.selectedFlight.price || 500;
    const totalPrice = Math.round(basePrice * (this.selectedSeat.priceMultiplier || 1.0));

    try {
      const booking = await api.createBooking({
        passengerId,
        flightId: this.selectedFlight.id,
        seatNumber: this.selectedSeat.seatNumber,
        seatClass: this.selectedSeat.seatClass,
        totalPrice,
        description
      });

      this.closeBookingModal();
      this.showToast(`Booking ${booking.bookingNumber} confirmed successfully! Boarding pass issued.`, 'success');
      this.switchTab('bookings');
    } catch (err) {
      this.showToast('Failed to complete booking', 'error');
    }
  }

  // --- Operations & Admin Console ---
  async loadAdminOverview() {
    const flights = await api.getAvailableFlights();
    const airports = await api.getAirports();
    const aircrafts = await api.getAircrafts();
    const bookings = await api.getBookings();

    const statFlights = document.getElementById('adminStatFlights');
    const statAirports = document.getElementById('adminStatAirports');
    const statAircrafts = document.getElementById('adminStatAircrafts');
    const statBookings = document.getElementById('adminStatBookings');

    if (statFlights) statFlights.innerText = flights.length;
    if (statAirports) statAirports.innerText = airports.length;
    if (statAircrafts) statAircrafts.innerText = aircrafts.length;
    if (statBookings) statBookings.innerText = bookings.length;
  }

  async handleCreateFlight(e) {
    e.preventDefault();
    const flightNumber = document.getElementById('adminFlightNumber').value.trim();
    const aircraftId = document.getElementById('adminAircraft').value;
    const departureAirportId = document.getElementById('adminDepAirport').value;
    const arriveAirportId = document.getElementById('adminArrAirport').value;
    const departureDate = document.getElementById('adminDepDate').value;
    const arriveDate = document.getElementById('adminArrDate').value;
    const durationMinutes = document.getElementById('adminDuration').value;
    const price = document.getElementById('adminPrice').value;
    const status = document.getElementById('adminStatus').value;

    if (!flightNumber || !aircraftId || !departureAirportId || !arriveAirportId || !departureDate || !arriveDate) {
      this.showToast('Please fill out all required flight fields', 'error');
      return;
    }

    try {
      await api.createFlight({
        flightNumber,
        aircraftId,
        departureAirportId,
        arriveAirportId,
        departureDate,
        arriveDate,
        durationMinutes,
        price,
        status
      });

      this.showToast(`Flight ${flightNumber} created successfully!`, 'success');
      document.getElementById('adminCreateFlightForm').reset();
      await this.loadFlights();
      await this.loadAdminOverview();
    } catch (err) {
      this.showToast('Failed to create flight', 'error');
    }
  }

  async handleCreateAirport(e) {
    e.preventDefault();
    const name = document.getElementById('adminAirportName').value.trim();
    const code = document.getElementById('adminAirportCode').value.trim();
    const address = document.getElementById('adminAirportAddress').value.trim();

    if (!name || !code || !address) {
      this.showToast('Please fill out all airport fields', 'error');
      return;
    }

    try {
      await api.createAirport({ name, code, address });
      this.showToast(`Airport ${code} added!`, 'success');
      document.getElementById('adminCreateAirportForm').reset();
      await this.populateAirportDropdowns();
      await this.loadAdminOverview();
    } catch (err) {
      this.showToast('Failed to add airport', 'error');
    }
  }

  async handleCreateAircraft(e) {
    e.preventDefault();
    const name = document.getElementById('adminAircraftName').value.trim();
    const model = document.getElementById('adminAircraftModel').value.trim();
    const manufacturingYear = document.getElementById('adminAircraftYear').value;

    if (!name || !model) {
      this.showToast('Please fill out aircraft name and model', 'error');
      return;
    }

    try {
      await api.createAircraft({ name, model, manufacturingYear });
      this.showToast(`Aircraft ${name} added!`, 'success');
      document.getElementById('adminCreateAircraftForm').reset();
      await this.populateAircraftDropdowns();
      await this.loadAdminOverview();
    } catch (err) {
      this.showToast('Failed to add aircraft', 'error');
    }
  }

  // --- Event Listeners Setup ---
  setupEventListeners() {
    // Theme toggle
    document.getElementById('themeToggleBtn')?.addEventListener('click', () => this.toggleTheme());

    // Mode toggle (Live vs Mock)
    document.getElementById('modeToggleBtn')?.addEventListener('click', () => this.toggleLiveMode());

    // Search filters
    document.getElementById('searchFlightsBtn')?.addEventListener('click', () => this.loadFlights());
    document.getElementById('clearSearchBtn')?.addEventListener('click', () => {
      document.getElementById('searchFromAirport').value = '';
      document.getElementById('searchToAirport').value = '';
      document.getElementById('searchFlightDate').value = '';
      this.loadFlights();
    });

    // Passenger registration
    document.getElementById('registerPassengerForm')?.addEventListener('submit', (e) => this.handleRegisterPassenger(e));

    // Booking modal confirmation
    document.getElementById('modalConfirmBookingForm')?.addEventListener('submit', (e) => this.handleConfirmBooking(e));
    document.getElementById('modalCloseBtn')?.addEventListener('click', () => this.closeBookingModal());
    document.getElementById('modalCancelBtn')?.addEventListener('click', () => this.closeBookingModal());

    // Admin forms
    document.getElementById('adminCreateFlightForm')?.addEventListener('submit', (e) => this.handleCreateFlight(e));
    document.getElementById('adminCreateAirportForm')?.addEventListener('submit', (e) => this.handleCreateAirport(e));
    document.getElementById('adminCreateAircraftForm')?.addEventListener('submit', (e) => this.handleCreateAircraft(e));
  }

  // --- Toast Notifications ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const iconSvg = type === 'success' 
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>'
      : type === 'error'
      ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      : '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';

    toast.innerHTML = `${iconSvg} <span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.aerosApp = new AerosApp();
});
