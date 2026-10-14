import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { adminEmail, bookingServices } from "@/lib/booking-data";

const bookingSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,19}$/, "Enter a valid phone number with country code."),
  email: z.string().trim().email().max(255),
  service: z.string().refine((service) => bookingServices.some((available) => available === service), "Choose a valid service."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().trim().max(1000),
});

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Booking service is unavailable. Please try again shortly.");

    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const ip = "booking-client";
    const { data: rows, error } = await client.rpc("create_booking_request", {
      p_ip_hash: ip,
      p_customer_name: data.name,
      p_customer_phone: data.phone,
      p_customer_email: data.email,
      p_service_name: data.service,
      p_preferred_date: data.date,
      p_preferred_time: data.time,
      p_customer_message: data.message,
    });
    if (error) throw new Error(error.message);
    const booking = rows?.[0];
    if (!booking) throw new Error("Your request could not be saved. Please try again.");
    return booking;
  });

const updateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

export const getAdminBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || userData.user?.email?.toLowerCase() !== adminEmail) {
      throw new Error("You do not have access to the booking page.");
    }
    const { data: role, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (roleError || !role) throw new Error("You do not have access to the booking page.");

    const { data, error } = await supabase
      .from("bookings")
      .select("id, booking_reference, customer_name, customer_phone, customer_email, service_name, preferred_date, preferred_time, customer_message, status, created_at, whatsapp_status")
      .order("created_at", { ascending: false });
    if (error) throw new Error("Bookings could not be loaded. Please refresh and try again.");
    return data ?? [];
  });

export const updateBookingStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email?.toLowerCase() !== adminEmail) throw new Error("You do not have access to update bookings.");
    const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
    if (!role) throw new Error("You do not have access to update bookings.");
    const { error } = await supabase.from("bookings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("The booking status could not be saved.");
    return { ok: true };
  });