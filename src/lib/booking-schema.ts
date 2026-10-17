import { z } from "zod";

import { bookingServices } from "@/lib/booking-data";

export const bookingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,19}$/, "Enter a valid phone number with country code."),
  email: z.string().trim().email().max(255),
  service: z.string().refine((service) => bookingServices.some((available) => available === service), "Choose a valid service."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((date) => {
    const indiaToday = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
    return date >= indiaToday;
  }, "Choose today or a future date."),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/, "Choose a valid time."),
  message: z.string().trim().max(1000),
});

export const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const deleteSchema = z.object({ id: z.string().uuid() });

export const editBookingSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,19}$/),
  email: z.string().trim().email().max(255),
  service: z.string().refine((service) => bookingServices.some((available) => available === service)),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  message: z.string().trim().max(1000),
});