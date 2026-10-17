import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Download, ExternalLink, LogOut, RefreshCw, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { bookingServices } from "@/lib/booking-data";
import { deleteBooking, editBooking, getAdminBookings, updateBookingStatus } from "@/lib/booking.functions";
import type { Tables } from "@/integrations/supabase/types";

type Booking = Tables<"bookings">;
type Status = "pending" | "confirmed" | "completed" | "cancelled";
type BookingEdit = {
  name: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  message: string;
};

const statuses: Status[] = ["pending", "confirmed", "completed", "cancelled"];
const blankEdit: BookingEdit = { name: "", phone: "", email: "", service: "", date: "", time: "", message: "" };

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Booking Administration | Touch My Heart" },
      { name: "description", content: "Private booking management for Touch My Heart." },
      { property: "og:title", content: "Booking Administration | Touch My Heart" },
      { property: "og:description", content: "Review and manage Touch My Heart booking requests." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminBookingsPage,
});

function AdminBookingsPage() {
  const navigate = useNavigate();
  const getBookings = useServerFn(getAdminBookings);
  const changeStatus = useServerFn(updateBookingStatus);
  const removeBooking = useServerFn(deleteBooking);
  const saveBooking = useServerFn(editBooking);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editValues, setEditValues] = useState<BookingEdit>(blankEdit);
  const [deletingBooking, setDeletingBooking] = useState<Booking | null>(null);
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);

  async function refreshBookings(initial = false) {
    if (initial) setLoading(true);
    else setRefreshing(true);
    setErrorMessage("");
    try {
      const rows = await getBookings();
      setBookings(rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Bookings could not be loaded.";
      setErrorMessage(message);
      if (message.toLowerCase().includes("access") || message.toLowerCase().includes("unauthorized")) {
        await supabase.auth.signOut();
        void navigate({ to: "/admin/login", replace: true });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshBookings(true);
    const interval = window.setInterval(() => void refreshBookings(), 30_000);
    return () => window.clearInterval(interval);
  }, []);

  const filteredBookings = useMemo(() => {
    const term = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const matchesSearch = !term || [booking.booking_reference, booking.customer_name, booking.customer_phone, booking.customer_email]
        .some((value) => value.toLowerCase().includes(term));
      const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
      const matchesService = serviceFilter === "all" || booking.service_name === serviceFilter;
      const matchesFrom = !fromDate || booking.preferred_date >= fromDate;
      const matchesTo = !toDate || booking.preferred_date <= toDate;
      return matchesSearch && matchesStatus && matchesService && matchesFrom && matchesTo;
    }).sort((a, b) => sortOrder === "oldest"
      ? a.created_at.localeCompare(b.created_at)
      : b.created_at.localeCompare(a.created_at));
  }, [bookings, fromDate, search, serviceFilter, sortOrder, statusFilter, toDate]);

  const counts = useMemo(() => ({
    total: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    whatsapp: bookings.filter((booking) => booking.whatsapp_status === "sent" || booking.whatsapp_status === "delivered" || booking.whatsapp_status === "read").length,
  }), [bookings]);

  async function handleStatusChange(booking: Booking, status: Status) {
    setActionError("");
    try {
      await changeStatus({ data: { id: booking.id, status } });
      await refreshBookings();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The status could not be saved.");
    }
  }

  function startEditing(booking: Booking) {
    setEditValues({
      name: booking.customer_name,
      phone: booking.customer_phone,
      email: booking.customer_email,
      service: booking.service_name,
      date: booking.preferred_date,
      time: booking.preferred_time.slice(0, 5),
      message: booking.customer_message,
    });
    setEditingBooking(booking);
    setActionError("");
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingBooking) return;
    setSaving(true);
    setActionError("");
    try {
      await saveBooking({ data: { id: editingBooking.id, ...editValues } });
      setEditingBooking(null);
      await refreshBookings();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The booking details could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deletingBooking) return;
    setActionError("");
    try {
      await removeBooking({ data: { id: deletingBooking.id } });
      setDeletingBooking(null);
      await refreshBookings();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "The booking could not be deleted.");
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    void navigate({ to: "/admin/login", replace: true });
  }

  function exportCsv() {
    const columns: (keyof Booking)[] = ["booking_reference", "customer_name", "customer_phone", "customer_email", "service_name", "preferred_date", "preferred_time", "customer_message", "status", "created_at", "whatsapp_status"];
    const escape = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const csv = [columns.join(","), ...filteredBookings.map((booking) => columns.map((key) => escape(booking[key])).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "touch-my-heart-bookings.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <Link to="/" className="admin-brand">Touch My Heart <span>/</span> Bookings</Link>
        <div className="admin-header-actions">
          <Button type="button" variant="outline" onClick={() => void refreshBookings()} disabled={refreshing} aria-label="Refresh bookings">
            <RefreshCw aria-hidden="true" className={refreshing ? "admin-spin" : ""} /> <span>Refresh</span>
          </Button>
          <Button type="button" variant="ghost" onClick={handleSignOut}><LogOut aria-hidden="true" /><span>Sign out</span></Button>
        </div>
      </header>
      <div className="admin-content">
        <div className="admin-title-row">
          <div><p className="admin-eyebrow">Private administration</p><h1>Booking requests</h1></div>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!filteredBookings.length}><Download aria-hidden="true" /> Export CSV</Button>
        </div>

        <section className="admin-summary" aria-label="Booking summary">
          <Summary label="All requests" value={counts.total} />
          <Summary label="Awaiting confirmation" value={counts.pending} />
          <Summary label="Confirmed" value={counts.confirmed} />
          <Summary label="WhatsApp sent" value={counts.whatsapp} />
        </section>

        <section className="admin-filterbar" aria-label="Filter bookings">
          <div className="admin-search"><Search aria-hidden="true" /><Input aria-label="Search bookings" placeholder="Search name, phone or reference" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger aria-label="Filter by status"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{titleCase(status)}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger aria-label="Filter by service"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="all">All services</SelectItem>{bookingServices.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent>
          </Select>
          <Input aria-label="Preferred date from" type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
          <Input aria-label="Preferred date to" type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger aria-label="Sort bookings"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="newest">Newest first</SelectItem><SelectItem value="oldest">Oldest first</SelectItem></SelectContent>
          </Select>
        </section>

        {actionError && <p className="admin-alert" role="alert">{actionError}</p>}
        {errorMessage && <div className="admin-empty" role="alert"><h2>Bookings are unavailable</h2><p>{errorMessage}</p><Button type="button" onClick={() => void refreshBookings(true)}>Try again</Button></div>}
        {!errorMessage && loading && <div className="admin-empty" role="status">Loading booking requests…</div>}
        {!errorMessage && !loading && filteredBookings.length === 0 && <div className="admin-empty"><h2>{bookings.length ? "No matching requests" : "No booking requests yet"}</h2><p>{bookings.length ? "Change a filter or search term." : "New requests will appear here when submitted."}</p></div>}

        {!errorMessage && !loading && filteredBookings.length > 0 && (
          <>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Reference</TableHead><TableHead>Customer</TableHead><TableHead>Service</TableHead><TableHead>Preferred</TableHead><TableHead>Status</TableHead><TableHead>WhatsApp</TableHead><TableHead>Submitted</TableHead><TableHead>Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>{filteredBookings.map((booking) => <BookingRow key={booking.id} booking={booking} onView={() => setSelectedBooking(booking)} onEdit={() => startEditing(booking)} onDelete={() => setDeletingBooking(booking)} onStatusChange={(status) => void handleStatusChange(booking, status)} />)}</TableBody>
              </Table>
            </div>
            <div className="admin-mobile-list">{filteredBookings.map((booking) => <BookingCard key={booking.id} booking={booking} onView={() => setSelectedBooking(booking)} onEdit={() => startEditing(booking)} onDelete={() => setDeletingBooking(booking)} onStatusChange={(status) => void handleStatusChange(booking, status)} />)}</div>
            <p className="admin-result-count">Showing {filteredBookings.length} of {bookings.length} requests · refreshes every 30 seconds</p>
          </>
        )}
      </div>

      <Dialog open={!!selectedBooking} onOpenChange={(open) => !open && setSelectedBooking(null)}>
        <DialogContent className="admin-dialog">
          {selectedBooking && <>
            <DialogHeader><DialogTitle>{selectedBooking.booking_reference}</DialogTitle><DialogDescription>Booking request details</DialogDescription></DialogHeader>
            <dl className="admin-detail-list">
              <Detail label="Customer" value={selectedBooking.customer_name} /><Detail label="Phone" value={selectedBooking.customer_phone} /><Detail label="Email" value={selectedBooking.customer_email} /><Detail label="Service" value={selectedBooking.service_name} /><Detail label="Preferred date" value={selectedBooking.preferred_date} /><Detail label="Preferred time" value={selectedBooking.preferred_time.slice(0, 5)} /><Detail label="Additional requirements" value={selectedBooking.customer_message || "None"} /><Detail label="Submitted" value={formatDateTime(selectedBooking.created_at)} /><Detail label="WhatsApp" value={whatsappLabel(selectedBooking.whatsapp_status)} />
            </dl>
            <div className="admin-dialog-actions">
              <Button asChild variant="outline"><a href={`https://wa.me/${selectedBooking.customer_phone.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /> Open WhatsApp</a></Button>
              <Button type="button" onClick={() => { setSelectedBooking(null); startEditing(selectedBooking); }}>Edit details</Button>
            </div>
          </>}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingBooking} onOpenChange={(open) => !open && setEditingBooking(null)}>
        <DialogContent className="admin-dialog admin-edit-dialog">
          <DialogHeader><DialogTitle>Edit booking details</DialogTitle><DialogDescription>Update the customer’s request details.</DialogDescription></DialogHeader>
          <form className="admin-edit-form" onSubmit={handleEditSubmit}>
            <EditField label="Full name" value={editValues.name} onChange={(value) => setEditValues({ ...editValues, name: value })} required />
            <EditField label="Phone" type="tel" value={editValues.phone} onChange={(value) => setEditValues({ ...editValues, phone: value })} required />
            <EditField label="Email" type="email" value={editValues.email} onChange={(value) => setEditValues({ ...editValues, email: value })} required />
            <div className="admin-edit-field"><Label htmlFor="edit-booking-service">Service</Label><Select value={editValues.service} onValueChange={(service) => setEditValues({ ...editValues, service })}><SelectTrigger id="edit-booking-service"><SelectValue /></SelectTrigger><SelectContent>{bookingServices.map((service) => <SelectItem key={service} value={service}>{service}</SelectItem>)}</SelectContent></Select></div>
            <EditField label="Preferred date" type="date" value={editValues.date} onChange={(value) => setEditValues({ ...editValues, date: value })} required />
            <EditField label="Preferred time" type="time" value={editValues.time} onChange={(value) => setEditValues({ ...editValues, time: value })} required />
            <div className="admin-edit-field admin-edit-wide"><Label htmlFor="edit-booking-message">Additional requirements</Label><Textarea id="edit-booking-message" maxLength={1000} rows={3} value={editValues.message} onChange={(event) => setEditValues({ ...editValues, message: event.target.value })} /></div>
            {actionError && <p className="admin-alert admin-edit-wide" role="alert">{actionError}</p>}
            <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save details"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingBooking} onOpenChange={(open) => !open && setDeletingBooking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete this booking?</AlertDialogTitle><AlertDialogDescription>This permanently deletes {deletingBooking?.booking_reference} and cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Keep booking</AlertDialogCancel><AlertDialogAction onClick={(event) => { event.preventDefault(); void confirmDelete(); }}>Delete booking</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return <div className="admin-summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function BookingRow({ booking, onView, onEdit, onDelete, onStatusChange }: { booking: Booking; onView: () => void; onEdit: () => void; onDelete: () => void; onStatusChange: (status: Status) => void }) {
  return <TableRow>
    <TableCell className="admin-reference">{booking.booking_reference}</TableCell>
    <TableCell><strong>{booking.customer_name}</strong><span className="admin-subline">{booking.customer_phone}</span></TableCell>
    <TableCell>{booking.service_name}</TableCell>
    <TableCell>{booking.preferred_date}<span className="admin-subline">{booking.preferred_time.slice(0, 5)}</span></TableCell>
    <TableCell><StatusSelect status={booking.status} onChange={onStatusChange} /></TableCell>
    <TableCell><Badge variant="outline" className={`admin-whatsapp-status is-${booking.whatsapp_status}`}>{whatsappLabel(booking.whatsapp_status)}</Badge></TableCell>
    <TableCell>{formatDateTime(booking.created_at)}</TableCell>
    <TableCell><div className="admin-row-actions"><Button variant="ghost" size="sm" onClick={onView}>View</Button><Button variant="ghost" size="sm" onClick={onEdit}>Edit</Button><Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button></div></TableCell>
  </TableRow>;
}

function BookingCard({ booking, onView, onEdit, onDelete, onStatusChange }: { booking: Booking; onView: () => void; onEdit: () => void; onDelete: () => void; onStatusChange: (status: Status) => void }) {
  return <article className="admin-booking-card">
    <header><strong>{booking.booking_reference}</strong><Badge variant="outline" className={`admin-whatsapp-status is-${booking.whatsapp_status}`}>{whatsappLabel(booking.whatsapp_status)}</Badge></header>
    <h2>{booking.customer_name}</h2><p>{booking.customer_phone} · {booking.customer_email}</p>
    <dl><Detail label="Service" value={booking.service_name} /><Detail label="Preferred" value={`${booking.preferred_date} · ${booking.preferred_time.slice(0, 5)}`} /><Detail label="Status" value={titleCase(booking.status)} /></dl>
    <StatusSelect status={booking.status} onChange={onStatusChange} />
    <div className="admin-row-actions"><Button variant="outline" size="sm" onClick={onView}>View</Button><Button variant="outline" size="sm" onClick={onEdit}>Edit</Button><Button variant="ghost" size="sm" onClick={onDelete}>Delete</Button></div>
  </article>;
}

function StatusSelect({ status, onChange }: { status: string; onChange: (status: Status) => void }) {
  return <Select value={statuses.includes(status as Status) ? status : "pending"} onValueChange={(value) => onChange(value as Status)}><SelectTrigger className="admin-status-select" aria-label="Change booking status"><SelectValue /></SelectTrigger><SelectContent>{statuses.map((item) => <SelectItem key={item} value={item}>{titleCase(item)}</SelectItem>)}</SelectContent></Select>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function EditField({ label, value, onChange, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; type?: string; required?: boolean }) {
  const id = `edit-${label.toLowerCase().replaceAll(" ", "-")}`;
  return <div className="admin-edit-field"><Label htmlFor={id}>{label}</Label><Input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} /></div>;
}

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(new Date(value));
}

function whatsappLabel(value: string) {
  return value === "not_configured" ? "Not connected" : titleCase(value);
}