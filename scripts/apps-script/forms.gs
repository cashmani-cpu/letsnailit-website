// Let's Nail It — website form endpoint (Google Apps Script web app).
// Source of truth lives in the Apps Script project; this copy is kept in the repo
// for reference. Paste changes into the project, then Deploy → Manage deployments →
// edit the existing deployment → New version, so the /exec URL stays the same.

// The real Sheet ID is only in the Apps Script project (this repo is public).
const SHEET_ID = 'PASTE_SHEET_ID_HERE';
const PRICE_PER_PERSON = 1500;

function doGet(e) {
  if (e.parameter && e.parameter.form_type) {
    return save(e.parameter);
  }
  return ContentService.createTextOutput('LNI Forms endpoint active');
}

function doPost(e) {
  try {
    return save(JSON.parse(e.postData.contents));
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function save(data) {
  try {
    const ss = SpreadsheetApp.openById(SHEET_ID);
    const tabName = getTabName(data.form_type);
    let sheet = ss.getSheetByName(tabName);
    if (!sheet) {
      sheet = ss.insertSheet(tabName);
      sheet.appendRow(getHeaders(data.form_type));
      sheet.setFrozenRows(1);
      sheet.getRange(1, 1, 1, sheet.getLastColumn()).setFontWeight('bold');
    }
    sheet.appendRow(getRow(data));
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: err.message });
  }
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Store user input as plain text: Sheets treats values starting with = + - @
// as formulas ("+91 98…" shows as #ERROR!, and it blocks formula injection).
function text(v) {
  const s = v == null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function isGroupBooking(formType) {
  return formType === 'group_booking' || formType === 'corporate_event';
}

function getTabName(formType) {
  if (isGroupBooking(formType)) return 'Group Bookings';
  const map = {
    public_reservation: 'Reservations',
    private_event: 'Private Events',
    waitlist: 'Waitlist',
    reservation_interest: 'All Enquiries'
  };
  return map[formType] || 'Other';
}

function getHeaders(formType) {
  const base = ['Timestamp', 'Name', 'Email', 'Phone'];
  if (isGroupBooking(formType)) {
    return [...base, 'Source', 'Venue', 'Area', 'Guests', 'Estimate (₹)', 'Preferred Date', 'Occasion'];
  }
  if (formType === 'private_event') return [...base, 'Preferred Date', 'Guest Count'];
  if (formType === 'reservation_interest') return [...base, 'Event Date'];
  if (formType === 'public_reservation' || formType === 'waitlist') return [...base, 'Event Date'];
  return [...base, 'Extra Data'];
}

function getRow(data) {
  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const base = [ts, text(data.name), text(data.email), text(data.phone)];
  if (isGroupBooking(data.form_type)) {
    const guests = parseInt(data.guests, 10);
    return [
      ...base,
      data.form_type === 'corporate_event' ? 'Corporate page' : 'Homepage',
      text(data.venue),
      text(data.area),
      isNaN(guests) ? text(data.guests) : guests,
      isNaN(guests) ? '' : guests * PRICE_PER_PERSON,
      text(data.date),
      text(data.occasion) || (data.form_type === 'corporate_event' ? 'Corporate team event' : '')
    ];
  }
  if (data.form_type === 'private_event') return [...base, text(data.date), text(data.guests)];
  if (data.form_type === 'public_reservation' || data.form_type === 'waitlist' || data.form_type === 'reservation_interest') return [...base, text(data.date)];
  return [...base, text(JSON.stringify(data))];
}
