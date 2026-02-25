# 🐛 Bug Report & Missing Features Audit

**Date:** January 27, 2026  
**Project:** College Event Booking System

---

## 🔴 **CRITICAL BUGS**

### 1. **Race Condition in Booking System** ⚠️
**Location:** `src/pages/EventDetails.tsx` (Lines 199-246)  
**Issue:** The booking flow has a race condition that can lead to overbooking.

**Problem Flow:**
```typescript
// Step 1: Check availability
if (event && event.booked_seats + seatsToBook > event.total_seats) {
    throw new Error('Not enough seats available.');
}

// Step 2: Create booking (NO TRANSACTION!)
await supabase.from('bookings').insert([...]);

// Step 3: Update seats (SEPARATE QUERY!)
await supabase.from('events').update({ booked_seats: ... });
```

**Scenario:**
- User A and User B both try to book the last 2 seats simultaneously
- Both pass the availability check (Step 1)
- Both create bookings (Step 2)
- Result: 4 seats booked for 2 available seats ❌

**Fix Required:** Use database transactions or atomic operations with RLS policies.

---

### 2. **Missing Error Handling for External Registration**
**Location:** `src/pages/EventDetails.tsx` (Line 600+)  
**Issue:** If `external_registration_url` is invalid or malformed, there's no validation.

**Risk:** Users could be redirected to broken/malicious URLs.

**Fix:** Validate URL format before rendering the link.

---

### 3. **QR Code Data Not Unique Enough**
**Location:** `src/pages/EventDetails.tsx` (Line 226)  
```typescript
qr_code_data: `TICKET-${id}-${user.id}-${Date.now()}`
```

**Issue:** If a user books multiple seats, all tickets have the same QR code. This makes individual ticket validation impossible.

**Fix:** Generate unique QR codes per seat or include seat number in the data.

---

## 🟠 **LOGICAL ISSUES**

### 4. **No Cancellation Deadline Logic**
**Issue:** Users can cancel bookings at any time, even 5 minutes before the event.

**Missing:**
- Cancellation deadline (e.g., 24 hours before event)
- Refund policy enforcement
- Seat release timing

**Impact:** Organizers can't plan properly; last-minute cancellations waste seats.

---

### 5. **Seats Booked Counter Can Go Negative**
**Location:** Booking cancellation logic (if implemented)  
**Issue:** If cancellation decrements `booked_seats` without validation, it could go below 0.

**Fix:** Add constraint: `CHECK (booked_seats >= 0)` in database schema.

---

### 6. **No Duplicate Booking Prevention for Sub-Events**
**Issue:** If an event has sub-events, a user could book the main event AND all sub-events separately.

**Missing:** Logic to prevent booking both parent and child events.

---

### 7. **Past Events Still Bookable**
**Location:** `src/pages/EventDetails.tsx`  
**Issue:** There's no check to prevent booking events that have already occurred.

**Fix:** Add date validation:
```typescript
const isPastEvent = new Date(event.date) < new Date();
if (isPastEvent) {
    // Disable booking button
}
```

---

## 🟡 **MISSING FEATURES (Critical for Production)**

### 8. **No Email Confirmation**
**Status:** ❌ Not Implemented  
**Impact:** Users have no proof of booking outside the app.

**Required:**
- Booking confirmation email
- QR code attachment
- Event reminder emails (24h before)

---

### 9. **No Admin Event Approval System**
**Issue:** Colleges can create events that go live immediately without admin review.

**Risk:** Spam events, inappropriate content, or fake events.

**Fix:** Add `status` field to events table: `pending`, `approved`, `rejected`.

---

### 10. **No Capacity Overflow Protection**
**Issue:** If `total_seats` is updated to be less than `booked_seats`, the system breaks.

**Example:**
- Event has 100 seats, 80 booked
- Organizer changes capacity to 50
- System shows "-30 seats available" ❌

**Fix:** Add validation when updating `total_seats`.

---

### 11. **No Ticket Verification System**
**Issue:** QR codes are generated but there's no scanner/verification interface for organizers.

**Missing:**
- QR code scanner page for organizers
- Check-in tracking
- Attendance reports

---

