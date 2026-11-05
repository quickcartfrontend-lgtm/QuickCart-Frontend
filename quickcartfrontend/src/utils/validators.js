// Mirrors the Handoff section 4. The server is still authoritative.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9][0-9]{9}$/;

export function validateEmail(value) {
  const v = value.trim();
  if (!v) return 'Email is required.';
  if (v.length > 150 || !EMAIL_RE.test(v)) return 'Enter a valid email address.';
  return '';
}

export function validatePassword(value) {
  if (value.length < 8 || value.length > 72) return 'Password must be 8-72 characters.';
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must contain at least one letter and one digit.';
  }
  return '';
}

export function validateFullName(value) {
  const v = value.trim();
  if (v.length < 2 || v.length > 100) return 'Name must be 2-100 characters.';
  return '';
}

export function validatePhone(value) {
  if (!PHONE_RE.test(value.trim())) return 'Enter a valid 10-digit mobile number.';
  return '';
}