export const AI_TRIP_PROMPT = `===

Based on the trip description above, generate a detailed trip plan as a JSON object. Create a full itinerary with activities throughout each day from morning to evening. Include three meals per day (breakfast, lunch, dinner) — except skip meals that occur before arrival flights land or after departure flights take off.

Validate that your output is well-formed JSON, then save it to a file named trip-plan.json. Do not output anything else — no markdown fences, no explanation, no commentary.

REQUIRED FORMAT:
{
  "version": 1,
  "trip": {
    "name": "string",
    "description": "string",
    "startDate": "ISO 8601 datetime",
    "endDate": "ISO 8601 datetime"
  },
  "entries": {
    "flights": [],
    "lodgings": [],
    "carRentals": [],
    "restaurants": [],
    "activities": []
  }
}

ENTRY FIELDS (* = required):

Flight:
  airline*, departureCity*, arrivalCity*, departureDate*, arrivalDate*,
  flightNumber, departureAirport, arrivalAirport, notes, cost

Lodging:
  name*, address*, checkIn*, checkOut*,
  lat, lng, notes, cost

Car Rental:
  company*, pickupAddress*, pickupDate*, dropoffDate*,
  dropoffAddress, pickupLat, pickupLng, notes, cost

Restaurant:
  name*, address*, date*,
  time (e.g. "7:30 PM"), lat, lng, cuisine, priceRange, notes, cost

Activity:
  name*, date*,
  address, startTime (e.g. "10:00 AM"), endTime (e.g. "2:00 PM"),
  lat, lng, category, notes, cost

REQUIREMENTS:
- All dates must be ISO 8601 strings (e.g. "2025-06-01T10:00:00.000Z")
- cost is a number (USD, no currency symbol)
- lat/lng are decimal coordinates (e.g. 37.3382, -121.8863)
- Use real place names, real addresses, and accurate coordinates
- Suggest realistic cost estimates
- Fill each day with activities from morning through evening
- Include breakfast, lunch, and dinner for each full day (skip meals outside travel hours)
- Space entries logically throughout each day
- Match the traveler's stated preferences and interests
- Include all 5 entry arrays even if empty
- Keep notes brief and useful (e.g. "Reservation recommended")
- Do not include any fields not listed above`;
