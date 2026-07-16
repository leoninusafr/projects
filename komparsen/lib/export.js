'use strict';
// ADAG-Abrechnungs-Export. Erzeugt CSV + einfache Zusammenfassung.
// ADAG = Arbeitsgemeinschaft Dienstleistungs- und Abrechnungsgesellschaft (Zeitarbeit).
const db = require('./db');

async function exportBookings({ status, from, to } = {}) {
  const db2 = await db.ensure();
  let bookings = db2.bookings;
  if (status) bookings = bookings.filter(b => b.status === status);
  if (from) bookings = bookings.filter(b => b.date_start >= from);
  if (to) bookings = bookings.filter(b => b.date_start <= to);

  const lines = [['booking_id', 'extra_id', 'production_id', 'titel', 'start', 'ende',
    'ort', 'tagessatz_eur', 'tage', 'summe_eur', 'status']];
  let total = 0;
  for (const b of bookings) {
    const start = new Date(b.date_start), end = new Date(b.date_end);
    const tage = Math.max(1, Math.round((end - start) / (24 * 3600 * 1000)) + 1);
    const rate = Number(b.day_rate || 0);
    const sum = tage * rate;
    total += sum;
    lines.push([b.id, b.extra_id, b.production_id, b.title || '', b.date_start || '', b.date_end || '',
      b.location || '', rate.toFixed(2), tage, sum.toFixed(2), b.status]);
  }
  const csv = lines.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  return { csv, total: total.toFixed(2), count: bookings.length };
}

module.exports = { exportBookings };
