import type { Flight, Lodging, CarRental, Restaurant, Activity } from '@prisma/client';
import type { EntryType } from '@/types';

export function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatDatetime(d: Date | string) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export function formatCost(cost: number | null | undefined) {
  if (cost == null) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cost);
}

export function Row({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="min-w-[90px] text-sand-400">{label}</span>
      <span className="text-sand-700">{value}</span>
    </div>
  );
}

export function CardBody({ type, entry }: { type: EntryType; entry: Flight | Lodging | CarRental | Restaurant | Activity }) {
  switch (type) {
    case 'flight': {
      const f = entry as Flight;
      return (
        <>
          <p className="font-semibold text-gray-900">{f.airline}{f.flightNumber ? ` · ${f.flightNumber}` : ''}</p>
          <Row label="Route" value={`${f.departureCity} → ${f.arrivalCity}`} />
          <Row label="Airports" value={f.departureAirport && f.arrivalAirport ? `${f.departureAirport} → ${f.arrivalAirport}` : null} />
          <Row label="Departure" value={formatDatetime(f.departureDate)} />
          <Row label="Arrival" value={formatDatetime(f.arrivalDate)} />
          <Row label="Conf. #" value={f.confirmationNum} />
          <Row label="Cost" value={formatCost(f.cost)} />
        </>
      );
    }
    case 'lodging': {
      const l = entry as Lodging;
      return (
        <>
          <p className="font-semibold text-gray-900">{l.name}</p>
          <Row label="Address" value={l.address} />
          <Row label="Check-in" value={formatDatetime(l.checkIn)} />
          <Row label="Check-out" value={formatDatetime(l.checkOut)} />
          <Row label="Conf. #" value={l.confirmationNum} />
          <Row label="Cost" value={formatCost(l.cost)} />
        </>
      );
    }
    case 'carRental': {
      const c = entry as CarRental;
      return (
        <>
          <p className="font-semibold text-gray-900">{c.company}</p>
          <Row label="Pickup" value={c.pickupAddress} />
          {c.dropoffAddress && <Row label="Drop-off" value={c.dropoffAddress} />}
          <Row label="Pickup date" value={formatDatetime(c.pickupDate)} />
          <Row label="Drop-off" value={formatDatetime(c.dropoffDate)} />
          <Row label="Conf. #" value={c.confirmationNum} />
          <Row label="Cost" value={formatCost(c.cost)} />
        </>
      );
    }
    case 'restaurant': {
      const r = entry as Restaurant;
      return (
        <>
          <p className="font-semibold text-gray-900">{r.name}</p>
          <Row label="Address" value={r.address} />
          <Row label="Date" value={formatDate(r.date)} />
          <Row label="Time" value={r.time} />
          <Row label="Cuisine" value={r.cuisine} />
          <Row label="Price" value={r.priceRange} />
          <Row label="Reservation" value={r.reservationId} />
          <Row label="Cost" value={formatCost(r.cost)} />
        </>
      );
    }
    case 'activity': {
      const a = entry as Activity;
      return (
        <>
          <p className="font-semibold text-gray-900">{a.name}</p>
          <Row label="Address" value={a.address} />
          <Row label="Date" value={formatDate(a.date)} />
          <Row label="Time" value={a.startTime ? (a.endTime ? `${a.startTime} – ${a.endTime}` : a.startTime) : null} />
          <Row label="Category" value={a.category} />
          <Row label="Booking" value={a.bookingRef} />
          <Row label="Cost" value={formatCost(a.cost)} />
        </>
      );
    }
  }
}
