// categories
export const CS_CATEGORIES = [
  "Photo Studio",
  "Film Stage",
  "Podcast Lounge",
  "Music Suite",
  "Art Workshop",
];

// sort options
export const CS_SORT_OPTIONS = {
  newest: { createdAt: -1, _id: -1 },
  rating: { rating: -1, reviewCount: -1, _id: -1 },
  price_asc: { hourlyRate: 1, _id: 1 },
  price_desc: { hourlyRate: -1, _id: -1 },
};