### 12. **No Payment Integration**
**Status:** ❌ Not Implemented  
**Impact:** All events are effectively free; `price` field is cosmetic.

**Required:** Razorpay/Stripe integration for paid events.

---

### 13. **No Refund System**
**Issue:** If a user cancels a paid booking, there's no refund flow.

**Missing:**
- Refund policy configuration
- Automated refund processing
- Partial refund support

---

## 🟢 **UI/UX ISSUES**

### 14. **No Loading States for Images**
**Issue:** Event images load without placeholders, causing layout shift.

**Fix:** Add skeleton loaders or blur-up placeholders.

---

### 15. **No Empty State for "My Bookings"**
**Issue:** If a student has no bookings, they see a blank page.

**Fix:** Add illustration + CTA to browse events.

---

### 16. **Mobile: Sidebar Doesn't Close After Navigation**
**Issue:** On mobile, clicking a sidebar link doesn't auto-close the sidebar.

**Fix:** Add `onClick={() => setIsSidebarOpen(false)}` to sidebar links.

---

### 17. **No Confirmation Dialog for Cancellation**
**Issue:** Users can accidentally cancel bookings with one click.

**Fix:** Add confirmation modal: "Are you sure you want to cancel?"

---

## 🔵 **SECURITY ISSUES**

### 18. **Missing RLS Policies**
**Risk:** Users could potentially modify other users' bookings via direct API calls.

**Required RLS Policies:**
```sql
-- Users can only read their own bookings
CREATE POLICY "Users can view own bookings"
ON bookings FOR SELECT
USING (auth.uid() = user_id);

-- Users can only create bookings for themselves
CREATE POLICY "Users can create own bookings"
ON bookings FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

---

### 19. **No Rate Limiting**
**Issue:** A malicious user could spam the booking endpoint and reserve all seats.

**Fix:** Implement rate limiting (e.g., max 5 bookings per minute per user).

---

### 20. **External URLs Not Sanitized**
**Issue:** `external_registration_url` could contain XSS payloads.

**Fix:** Validate and sanitize URLs before rendering.

---

## 📊 **DATABASE ISSUES**

### 21. **Missing Indexes**
**Impact:** Slow queries as data grows.

**Required Indexes:**
```sql
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_college_id ON events(college_id);
```

---

### 22. **No Soft Delete**
**Issue:** Deleting events/bookings permanently removes data.

**Better Approach:** Add `deleted_at` timestamp for soft deletes.

---

### 23. **No Audit Trail**
**Issue:** No record of who modified what and when.

**Missing:** `updated_by`, `updated_at` fields on critical tables.

---

## 🎯 **RECOMMENDATIONS (Priority Order)**

### **Immediate (This Week):**
1. ✅ Fix race condition in booking (use database functions)
2. ✅ Add past event validation
3. ✅ Implement RLS policies
4. ✅ Add confirmation dialogs

### **Short Term (Next 2 Weeks):**
5. ✅ Email notifications
6. ✅ QR code verification system
7. ✅ Admin approval workflow
8. ✅ Payment integration

### **Medium Term (Month 2):**
9. ✅ Refund system
10. ✅ Analytics dashboard
11. ✅ Mobile app optimization
12. ✅ Performance optimization (indexes, caching)

---

## 📝 **TESTING CHECKLIST**

### **Scenarios to Test:**
- [ ] Book last available seat (2 users simultaneously)
- [ ] Cancel booking and verify seat is released
- [ ] Try to book past event
- [ ] Try to book with 0 seats available
- [ ] Book event, then organizer reduces capacity
- [ ] Upload invalid image format
- [ ] Submit extremely long event description
- [ ] Access another user's booking via direct URL
- [ ] Book event while logged out
- [ ] Book same event twice

---

## 🎨 **POLISH NEEDED**

1. **Consistent Error Messages:** Some use `alert()`, some use toast, some inline.
2. **Loading States:** Not all async operations show loading indicators.
3. **Accessibility:** Missing ARIA labels on some interactive elements.
4. **Mobile Optimization:** Some modals don't work well on small screens.
5. **Dark Mode:** Some components don't respect dark mode properly.

---

**Overall Assessment:** The app is **70% production-ready**. The core functionality works, but critical security and data integrity issues need to be addressed before launch.
