// Temporary dev database. Persisted in localStorage so data survives refresh.
const DB_KEY = 'quickcart.mockdb';

// [id, name, description, active]
const CATEGORY_ROWS = [
  [1, 'Fruits & Vegetables', 'Fresh fruits and vegetables', true],
  [2, 'Dairy & Eggs', 'Milk, curd, eggs', true],
  [3, 'Bakery', 'Bread and buns', true],
  [4, 'Snacks', 'Chips and munchies', true],
  [5, 'Beverages', 'Juices and soft drinks', true],
  [6, 'Frozen Foods', 'Inactive on purpose: must never show to customers', false],
];

// [categoryId, name, description|null, unit, price]  (id = row position, starting at 1)
// Some descriptions are null on purpose (Mandate 11: null safety).
const PRODUCT_ROWS = [
  [1, 'Banana', 'Ripe yellow bananas', '1 dozen', 49],
  [1, 'Tomato', null, '500 g', 30],
  [1, 'Onion', 'Fresh red onions', '1 kg', 40],
  [1, 'Potato', null, '1 kg', 35],
  [2, 'Toned Milk', 'Fresh toned milk', '500 ml', 28],
  [2, 'Curd', 'Thick set curd', '400 g', 35],
  [2, 'Eggs', null, '6 pcs', 54],
  [2, 'Paneer', 'Soft fresh paneer', '200 g', 90],
  [3, 'Brown Bread', 'Whole wheat sandwich bread', '400 g', 45],
  [3, 'Milk Bread', null, '400 g', 40],
  [3, 'Butter Croissant', 'Flaky and buttery', '2 pcs', 60],
  [3, 'Pav', 'Soft dinner buns', '6 pcs', 30],
  [4, 'Potato Chips', 'Classic salted', '52 g', 20],
  [4, 'Salted Peanuts', null, '200 g', 50],
  [4, 'Marie Biscuits', 'Light tea-time biscuits', '250 g', 30],
  [4, 'Namkeen Mix', null, '200 g', 55],
  [5, 'Orange Juice', 'No added sugar', '1 l', 110],
  [5, 'Cola', 'Chilled soft drink', '750 ml', 40],
  [5, 'Green Tea', 'Pack of 25 tea bags', '25 bags', 140],
  [5, 'Mineral Water', null, '1 l', 20],
];

// Dev-only variations so every UI state can be exercised (contract seed is 50 each).
const STOCK_OVERRIDES = { 8: 0, 12: 3 }; // Paneer out of stock, Pav low
const INACTIVE_PRODUCT_IDS = [20]; // Mineral Water hidden from customers

function seed() {
  const now = new Date().toISOString();
  
  const products = PRODUCT_ROWS.map(([categoryId, name, description, unit, price], i) => ({
    id: i + 1, categoryId, name, description, price, unit,
    imageUrl: null, active: !INACTIVE_PRODUCT_IDS.includes(i + 1),
  }));
  return {
    nextUserId: 3,
    carts: {}, // userId -> [{ productId, quantity }]  (note: prices are never stored, per contract)
    nextAddressId: 3,
    addresses: [
      { id: 1, userId: 2, label: 'Home', recipientName: 'Asha Rao', phone: '9876543210',
        line1: '12 MG Road', line2: 'Near Park', city: 'Hyderabad', state: 'Telangana',
        pincode: '500001', isDefault: true },
      { id: 2, userId: 2, label: 'Work', recipientName: 'Asha Rao', phone: '9876543210',
        line1: '4 Cyber Towers', line2: null, city: 'Hyderabad', state: 'Telangana',
        pincode: '500081', isDefault: false },
    ],
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
    categories: CATEGORY_ROWS.map(([id, name, description, active]) => ({
      id, name, description, imageUrl: null, active,
    })),
    products,
    inventory: Object.fromEntries(products.map((p) => [p.id, STOCK_OVERRIDES[p.id] ?? 50])),
  };
}

// Like a Flyway migration: data saved by an older version of the mock keeps what it has
// (users) and gains whatever is new (catalog).
function load() {
  const base = seed();
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return { ...base, ...JSON.parse(raw) };
  } catch {
    /* corrupt data: fall through to a fresh seed */
  }
  return base;
}

let state = load();

function save() {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
}

export const db = {
  // users
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

  // catalog (read-only for now; admin handlers will write in Step 8)
  categories() {
    return state.categories;
  },
  products() {
    return state.products;
  },
  stock(productId) {
    return state.inventory[productId] ?? 0;
  },
    // cart (stores only productId + quantity, like cart_items in the contract)
  cartItems(userId) {
    return state.carts[userId] ?? [];
  },
  saveCartItems(userId, items) {
    state.carts[userId] = items;
    save();
  },

  // dev helpers for testing unavailable lines (see browser.js); Step 8 admin handlers will reuse them
  setStock(productId, quantity) {
    state.inventory[productId] = quantity;
    save();
  },
  setProductActive(productId, active) {
    const product = state.products.find((p) => p.id === productId);
    if (product) product.active = active;
    save();
  },
    findUserById(id) {
    return state.users.find((u) => u.id === id) || null;
  },
  updateUser(id, changes) {
    const user = state.users.find((u) => u.id === id);
    if (!user) return null;
    Object.assign(user, changes);
    save();
    return user;
  },

  // addresses
  addressesOf(userId) {
    return state.addresses.filter((a) => a.userId === userId);
  },
  saveAddresses(userId, list) {
    state.addresses = [...state.addresses.filter((a) => a.userId !== userId), ...list];
    save();
  },
  nextAddressId() {
    const id = state.nextAddressId;
    state.nextAddressId += 1;
    return id;
  },
};

export function resetMockDb() {
  state = seed();
  save();
}