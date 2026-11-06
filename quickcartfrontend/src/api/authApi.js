import httpClient from './httpClient';
// U1
export async function registerUser({ fullName, email, password, phone }) {
  const { data } = await httpClient.post('/api/v1/auth/register', {
    fullName,
    email,
    password,
    phone,
  });
  return data; // AuthResponse
}

// U2
export async function loginUser({ email, password }) {
  const { data } = await httpClient.post('/api/v1/auth/login', { email, password });
  return data; // AuthResponse
}