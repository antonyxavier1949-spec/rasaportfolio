export const serviceRows = [
  ["Financier", "Investor"],
  ["Philosopher", "Relationship Counsellor"],
  ["Strangers Partner", "Event Co-ordinator"],
  ["Life Partner", "Sperm Donor"],
  ["Authentic Speaker", "Time Seller"],
  ["Yoga Instructor", "Skater"],
  ["Actor", "Singer"],
  ["Dancer", "Model"],
  ["Producer", "Sponsor"],
] as const;

export const bookingServices = [
  ...serviceRows.flat(),
  "Astrologer",
] as const;

export const adminEmail = "rasaking@gmail.com";