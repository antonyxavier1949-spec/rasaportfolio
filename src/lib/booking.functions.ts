import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { adminEmail, bookingServices } from "@/lib/booking-data";
import { bookingSchema, deleteSchema, editBookingSchema, updateSchema } from "@/lib/booking-schema";

export const createBooking = createServerFn({ method: "POST" })
  .inputValidator((input) => bookingSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env["SUPABASE_URL"];
    const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
    if (!url || !key) throw new Error("Booking service is unavailable. Please try again shortly.");

    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const requestIp = getRequestIP({ xForwardedFor: true }) ?? "unknown";
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(requestIp));
    const ip = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
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

export const getAdminBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || userData.user?.email?.toLowerCase() !== adminEmail) {
      throw new Error("You do not have access to the booking page.");
    }
    const { data: hasAdminRole, error: roleError } = await supabase.rpc("has_admin_role");
    if (roleError || !hasAdminRole) throw new Error("You do not have access to the booking page.");

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
    const { supabase } = context;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email?.toLowerCase() !== adminEmail) throw new Error("You do not have access to update bookings.");
    const { data: hasAdminRole } = await supabase.rpc("has_admin_role");
    if (!hasAdminRole) throw new Error("You do not have access to update bookings.");
    const { error } = await supabase.from("bookings").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error("The booking status could not be saved.");
    return { ok: true };
  });

export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => deleteSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email?.toLowerCase() !== adminEmail) throw new Error("You do not have access to delete bookings.");
    const { data: hasAdminRole } = await supabase.rpc("has_admin_role");
    if (!hasAdminRole) throw new Error("You do not have access to delete bookings.");
    const { error } = await supabase.from("bookings").delete().eq("id", data.id);
    if (error) throw new Error("The booking could not be deleted.");
    return { ok: true };
  });

export const editBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => editBookingSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: userData } = await supabase.auth.getUser();
    if (userData.user?.email?.toLowerCase() !== adminEmail) throw new Error("You do not have access to edit bookings.");
    const { data: hasAdminRole } = await supabase.rpc("has_admin_role");
    if (!hasAdminRole) throw new Error("You do not have access to edit bookings.");
    const { id, name, phone, email, service, date, time, message } = data;
    const { error } = await supabase.from("bookings").update({
      customer_name: name,
      customer_phone: phone,
      customer_email: email,
      service_name: service,
      preferred_date: date,
      preferred_time: time,
      customer_message: message,
    }).eq("id", id);
    if (error) throw new Error("The booking details could not be saved.");
    return { ok: true };
  });