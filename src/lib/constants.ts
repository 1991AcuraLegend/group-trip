export const ENTRY_COLORS = {
  flight:     "#3b8cf0", // ocean-500
  lodging:    "#2bb8a2", // seafoam-500
  carRental:  "#d4b57c", // sand-400
  restaurant: "#f97356", // coral-500
  activity:   "#60a8f8", // ocean-400
} as const;

export const ENTRY_LABELS = {
  flight: "Flights",
  lodging: "Lodging",
  carRental: "Transport",
  restaurant: "Food",
  activity: "Activities",
} as const;

export const SHARE_CODE_LENGTH = 10;
export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024; // 5MB
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
