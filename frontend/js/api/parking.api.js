/**
 * PARKWISE - Parking Operations API Client
 * Phase 2.10: Full Frontend-Backend Integration
 */

import { storageService } from '../services/storage.service.js';
import { apiRequest, createApiResponse, delay } from './api.js';

export const parkingApi = {
  /**
   * Fetch all campus parking lots with dynamically computed availability.
   */
  async getLots() {
    const mockFallback = () => {
      const lots = storageService.get('lots', []);
      const computed = lots.map((lot) => {
        const total = Number(lot.totalCapacity) || 1;
        const occupied = Math.max(0, Number(lot.occupiedSpaces) || 0);
        const available = Math.max(0, total - occupied);
        return {
          ...lot,
          id: lot._id || lot.id,
          totalCapacity: total,
          occupiedSpaces: occupied,
          availableSpaces: available,
          occupancyPercentage: Math.round((occupied / total) * 100),
          availabilityPercentage: Math.round((available / total) * 100)
        };
      });
      return createApiResponse(true, computed, 'Fetched parking lots');
    };

    const res = await apiRequest('/parking-lots', { method: 'GET' }, mockFallback);
    if (res.success && res.data?.lots) {
      const formatted = res.data.lots.map((lot) => ({
        ...lot,
        id: lot._id || lot.id
      }));
      // Keep local store in sync
      storageService.set('lots', formatted);
      return createApiResponse(true, formatted, res.message || 'Fetched parking lots');
    }

    return res;
  },

  /**
   * Fetch a parking lot by its unique identifier or lotCode.
   */
  async getLotById(lotId) {
    const res = await this.getLots();
    const lot = (res.data || []).find((l) => l.id === lotId || l.lotCode === lotId);
    if (!lot) {
      return createApiResponse(false, null, 'Parking lot not found', 404);
    }
    return createApiResponse(true, lot, 'Parking lot details retrieved');
  },

  /**
   * Match parking lot by scanned QR code identifier.
   */
  async getLotByQr(qrCodeId) {
    const res = await this.getLots();
    const normalizedQr = (qrCodeId || '').trim().toUpperCase();
    const lot = (res.data || []).find(
      (l) =>
        (l.qrCodeId || '').toUpperCase() === normalizedQr ||
        l.lotCode === normalizedQr ||
        `PARKWISE-LOT-${l.lotCode}` === normalizedQr
    );
    if (!lot) {
      return createApiResponse(false, null, `Invalid or unrecognized parking QR code: "${qrCodeId}"`, 404);
    }
    return createApiResponse(true, lot, 'QR code successfully verified');
  },

  /**
   * Start parking session via QR code check-in.
   */
  async checkIn({ lotId, lotCode, vehicleNumber, userId }) {
    let code = lotCode;
    if (!code) {
      const lotsRes = await this.getLots();
      const matched = (lotsRes.data || []).find((l) => l.id === lotId || l.lotCode === lotId);
      code = matched ? matched.lotCode : 'A';
    }

    const qrToken = `PARKWISE-LOT-${code}`;

    const mockFallback = () => {
      const sessions = storageService.get('sessions', []);
      const lots = storageService.get('lots', []);
      const lotIndex = lots.findIndex((l) => l.lotCode === code || l.id === lotId);
      if (lotIndex === -1) return createApiResponse(false, null, 'Lot not found', 404);

      const lot = lots[lotIndex];
      lot.occupiedSpaces = (lot.occupiedSpaces || 0) + 1;
      lots[lotIndex] = lot;
      storageService.set('lots', lots);

      const newSession = {
        id: `sess_${Date.now()}`,
        userId,
        lotId: lot.id || lot._id,
        lotName: lot.lotName,
        lotCode: lot.lotCode,
        vehicleNumber: vehicleNumber || 'CW-4482',
        entryTime: new Date().toISOString(),
        exitTime: null,
        status: 'active',
        pointsEarned: 0
      };
      sessions.unshift(newSession);
      storageService.set('sessions', sessions);
      return createApiResponse(true, { session: newSession, lot }, 'Check-in successful', 201);
    };

    const res = await apiRequest(
      '/parking-sessions/scan',
      {
        method: 'POST',
        body: JSON.stringify({ qrToken, vehicleNumber })
      },
      mockFallback
    );

    if (res.success && res.data?.action === 'checkin') {
      const rawSession = res.data.session;
      const lot = res.data.lot;
      const session = {
        ...rawSession,
        id: rawSession._id || rawSession.id,
        lotId: lot?._id || lot?.id || rawSession.parkingLotId?._id || rawSession.parkingLotId,
        lotName: lot?.lotName || rawSession.parkingLotId?.lotName || `Lot ${code}`,
        lotCode: lot?.lotCode || rawSession.parkingLotId?.lotCode || code,
        pointsEarned: 0
      };

      // Sync active session locally
      const sessions = storageService.get('sessions', []);
      sessions.unshift(session);
      storageService.set('sessions', sessions);

      return createApiResponse(true, { session, lot }, res.message || 'Check-in successful!', 201);
    }

    return res;
  },

  /**
   * End active parking session via checkout.
   */
  async checkOut({ sessionId, lotId, lotCode, userId }) {
    let code = lotCode;
    if (!code) {
      const activeRes = await this.getActiveSession(userId);
      if (activeRes.data?.lot?.lotCode) {
        code = activeRes.data.lot.lotCode;
      } else if (activeRes.data?.lotCode) {
        code = activeRes.data.lotCode;
      } else {
        code = 'A';
      }
    }

    const qrToken = `PARKWISE-LOT-${code}`;

    const mockFallback = () => {
      const sessions = storageService.get('sessions', []);
      const lots = storageService.get('lots', []);
      const sessionIndex = sessions.findIndex((s) => s.status === 'active');
      if (sessionIndex === -1) return createApiResponse(false, null, 'No active session', 404);

      const session = sessions[sessionIndex];
      session.status = 'completed';
      session.exitTime = new Date().toISOString();
      session.pointsEarned = 20;
      sessions[sessionIndex] = session;
      storageService.set('sessions', sessions);

      return createApiResponse(true, { session, pointsEarned: 20, lot: lots[0] }, 'Check-out successful!');
    };

    const res = await apiRequest(
      '/parking-sessions/scan',
      {
        method: 'POST',
        body: JSON.stringify({ qrToken })
      },
      mockFallback
    );

    if (res.success && res.data?.action === 'checkout') {
      const session = res.data.session;
      const lot = res.data.lot;
      const pointsEarned = res.data.pointsEarned || 0;

      // Update local storage session cache
      const sessions = storageService.get('sessions', []);
      const idx = sessions.findIndex((s) => s.status === 'active');
      if (idx !== -1) {
        sessions[idx].status = 'completed';
        sessions[idx].exitTime = session.exitTime || new Date().toISOString();
        sessions[idx].pointsEarned = pointsEarned;
        storageService.set('sessions', sessions);
      }

      // Refresh user balance in storage
      const user = storageService.get('current_user');
      if (user) {
        user.walletBalance = (user.walletBalance || 0) + pointsEarned;
        user.rewardPoints = (user.rewardPoints || 0) + pointsEarned;
        storageService.set('current_user', user);
      }

      return createApiResponse(
        true,
        {
          session,
          pointsEarned,
          totalPoints: user ? user.walletBalance : pointsEarned,
          lot
        },
        res.message || `Checkout successful! You earned +${pointsEarned} reward points.`
      );
    }

    return res;
  },

  /**
   * Retrieve active session for a given user.
   */
  async getActiveSession(userId) {
    const mockFallback = () => {
      const sessions = storageService.get('sessions', []);
      const active = sessions.find((s) => s.status === 'active');
      if (!active) return createApiResponse(true, null, 'No active session');
      return createApiResponse(true, active, 'Active session retrieved');
    };

    const res = await apiRequest('/parking-sessions/active', { method: 'GET' }, mockFallback);
    if (res.success) {
      const s = res.data?.session;
      if (!s) return createApiResponse(true, null, 'No active session');

      const lot = s.parkingLotId;
      const formatted = {
        ...s,
        id: s._id || s.id,
        lotId: lot?._id || lot?.id || s.parkingLotId,
        lotName: lot?.lotName || 'Campus Parking Lot',
        lotCode: lot?.lotCode || 'A',
        lot: lot ? { ...lot, id: lot._id || lot.id } : null
      };
      return createApiResponse(true, formatted, 'Active session retrieved');
    }

    return res;
  },

  /**
   * Retrieve session history for a student.
   */
  async getUserSessions(userId) {
    const mockFallback = () => {
      const sessions = storageService.get('sessions', []);
      return createApiResponse(true, sessions, 'Sessions retrieved');
    };

    const res = await apiRequest('/parking-sessions/history', { method: 'GET' }, mockFallback);
    if (res.success && res.data?.sessions) {
      const formatted = res.data.sessions.map((s) => ({
        ...s,
        id: s._id || s.id,
        lotName: s.parkingLotId?.lotName || s.lotName || 'Campus Lot',
        lotCode: s.parkingLotId?.lotCode || s.lotCode || 'A'
      }));
      return createApiResponse(true, formatted, 'Sessions retrieved');
    }

    return res;
  },

  /**
   * Admin: Update parking lot information or capacity.
   */
  async updateLot(lotId, { lotName, location, totalCapacity, isActive }) {
    const res = await apiRequest(
      `/admin/parking-lots/${lotId}`,
      {
        method: 'PATCH',
        body: JSON.stringify({ lotName, location, totalCapacity: Number(totalCapacity), isActive })
      },
      () => {
        const lots = storageService.get('lots', []);
        const idx = lots.findIndex((l) => l.id === lotId || l.lotCode === lotId);
        if (idx !== -1) {
          lots[idx].totalCapacity = Number(totalCapacity) || lots[idx].totalCapacity;
          storageService.set('lots', lots);
        }
        return createApiResponse(true, lots[idx], 'Lot updated');
      }
    );

    return res;
  }
};
