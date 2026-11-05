// Temporary dev database. Persisted in localStorage so data survives refresh.
const DB_KEY = 'quickcart.mockdb';

function seed() {
  const now = new Date().toISOString();
  return {
    nextUserId: 3,
    users: [
      {
        id: 1, fullName: 'Store Admin', email: 'admin@quickcart.local',
        password: 'Admin12345', phone: '9000000000', role: 'ADMIN',
        active: true, createdAt: now,
      },
      {
        id: 2, fullName: 'Asha Rao', email: 'asha@example.com',
        password: 'Passw0rd123', phone: '9876543210', role: 'CUSTOMER',
        active: true, createdAt: now,
      },
    ],
  };
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* corrupt data: fall through to a fresh seed */
  }
  return seed();
}

let state = load();

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

export const db = {
  findUserByEmail(email) {
    return state.users.find((u) => u.email === email) || null;
  },
  addUser({ fullName, email, password, phone }) {
    const user = {
      id: state.nextUserId++, fullName, email, password, phone,
      role: 'CUSTOMER', // contract: role is always CUSTOMER on register
      active: true, createdAt: new Date().toISOString(),
    };
    state.users.push(user);
    save();
    return user;
  },
};

export function resetMockDb() {
  state = seed();
  save();
}