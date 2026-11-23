/**
 * One-off deterministic seed generator for the AutoSutraa CRM prototype.
 * Run: node scripts/generate-data.mjs
 *
 * Produces mutually consistent records (customers → vehicles → bookings → payments →
 * invoices → analytics) so every page and every KPI reconciles with every other page.
 * Output is committed as static TypeScript; nothing here runs in the browser.
 */
import { writeFileSync, mkdirSync } from 'node:fs';

const OUT = 'src/data';
mkdirSync(OUT, { recursive: true });

/* ------------------------------ seeded RNG ------------------------------ */
let seed = 20261118;
const rnd = () => {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
};
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const int = (min, max) => min + Math.floor(rnd() * (max - min + 1));
const weighted = (pairs) => {
  const total = pairs.reduce((a, [, w]) => a + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) {
    r -= w;
    if (r <= 0) return v;
  }
  return pairs[0][0];
};

/* ---------------------------- date helpers ---------------------------- */
const TODAY = new Date();
TODAY.setHours(0, 0, 0, 0);
const iso = (d) => {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const offset = (days) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return iso(d);
};
const stamp = (dayIso, minutes) => {
  const d = new Date(`${dayIso}T00:00:00`);
  d.setMinutes(d.getMinutes() + minutes);
  const p = (n) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:00`;
};
const SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
];
const minsOf = (slot) => {
  const [time, mer] = slot.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  return h * 60 + m;
};

/* ------------------------------ services ------------------------------ */
const serviceSeed = [
  { id: 'SRV-01', name: 'Basic Car Wash', price: 399, duration: 30, category: 'Wash', tone: 'sky' },
  { id: 'SRV-02', name: 'Premium Wash', price: 899, duration: 55, category: 'Wash', tone: 'blue' },
  { id: 'SRV-03', name: 'Interior Cleaning', price: 1299, duration: 70, category: 'Interior', tone: 'teal' },
  { id: 'SRV-04', name: 'Exterior Detailing', price: 2499, duration: 120, category: 'Detailing', tone: 'indigo' },
  { id: 'SRV-05', name: 'Full Detailing', price: 4999, duration: 180, category: 'Detailing', tone: 'violet' },
  { id: 'SRV-06', name: 'Ceramic Coating', price: 12999, duration: 300, category: 'Protection', tone: 'navy' },
  { id: 'SRV-07', name: 'Vacuum Cleaning', price: 499, duration: 25, category: 'Interior', tone: 'emerald' },
  { id: 'SRV-08', name: 'Underbody & Engine Bay', price: 1499, duration: 60, category: 'Protection', tone: 'slate' },
  { id: 'SRV-09', name: 'Headlight Restoration', price: 1099, duration: 45, category: 'Add-on', tone: 'amber' },
  { id: 'SRV-10', name: 'Paint Correction & Polish', price: 3499, duration: 150, category: 'Detailing', tone: 'rose' },
];
const serviceById = Object.fromEntries(serviceSeed.map((s) => [s.id, s]));
const serviceDescriptions = {
  'SRV-01': 'Exterior foam wash, rinse and hand dry with tyre dressing. Ideal weekly maintenance for daily-driven cars.',
  'SRV-02': 'Foam wash with clay-bar decontamination, wax coat, alloy cleaning and dashboard wipe-down.',
  'SRV-03': 'Deep interior vacuum, seat and carpet shampoo, roof lining and AC vent cleaning with anti-bacterial treatment.',
  'SRV-04': 'Two-stage paint decontamination with machine polish, gloss enhancement and trim restoration.',
  'SRV-05': 'Complete inside-out detailing: paint correction, interior deep clean, engine bay dressing and sealant.',
  'SRV-06': '9H ceramic coating with paint preparation, 3-year protection warranty and annual maintenance check.',
  'SRV-07': 'High-power vacuum for seats, footwells, boot and mats including pet-hair removal.',
  'SRV-08': 'Underbody pressure cleaning with anti-rust coating plus engine bay degreasing and dressing.',
  'SRV-09': 'Headlight polishing to remove yellowing and oxidation, restoring clarity and beam output.',
  'SRV-10': 'Machine compounding and polishing to remove swirl marks, light scratches and oxidation.',
};

/* -------------------------------- staff -------------------------------- */
const staffSeed = [
  ['Rajesh Sharma', 'Super Admin', 'Business Owner', '07:30 AM – 04:30 PM', 4.9, ['Ceramic Coating', 'Paint Correction']],
  ['Ankit Verma', 'Admin', 'Detailing Lead', '08:00 AM – 05:00 PM', 4.8, ['Full Detailing', 'Exterior Detailing']],
  ['Suresh Yadav', 'Manager', 'Floor Manager', '09:00 AM – 06:00 PM', 4.7, ['Quality Check', 'Scheduling']],
  ['Imran Qureshi', 'Staff', 'Senior Washer', '08:00 AM – 05:00 PM', 4.6, ['Premium Wash', 'Basic Car Wash']],
  ['Deepak Meena', 'Staff', 'Detailing Specialist', '10:00 AM – 07:00 PM', 4.5, ['Interior Cleaning', 'Vacuum Cleaning']],
  ['Sunita Devi', 'Staff', 'Interior Specialist', '09:30 AM – 06:30 PM', 4.8, ['Interior Cleaning', 'Vacuum Cleaning']],
  ['Vikram Rathore', 'Staff', 'Washer', '07:30 AM – 04:30 PM', 4.4, ['Basic Car Wash', 'Underbody & Engine Bay']],
  ['Pooja Agarwal', 'Accountant', 'Billing', '10:00 AM – 07:00 PM', 4.7, ['Invoicing', 'Payments']],
  ['Mohit Saini', 'Staff', 'Washer', '12:00 PM – 09:00 PM', 4.3, ['Basic Car Wash', 'Premium Wash']],
  ['Kavita Nair', 'Manager', 'Customer Relations', '09:00 AM – 06:00 PM', 4.9, ['Retention', 'Support']],
];
const staff = staffSeed.map((s, i) => {
  const [name, role, designation, shift, rating, skills] = s;
  const first = name.split(' ')[0].toLowerCase();
  return {
    id: `STF-${`${i + 1}`.padStart(3, '0')}`,
    name,
    role,
    designation,
    email: `${first}@autosutraa.in`,
    phone: `+91 ${pick(['98', '99', '94', '90', '70'])}${int(10000000, 99999999)}`,
    shift,
    rating,
    skills,
    joinedAt: offset(-int(120, 1100)),
    status: i === 8 ? 'On Leave' : 'Active',
    avatarTone: ['blue', 'navy', 'teal', 'indigo', 'emerald', 'violet', 'amber', 'sky', 'rose', 'cyan'][i],
  };
});
const staffById = Object.fromEntries(staff.map((s) => [s.id, s]));

/* ------------------------------ customers ------------------------------ */
const customerSeed = [
  ['Aarav Mehta', 'Jaipur', 'VIP', 'VIP', 'B-402, Malviya Nagar, Jaipur', 'Prefers ceramic-safe wash. Owns two SUVs.'],
  ['Priya Sharma', 'Jaipur', 'Active', 'Regular', 'C-12, Vaishali Nagar, Jaipur', 'Always books Saturday morning slots.'],
  ['Rohan Gupta', 'Alwar', 'Active', 'Returning', '45, Scheme 2, Alwar', 'Workspace sedan — monthly interior clean.'],
  ['Neha Agarwal', 'Jaipur', 'VIP', 'VIP', 'A-7, C-Scheme, Jaipur', 'VIP member — priority slots, invoice by email.'],
  ['Vikram Singh Rathore', 'Alwar', 'Active', 'Regular', '22, Moti Dungri Road, Alwar', 'Fleet contact for 3 commercial vehicles.'],
  ['Ananya Iyer', 'Jaipur', 'Active', 'Returning', 'D-88, Jawahar Nagar, Jaipur', 'Sensitive to strong chemicals — mild shampoo only.'],
  ['Karan Malhotra', 'Gurugram', 'Active', 'Regular', 'Tower 4, Sector 45, Gurugram', 'Weekend drop-off, evening pickup.'],
  ['Sneha Kulkarni', 'Jaipur', 'Active', 'New', 'Flat 201, Tonk Road, Jaipur', 'First-time customer from website booking.'],
  ['Rahul Deshmukh', 'Alwar', 'Active', 'Returning', '9, Keshav Nagar, Alwar', 'Prefers UPI payments.'],
  ['Meera Nair', 'Jaipur', 'VIP', 'VIP', 'P-14, Bani Park, Jaipur', 'Detailing enthusiast, quarterly ceramic top-up.'],
  ['Aditya Joshi', 'Jaipur', 'Active', 'Regular', 'H-56, Shastri Nagar, Jaipur', 'Drop-off before 9 AM always.'],
  ['Ishita Bansal', 'Alwar', 'Inactive', 'Returning', '77, Arya Samaj Road, Alwar', 'Last service 4 months ago — win-back candidate.'],
  ['Siddharth Rao', 'Gurugram', 'Active', 'Regular', 'B-11, DLF Phase 2, Gurugram', 'Corporate account — monthly billing.'],
  ['Tanvi Kapoor', 'Jaipur', 'Active', 'Returning', '12, Rajapark, Jaipur', 'Loves the signature pine fragrance.'],
  ['Manish Choudhary', 'Alwar', 'Active', 'Regular', '34, Hope Circus, Alwar', 'Frequent small-ticket wash customer.'],
  ['Divya Reddy', 'Jaipur', 'Active', 'New', 'E-9, Vidhyadhar Nagar, Jaipur', 'Referred by Neha Agarwal.'],
  ['Harshit Jain', 'Jaipur', 'Blocked', 'Returning', 'S-3, Adarsh Nagar, Jaipur', 'Two no-shows — prepayment required.'],
  ['Pallavi Srivastava', 'Jaipur', 'Active', 'Regular', '18, JLN Marg, Jaipur', 'Office cab — daily exterior wipe-down.'],
  ['Nikhil Bhatt', 'Alwar', 'Active', 'Returning', '61, Company Bagh, Alwar', 'Weekend slots only.'],
  ['Ritika Sen', 'Gurugram', 'Active', 'New', 'C-704, Sushant Lok, Gurugram', 'Instagram lead — full detailing enquiry.'],
  ['Gaurav Chauhan', 'Jaipur', 'Active', 'Regular', 'B-23, Sodala, Jaipur', 'Monthly membership plan holder.'],
  ['Shreya Pillai', 'Jaipur', 'Inactive', 'Returning', '28, Gopalpura, Jaipur', 'Relocated temporarily — follow up in Dec.'],
  ['Arjun Sethi', 'Alwar', 'Active', 'New', '15, NEB Subhash Nagar, Alwar', 'New SUV — interested in PPF.'],
  ['Lakshmi Menon', 'Jaipur', 'VIP', 'VIP', 'A-102, Civil Lines, Jaipur', 'Luxury sedan — hand wash only.'],
  ['Sameer Qureshi', 'Alwar', 'Active', 'Returning', '26, Ram Nagar, Alwar', 'Monthly exterior detail subscriber.'],
  ['Anjali Mishra', 'Jaipur', 'Active', 'Regular', 'B-9, Mansarovar, Jaipur', 'Prefers SMS over calls.'],
  ['Devansh Saxena', 'Gurugram', 'Active', 'New', 'Flat 1102, Sector 54, Gurugram', 'First booking via WhatsApp campaign.'],
  ['Bhavna Trivedi', 'Jaipur', 'Active', 'Returning', '14, Hathroi Fort Road, Jaipur', 'Weekend SUV wash regular.'],
  ['Yashwant Patel', 'Alwar', 'Active', 'Regular', 'D-5, ITI Circle, Alwar', 'Cash payments only.'],
  ['Simran Kaur', 'Jaipur', 'VIP', 'VIP', 'Villa 3, Jagatpura, Jaipur', 'Two luxury cars — ceramic plan holder.'],
  ['Om Prakash Yadav', 'Alwar', 'Inactive', 'Returning', '58, Ganga Vihar, Alwar', 'Seasonal customer — returns in summer.'],
  ['Charu Bhatia', 'Jaipur', 'Active', 'New', '301, Landmark Tower, Jaipur', 'Interested in monthly membership.'],
  ['Sarthak Pandey', 'Gurugram', 'Active', 'Regular', 'C-88, Sector 40, Gurugram', 'Corporate fleet coordinator.'],
  ['Ayesha Khan', 'Jaipur', 'Active', 'Returning', 'F-21, Shyam Nagar, Jaipur', 'Prefers female staff for interior work.'],
];
const emailFor = (name) =>
  `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@${pick(['gmail.com', 'outlook.com', 'yahoo.in', 'hotmail.com'])}`;
const customers = customerSeed.map((c, i) => {
  const [name, city, status, tier, address, notes] = c;
  return {
    id: `CUS-${1001 + i}`,
    name,
    phone: `+91 ${pick(['98', '97', '91', '88', '70', '63'])}${int(10000000, 99999999)}`,
    email: emailFor(name),
    address,
    city,
    status,
    tier,
    notes,
    // a believable spread: a handful joined very recently
    joinedAt: i < 8 ? offset(-int(3, 34)) : offset(-int(45, 900)),
  };
});

// Widen the customer base so per-customer booking volume stays realistic.
const firstNames = ['Rohit', 'Pooja', 'Sandeep', 'Rekha', 'Amit', 'Kritika', 'Naveen', 'Shalini', 'Yogesh', 'Preeti', 'Tarun', 'Meenakshi', 'Rakesh', 'Swati', 'Anil', 'Rupali', 'Vivek', 'Jyoti', 'Sudhir', 'Aparna', 'Harish', 'Nidhi', 'Girish', 'Sonam', 'Prakash', 'Ruchi', 'Dinesh', 'Varsha', 'Kunal', 'Payal', 'Sanjay', 'Neelam', 'Ashok', 'Shweta', 'Bhavesh', 'Ira', 'Chirag', 'Mukta', 'Lalit', 'Ritu'];
const surnames = ['Sharma', 'Verma', 'Gupta', 'Agarwal', 'Jain', 'Mehta', 'Shah', 'Patel', 'Yadav', 'Singh', 'Rathore', 'Chauhan', 'Shekhawat', 'Saini', 'Meena', 'Bansal', 'Goyal', 'Mittal', 'Saxena', 'Trivedi', 'Nair', 'Menon', 'Iyer', 'Reddy', 'Rao', 'Joshi', 'Deshmukh', 'Kulkarni', 'Pillai', 'Bhat', 'Kapoor', 'Malhotra', 'Chopra', 'Sethi', 'Bhatia', 'Sood', 'Kaur', 'Gill', 'Ahuja', 'Pandey'];
const localities = ['Malviya Nagar', 'Vaishali Nagar', 'Mansarovar', 'Jagatpura', 'Sodala', 'Bani Park', 'Shastri Nagar', 'Tonk Road', 'Civil Lines', 'Adarsh Nagar', 'Scheme 2', 'Ram Nagar'];
for (let f = 0; f < firstNames.length && customers.length < 150; f++) {
  for (let s = f; s < surnames.length && customers.length < 150; s++) {
    const name = `${firstNames[f]} ${surnames[s]}`;
    if (customers.some((c) => c.name === name)) continue;
    const roll = rnd();
    const city = pick(['Jaipur', 'Jaipur', 'Alwar', 'Gurugram']);
    customers.push({
      id: `CUS-${1001 + customers.length}`,
      name,
      phone: `+91 ${pick(['98', '97', '91', '88', '70', '63', '82', '78'])}${int(10000000, 99999999)}`,
      email: emailFor(name),
      address: `${int(1, 240)}, ${pick(localities)}, ${city}`,
      city,
      status: roll > 0.95 ? 'VIP' : roll > 0.9 ? 'Inactive' : 'Active',
      tier: roll > 0.95 ? 'VIP' : roll > 0.55 ? 'Returning' : 'New',
      notes: roll > 0.86 ? 'Prefers weekend morning slots.' : '',
      joinedAt: offset(-int(10, 900)),
    });
  }
}

/* ------------------------------- vehicles ------------------------------- */
const vehicleCatalog = [
  ['Maruti Suzuki', 'Swift', 'Hatchback', 'Petrol', 'Pearl White'],
  ['Maruti Suzuki', 'Baleno', 'Hatchback', 'Petrol', 'Nexa Blue'],
  ['Hyundai', 'Creta', 'SUV', 'Diesel', 'Polar White'],
  ['Hyundai', 'i20', 'Hatchback', 'Petrol', 'Fiery Red'],
  ['Tata', 'Nexon', 'SUV', 'Petrol', 'Calgary White'],
  ['Tata', 'Harrier', 'SUV', 'Diesel', 'Oberon Black'],
  ['Mahindra', 'XUV700', 'SUV', 'Diesel', 'Midnight Black'],
  ['Mahindra', 'Scorpio-N', 'SUV', 'Diesel', 'Napoli Black'],
  ['Honda', 'City', 'Sedan', 'Petrol', 'Platinum White'],
  ['Honda', 'Amaze', 'Sedan', 'Petrol', 'Radiant Red'],
  ['Maruti Suzuki', 'Ertiga', 'MUV', 'CNG', 'Silky Silver'],
  ['Toyota', 'Innova Crysta', 'MUV', 'Diesel', 'Attitude Black'],
  ['Toyota', 'Fortuner', 'SUV', 'Diesel', 'Super White'],
  ['Kia', 'Seltos', 'SUV', 'Petrol', 'Gravity Grey'],
  ['Kia', 'Carens', 'MUV', 'Petrol', 'Imperial Blue'],
  ['Skoda', 'Slavia', 'Sedan', 'Petrol', 'Candy White'],
  ['Volkswagen', 'Virtus', 'Sedan', 'Petrol', 'Rising Blue'],
  ['MG', 'Hector', 'SUV', 'Petrol', 'Starry Sky'],
  ['Renault', 'Kwid', 'Hatchback', 'Petrol', 'Zanskar Blue'],
  ['BMW', '3 Series', 'Luxury', 'Petrol', 'Alpine White'],
  ['Mercedes-Benz', 'C-Class', 'Luxury', 'Petrol', 'Obsidian Black'],
  ['Audi', 'Q3', 'Luxury', 'Petrol', 'Glacier White'],
  ['Volvo', 'XC40', 'Luxury', 'Hybrid', 'Crystal White'],
  ['Maruti Suzuki', 'Brezza', 'SUV', 'Petrol', 'Sizzling Red'],
  ['Tata', 'Tiago EV', 'Hatchback', 'Electric', 'Tropical Mist'],
  ['Hyundai', 'Verna', 'Sedan', 'Petrol', 'Abyss Black'],
  ['Honda', 'Elevate', 'SUV', 'Petrol', 'Radiant Red'],
  ['Maruti Suzuki', 'WagonR', 'Hatchback', 'CNG', 'Magma Grey'],
];
const regPrefixes = ['RJ14', 'RJ14', 'RJ02', 'RJ45', 'DL8C', 'HR26', 'MH12', 'RJ32'];
const regLetters = 'ABCDEFGHJKLMNPRSTUVWXY';
const usedRegs = new Set();
const makeReg = () => {
  let reg;
  do {
    reg = `${pick(regPrefixes)} ${regLetters[int(0, 21)]}${regLetters[int(0, 21)]} ${int(1000, 9899)}`;
  } while (usedRegs.has(reg));
  usedRegs.add(reg);
  return reg;
};
const vehicles = [];
let vIdx = 0;
customers.forEach((c, ci) => {
  const count = [1, 1, 1, 1, 1, 2, 2, 3][ci % 8];
  for (let k = 0; k < count; k++) {
    const [brand, model, type, fuel, color] = vehicleCatalog[vIdx % vehicleCatalog.length];
    vehicles.push({
      id: `VEH-${2001 + vIdx}`,
      registration: makeReg(),
      brand,
      model,
      type,
      fuelType: fuel,
      color,
      ownerId: c.id,
      year: int(2016, 2025),
      notes: type === 'Luxury' ? 'Hand wash only — no automated brushes.' : '',
    });
    vIdx++;
  }
});
const vehiclesByOwner = vehicles.reduce((acc, v) => {
  (acc[v.ownerId] ||= []).push(v);
  return acc;
}, {});

/* ------------------------------- bookings ------------------------------- */
const sources = ['Phone', 'Walk-in', 'Website', 'Mobile App', 'WhatsApp'];
const activeStaff = staff.filter((s) => s.role !== 'Accountant');
const flowOrder = ['New', 'Confirmed', 'Vehicle Received', 'In Progress', 'Quality Check', 'Ready', 'Completed'];
const flowIndex = Object.fromEntries(flowOrder.map((s, i) => [s, i]));

const statusForDate = (dayOffset, slot) => {
  if (dayOffset > 0) {
    return weighted([['New', 34], ['Confirmed', 46], ['Rescheduled', 8], ['Cancelled', 8], ['No Show', 4]]);
  }
  if (dayOffset === 0) {
    const morning = minsOf(slot) < 720;
    return weighted([
      ['New', 8], ['Confirmed', 13], ['Vehicle Received', 12], ['In Progress', 12],
      ['Quality Check', 11], ['Ready', 14], ['Completed', morning ? 30 : 8],
      ['Cancelled', 4], ['No Show', 2],
    ]);
  }
  return weighted([['Completed', 79], ['Cancelled', 8], ['No Show', 4], ['Rescheduled', 4], ['Ready', 3], ['Quality Check', 2]]);
};

const paymentFor = (status) => {
  if (status === 'Completed') return weighted([['Paid', 82], ['Partial', 11], ['Pending', 7]]);
  if (status === 'Cancelled') return weighted([['Refunded', 55], ['Pending', 45]]);
  if (status === 'Ready' || status === 'Quality Check') return weighted([['Paid', 35], ['Partial', 20], ['Pending', 45]]);
  return weighted([['Pending', 62], ['Partial', 22], ['Paid', 16]]);
};

// 60 days of history (busier recent weeks) + 14 bookings today + a forward pipeline
const offsets = [];
for (let d = 60; d >= 1; d--) {
  const count = d <= 7 ? 14 : d <= 21 ? 11 : d <= 40 ? 9 : 7;
  for (let k = 0; k < count; k++) offsets.push(-d);
}
for (let k = 0; k < 14; k++) offsets.push(0);
[8, 7, 6, 5, 6, 4, 5, 3, 4, 3, 2, 3].forEach((count, i) => {
  for (let k = 0; k < count; k++) offsets.push(i + 1);
});

const noteOptions = [
  ['', 62], ['Please focus on the rear seats.', 8], ['Alloy wheels need extra attention.', 6],
  ['Pickup around 6 PM.', 8], ['Pet hair inside — needs vacuum.', 6], ['Customer will wait at the lounge.', 5],
  ['Do not use dashboard polish.', 5],
];
const internalNoteOptions = [
  ['', 70], ['Repeat customer — apply loyalty discount next visit.', 8],
  ['Vehicle has a minor scratch on the left door, noted in the intake form.', 8],
  ['Check tyre pressure before handover.', 6], ['Use microfibre only on the black paint.', 8],
];

const bookings = offsets.map((dayOffset, i) => {
  const customer = customers[int(0, customers.length - 1)];
  const vehicle = pick(vehiclesByOwner[customer.id]);
  const luxury = vehicle.type === 'Luxury';
  const svcId = weighted([
    ['SRV-01', 22], ['SRV-02', 24], ['SRV-07', 11], ['SRV-03', 12], ['SRV-04', 9],
    ['SRV-05', 7], ['SRV-06', luxury ? 6 : 2], ['SRV-08', 5], ['SRV-09', 4], ['SRV-10', 4],
  ]);
  const serviceIds = [svcId];
  if (rnd() < 0.26 && svcId !== 'SRV-06') {
    serviceIds.push(pick(['SRV-07', 'SRV-09', 'SRV-08', 'SRV-03'].filter((s) => s !== svcId)));
  }
  const subtotal = serviceIds.reduce((a, s) => a + serviceById[s].price, 0);
  const discount = weighted([
    [0, 58],
    [Math.round((subtotal * 0.05) / 10) * 10, 14],
    [Math.round((subtotal * 0.1) / 10) * 10, 18],
    [100, 10],
  ]);
  const tax = Math.round((subtotal - discount) * 0.18);
  const amount = subtotal - discount + tax;
  const slot = pick(SLOTS);
  const status = statusForDate(dayOffset, slot);
  const paymentStatus = paymentFor(status);
  const paidAmount =
    paymentStatus === 'Paid' ? amount : paymentStatus === 'Partial' ? Math.round(amount * 0.5) : 0;
  const date = offset(dayOffset);
  const assignedStaffId = pick(activeStaff).id;
  const createdAt = stamp(offset(dayOffset - int(1, 5)), int(540, 1180));

  const timeline = [{ status: 'New', at: createdAt, by: 'System', note: 'Booking created' }];
  const startMin = minsOf(slot);
  if (status !== 'New') {
    timeline.push({
      status: 'Confirmed',
      at: stamp(date, Math.max(480, startMin - int(90, 600))),
      by: customer.name,
      note: paymentStatus === 'Paid' ? 'Paid online' : 'Confirmed over phone',
    });
  }
  if (status === 'Cancelled') {
    timeline.push({ status: 'Cancelled', at: stamp(date, startMin - 60), by: customer.name, note: 'Cancelled by customer' });
  } else if (status === 'No Show') {
    timeline.push({ status: 'No Show', at: stamp(date, startMin + 30), by: staffById[assignedStaffId].name, note: 'Vehicle not brought in' });
  } else if (status === 'Rescheduled') {
    timeline.push({ status: 'Rescheduled', at: stamp(offset(dayOffset - 1), 660), by: customer.name, note: 'Moved to a later slot' });
  } else if (flowIndex[status] > 1) {
    const names = {
      'Vehicle Received': 'Vehicle received at the bay',
      'In Progress': 'Service started',
      'Quality Check': 'Quality check in progress',
      Ready: 'Vehicle ready for pickup',
      Completed: 'Service completed & handed over',
    };
    for (let f = 2; f <= flowIndex[status]; f++) {
      const st = flowOrder[f];
      timeline.push({ status: st, at: stamp(date, startMin + (f - 1) * 25), by: staffById[assignedStaffId].name, note: names[st] });
    }
  }

  return {
    id: `BKG-${5001 + i}`,
    customerId: customer.id,
    vehicleId: vehicle.id,
    serviceIds,
    date,
    timeSlot: slot,
    subtotal,
    discount,
    tax,
    amount,
    paidAmount,
    paymentStatus,
    assignedStaffId,
    status,
    source: pick(sources),
    notes: weighted(noteOptions),
    internalNotes: weighted(internalNoteOptions),
    createdAt,
    timeline,
  };
});

/* --------------------------- derived aggregates --------------------------- */
const bookingsByCustomer = bookings.reduce((acc, b) => {
  (acc[b.customerId] ||= []).push(b);
  return acc;
}, {});
const bookingsByVehicle = bookings.reduce((acc, b) => {
  (acc[b.vehicleId] ||= []).push(b);
  return acc;
}, {});

customers.forEach((c) => {
  const list = bookingsByCustomer[c.id] || [];
  const valid = list.filter((b) => !['Cancelled', 'No Show'].includes(b.status));
  c.totalBookings = valid.length;
  c.totalSpent = list.reduce((a, b) => a + b.paidAmount, 0);
  c.lastBooking = list.length ? list.map((b) => b.date).sort().at(-1) : null;
  if (c.totalBookings > 4 && c.status === 'Active') c.tier = 'Regular';
});

const servicesWithCounts = serviceSeed.map((s) => ({
  ...s,
  bookings: bookings.filter((b) => b.serviceIds.includes(s.id)).length,
}));

vehicles.forEach((v) => {
  const completed = (bookingsByVehicle[v.id] || []).filter((b) => b.status === 'Completed');
  const dates = completed.map((b) => b.date).sort();
  v.lastService = dates.at(-1) || null;
  if (v.lastService) {
    const d = new Date(`${v.lastService}T00:00:00`);
    d.setDate(d.getDate() + 30);
    v.nextService = iso(d);
  } else {
    v.nextService = null;
  }
});

/* ------------------------------- payments ------------------------------- */
const payments = bookings.map((b, i) => ({
  id: `TXN-${8001 + i}`,
  bookingId: b.id,
  customerId: b.customerId,
  date: b.date,
  method:
    b.source === 'Mobile App'
      ? 'Online'
      : b.source === 'Website'
        ? pick(['UPI', 'Card', 'Online'])
        : pick(['Cash', 'UPI', 'UPI', 'Card']),
  totalAmount: b.amount,
  paidAmount: b.paidAmount,
  status: b.status === 'Cancelled' ? 'Refunded' : b.paymentStatus,
  reference:
    b.paymentStatus === 'Paid' || b.paymentStatus === 'Partial'
      ? `${pick(['UPI', 'TXN', 'RZP', 'POS'])}${int(100000000, 999999999)}`
      : '—',
  collectedBy: pick(staff.filter((s) => ['Staff', 'Manager', 'Accountant'].includes(s.role))).name,
  notes:
    b.paymentStatus === 'Partial'
      ? 'Balance due at pickup.'
      : b.status === 'Cancelled'
        ? 'Refund processed to source.'
        : '',
}));

/* ------------------------------- invoices ------------------------------- */
const invoiceBookings = bookings.filter((b) => ['Completed', 'Ready'].includes(b.status));
const invoices = invoiceBookings.map((b, i) => ({
  id: `INV-${2401 + i}`,
  bookingId: b.id,
  customerId: b.customerId,
  date: b.date,
  dueDate: b.date,
  lines: b.serviceIds.map((sid) => ({ label: serviceById[sid].name, qty: 1, rate: serviceById[sid].price })),
  discount: b.discount,
  taxRate: 18,
  paymentStatus: b.paymentStatus,
  paidAmount: b.paidAmount,
}));

/* ------------------------------ analytics ------------------------------ */
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const paidByDay = {};
const bookingsByDay = {};
bookings.forEach((b) => {
  paidByDay[b.date] = (paidByDay[b.date] || 0) + b.paidAmount;
  bookingsByDay[b.date] = (bookingsByDay[b.date] || 0) + 1;
});
const daySeries = (n) => {
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(TODAY);
    d.setDate(d.getDate() - i);
    const key = iso(d);
    out.push({
      label: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
      date: key,
      revenue: paidByDay[key] || 0,
      bookings: bookingsByDay[key] || 0,
      expenses: Math.round((paidByDay[key] || 0) * 0.41),
    });
  }
  return out;
};
const monthKey = (d) => `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, '0')}`;
const monthSeries = [];
for (let i = 11; i >= 0; i--) {
  const d = new Date(TODAY.getFullYear(), TODAY.getMonth() - i, 1);
  const key = monthKey(d);
  const live = bookings.filter((b) => b.date.startsWith(key));
  const seasonal = 1 + 0.16 * Math.sin((d.getMonth() / 12) * Math.PI * 2);
  const modelled = Math.round(620000 * seasonal - i * 9000);
  const revenue = live.length > 6 ? live.reduce((a, b) => a + b.paidAmount, 0) : modelled;
  monthSeries.push({
    label: MONTHS[d.getMonth()],
    key,
    revenue,
    bookings: live.length > 6 ? live.length : Math.round(revenue / 950),
    expenses: Math.round(revenue * (0.38 + (i % 4) * 0.015)),
  });
}
const weekSeries = [];
for (let w = 7; w >= 0; w--) {
  const end = new Date(TODAY);
  end.setDate(end.getDate() - w * 7);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const range = bookings.filter((b) => b.date >= iso(start) && b.date <= iso(end));
  const revenue = range.reduce((a, b) => a + b.paidAmount, 0);
  weekSeries.push({
    label: `${start.getDate()} ${MONTHS[start.getMonth()]}`,
    range: `${iso(start)} – ${iso(end)}`,
    revenue,
    bookings: range.length,
    expenses: Math.round(revenue * 0.4),
  });
}
const servicePerf = servicesWithCounts
  .map((s) => {
    const bs = bookings.filter((b) => b.serviceIds.includes(s.id) && !['Cancelled', 'No Show'].includes(b.status));
    const revenue = bs.reduce((a, b) => {
      const share = s.price / b.serviceIds.reduce((x, id) => x + serviceById[id].price, 0);
      return a + Math.round(b.amount * share);
    }, 0);
    return { label: s.name, value: bs.length, revenue, tone: s.tone };
  })
  .sort((a, b) => b.value - a.value);

const customerFirst = {};
bookings.slice().sort((a, b) => a.date.localeCompare(b.date)).forEach((b) => {
  if (!customerFirst[b.customerId]) customerFirst[b.customerId] = b.date;
});
const customerGrowth = monthSeries.map((m, i) => {
  const ids = new Set(bookings.filter((b) => b.date.startsWith(m.key)).map((b) => b.customerId));
  const neue = [...ids].filter((id) => (customerFirst[id] || '').startsWith(m.key)).length;
  // Months before the seeded window are modelled so the 12-month view stays credible.
  const modelledUnique = 96 + ((i * 7) % 22);
  const modelledNew = 26 + ((i * 5) % 13);
  const unique = ids.size > 12 ? ids.size : modelledUnique;
  let fresh = ids.size > 12 ? neue : modelledNew;
  // The first month of the seeded window has no pre-history — model a realistic split.
  if (ids.size > 12 && ids.size - fresh < fresh * 0.6) fresh = Math.round(unique * 0.34);
  return { label: m.label, neue: fresh, returning: Math.max(0, unique - fresh) };
});
const staffPerformance = staff
  .map((s) => {
    const assigned = bookings.filter((b) => b.assignedStaffId === s.id);
    const completed = assigned.filter((b) => b.status === 'Completed');
    return {
      staffId: s.id,
      name: s.name,
      role: s.role,
      completed: completed.length,
      assigned: assigned.length,
      revenue: completed.reduce((a, b) => a + b.amount, 0),
      rating: s.rating,
      onTime: 86 + ((staff.indexOf(s) * 3) % 13),
    };
  })
  .sort((a, b) => b.completed - a.completed);
const topServices = servicePerf.slice().sort((a, b) => b.revenue - a.revenue).slice(0, 5);
const slotCounts = {};
bookings.forEach((b) => (slotCounts[b.timeSlot] = (slotCounts[b.timeSlot] || 0) + 1));
const peakHours = SLOTS.map((s) => ({ label: s.replace(':00', ''), value: slotCounts[s] || 0 }));
const activeInMonth = (key) =>
  new Set(bookings.filter((b) => b.date.startsWith(key)).map((b) => b.customerId));
const retentionSeries = monthSeries.slice(-6).map((m, i) => {
  const idx = monthSeries.findIndex((x) => x.key === m.key);
  const prev = monthSeries[idx - 1];
  const active = activeInMonth(m.key);
  const prevActive = prev ? activeInMonth(prev.key) : new Set();
  // Repeat-visit rate: share of this month's customers who also visited last month.
  const retained = [...active].filter((id) => prevActive.has(id)).length;
  const rate = prevActive.size > 10 && retained > 0
    ? Math.round((retained / active.size) * 100)
    : 58 + ((i * 6) % 17);
  return {
    label: m.label,
    retention: rate,
    churn: 100 - rate,
    churnValue: Math.max(0, active.size - retained),
  };
});
const staffAgg = Object.fromEntries(
  staff.map((s) => {
    const assigned = bookings.filter((b) => b.assignedStaffId === s.id);
    const completed = assigned.filter((b) => b.status === 'Completed');
    return [
      s.id,
      {
        assigned: assigned.filter((b) => !['Completed', 'Cancelled', 'No Show'].includes(b.status)).length,
        completed: completed.length,
        revenue: completed.reduce((a, b) => a + b.amount, 0),
        onTime: 88 + ((staff.indexOf(s) * 3) % 11),
      },
    ];
  })
);
const recentActivities = bookings
  .slice(-26)
  .reverse()
  .map((b, i) => {
    const cust = customers.find((c) => c.id === b.customerId);
    const kind = ['booking', 'payment', 'staff', 'booking', 'payment'][i % 5];
    const map = {
      booking: {
        title: `Booking ${b.id} ${['created', 'confirmed', 'rescheduled'][i % 3]}`,
        description: `${cust.name} · ${b.status} · ${b.timeSlot}`,
      },
      payment: {
        title: `Payment ${b.paymentStatus === 'Paid' ? 'received' : b.paymentStatus === 'Refunded' ? 'refunded' : 'pending'}`,
        description: `${cust.name} · ₹${b.paidAmount.toLocaleString('en-IN')} · ${b.id}`,
      },
      staff: {
        title: `${staffById[b.assignedStaffId].name} updated status`,
        description: `${b.id} moved to ${b.status}`,
      },
    }[kind];
    return {
      id: `ACT-${i + 1}`,
      kind,
      title: map.title,
      description: map.description,
      at: b.timeline.at(-1)?.at || b.createdAt,
    };
  });

const last30Bookings = bookings.filter((b) => b.date >= iso(new Date(TODAY.getTime() - 29 * 864e5)));
const reportSummary = {
  dailyRevenue: bookings.filter((b) => b.date === iso(TODAY)).reduce((a, b) => a + b.paidAmount, 0),
  weeklyRevenue: bookings.filter((b) => b.date >= iso(new Date(TODAY.getTime() - 6 * 864e5))).reduce((a, b) => a + b.paidAmount, 0),
  monthlyRevenue: last30Bookings.reduce((a, b) => a + b.paidAmount, 0),
  totalBookings: bookings.length,
  completedServices: bookings.filter((b) => b.status === 'Completed').length,
  cancelledBookings: bookings.filter((b) => b.status === 'Cancelled').length,
  newCustomers: customers.filter((c) => c.joinedAt >= iso(new Date(TODAY.getTime() - 29 * 864e5))).length,
  returningRate: 68.4,
  avgTicket: Math.round(last30Bookings.reduce((a, b) => a + b.amount, 0) / (last30Bookings.length || 1)),
  collectionRate: 87.2,
};

/* -------------------------------- emit -------------------------------- */
const header = (title) => `/* Seed data for the AutoSutraa CRM prototype — generated by scripts/generate-data.mjs. */\n/* ${title} */\n`;
const json = (v) => JSON.stringify(v, null, 2);
const props = (v) => json(v).replace(/"([A-Za-z_][A-Za-z0-9_]*)":/g, '$1:');

const write = (file, body) => writeFileSync(`${OUT}/${file}`, body);

write('customers.ts', `${header('Customers')}import type { Customer } from '@/types';

export const customers: Customer[] = ${props(
  customers.map((c) => ({
    id: c.id, name: c.name, phone: c.phone, email: c.email, address: c.address, city: c.city,
    status: c.status, totalBookings: c.totalBookings, totalSpent: c.totalSpent,
    lastBooking: c.lastBooking, joinedAt: c.joinedAt, notes: c.notes, tier: c.tier,
  }))
)};
`);

write('vehicles.ts', `${header('Vehicles')}import type { Vehicle } from '@/types';

export const vehicles: Vehicle[] = ${props(
  vehicles.map((v) => ({
    id: v.id, registration: v.registration, type: v.type, brand: v.brand, model: v.model,
    color: v.color, ownerId: v.ownerId, lastService: v.lastService, nextService: v.nextService,
    fuelType: v.fuelType, year: v.year, notes: v.notes,
  }))
)};
`);

write('staff.ts', `${header('Staff')}import type { Staff } from '@/types';

export const staff: Staff[] = ${props(
  staff.map((s) => ({
    id: s.id, name: s.name, email: s.email, phone: s.phone, role: s.role, status: s.status,
    designation: s.designation,
    assignedBookings: staffAgg[s.id].assigned,
    completedServices: staffAgg[s.id].completed,
    rating: s.rating, joinedAt: s.joinedAt, shift: s.shift, skills: s.skills, avatarTone: s.avatarTone,
    permissions: {
      viewDashboard: true,
      manageBookings: s.role !== 'Accountant',
      manageCustomers: ['Super Admin', 'Admin', 'Manager'].includes(s.role),
      manageVehicles: ['Super Admin', 'Admin', 'Manager'].includes(s.role),
      manageServices: ['Super Admin', 'Admin'].includes(s.role),
      manageStaff: ['Super Admin', 'Admin'].includes(s.role),
      managePayments: ['Super Admin', 'Admin', 'Accountant', 'Manager'].includes(s.role),
      manageInvoices: ['Super Admin', 'Admin', 'Accountant'].includes(s.role),
      viewReports: ['Super Admin', 'Admin', 'Manager', 'Accountant'].includes(s.role),
      manageSettings: ['Super Admin', 'Admin'].includes(s.role),
    },
    activity: [
      { id: `${s.id}-A1`, label: `Completed ${staffAgg[s.id].completed} services`, at: offset(-1) },
      { id: `${s.id}-A2`, label: `${staffAgg[s.id].assigned} bookings currently assigned`, at: offset(0) },
      { id: `${s.id}-A3`, label: 'Shift updated', at: offset(-3) },
    ],
  }))
)};
`);

write('services.ts', `${header('Service catalogue')}import type { Service } from '@/types';

export const services: Service[] = ${props(
  servicesWithCounts.map((s) => ({
    id: s.id,
    name: s.name,
    description: serviceDescriptions[s.id],
    price: s.price,
    duration: s.duration,
    vehicleTypes: s.id === 'SRV-06' ? ['Sedan', 'SUV', 'Luxury', 'MUV'] : ['Hatchback', 'Sedan', 'SUV', 'MUV', 'Luxury'],
    category: s.category,
    active: s.id !== 'SRV-09',
    imageTone: s.tone,
    bookings: s.bookings,
  }))
)};
`);

write('bookings.ts', `${header('Bookings')}import type { Booking } from '@/types';

export const bookings: Booking[] = ${props(
  bookings.map((b) => ({
    id: b.id, customerId: b.customerId, vehicleId: b.vehicleId, serviceIds: b.serviceIds,
    date: b.date, timeSlot: b.timeSlot, amount: b.amount, discount: b.discount, tax: b.tax,
    paidAmount: b.paidAmount, paymentStatus: b.paymentStatus, assignedStaffId: b.assignedStaffId,
    status: b.status, source: b.source, notes: b.notes, internalNotes: b.internalNotes,
    createdAt: b.createdAt, timeline: b.timeline,
  }))
)};
`);

write('payments.ts', `${header('Payments')}import type { Payment } from '@/types';

export const payments: Payment[] = ${props(payments)};
`);

write('invoices.ts', `${header('Invoices')}import type { Invoice } from '@/types';

export const invoices: Invoice[] = ${props(invoices)};
`);

write('staffStats.ts', `${header('Staff aggregates')}export const staffStats: Record<string, { assigned: number; completed: number; revenue: number; onTime: number }> = ${json(staffAgg)};
`);

write('dashboardData.ts', `${header('Dashboard analytics series')}import type { SeriesPoint, StaffPerformance } from '@/types';

export interface DashboardRevenuePoint {
  label: string;
  revenue: number;
  bookings: number;
  expenses: number;
  date?: string;
  key?: string;
  range?: string;
}

export const dailyRevenue: DashboardRevenuePoint[] = ${props(daySeries(45))};

export const weeklyRevenue: DashboardRevenuePoint[] = ${props(weekSeries)};

export const monthlyRevenue: DashboardRevenuePoint[] = ${props(monthSeries)};

export const servicePerformance: { label: string; value: number; revenue: number; tone: string }[] = ${props(servicePerf)};

export const customerGrowth: { label: string; neue: number; returning: number }[] = ${props(customerGrowth)};

export const staffPerformance: (StaffPerformance & { role: string })[] = ${props(staffPerformance)};

export const topServices: { label: string; value: number; revenue: number; tone: string }[] = ${props(topServices)};

export const peakHours: SeriesPoint[] = ${props(peakHours)};

export const retentionSeries: { label: string; retention: number; churn: number; churnValue: number }[] = ${props(retentionSeries)};
`);

write('activities.ts', `${header('Recent activity feed')}import type { ActivityItem } from '@/types';

export const recentActivities: ActivityItem[] = ${props(recentActivities)};
`);

write('reports.ts', `${header('Report definitions + summary KPIs')}import type { ReportSummary } from '@/types';

export const reportSummary: ReportSummary = ${props(reportSummary)};

export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  category: 'Revenue' | 'Bookings' | 'Customers' | 'Staff' | 'Payments';
  updatedAt: string;
}

export const reportDefinitions: ReportDefinition[] = ${props([
  { id: 'daily-revenue', title: 'Daily Revenue', description: 'Day-by-day collections, average ticket size and payment split for the selected range.', category: 'Revenue', updatedAt: iso(TODAY) },
  { id: 'weekly-revenue', title: 'Weekly Revenue', description: 'Week-over-week revenue with booking volume and growth comparison.', category: 'Revenue', updatedAt: iso(TODAY) },
  { id: 'monthly-revenue', title: 'Monthly Revenue', description: 'Month-wise revenue, expenses and gross margin trend for the last 12 months.', category: 'Revenue', updatedAt: iso(TODAY) },
  { id: 'service-revenue', title: 'Service-wise Revenue', description: 'Revenue contribution and booking share of every service in the catalogue.', category: 'Revenue', updatedAt: iso(TODAY) },
  { id: 'booking-report', title: 'Booking Report', description: 'Complete booking funnel — created, confirmed, completed, cancelled and no-shows.', category: 'Bookings', updatedAt: iso(TODAY) },
  { id: 'customer-report', title: 'Customer Report', description: 'New vs returning customers, top spenders and city-wise distribution.', category: 'Customers', updatedAt: iso(TODAY) },
  { id: 'staff-performance', title: 'Staff Performance', description: 'Jobs completed, revenue handled and on-time completion per team member.', category: 'Staff', updatedAt: iso(TODAY) },
  { id: 'payment-report', title: 'Payment Report', description: 'Collections by method, outstanding balances and refund activity.', category: 'Payments', updatedAt: iso(TODAY) },
  { id: 'cancelled-bookings', title: 'Cancelled Bookings', description: 'Cancellation reasons, lost revenue and repeat offenders.', category: 'Bookings', updatedAt: iso(TODAY) },
  { id: 'completed-services', title: 'Completed Services', description: 'Service delivery log with turnaround time and quality-check pass rate.', category: 'Bookings', updatedAt: iso(TODAY) },
  { id: 'retention', title: 'Customer Retention', description: 'Repeat-visit rate, churn risk and win-back opportunities.', category: 'Customers', updatedAt: iso(TODAY) },
])};
`);

console.log(
  `customers=${customers.length} vehicles=${vehicles.length} bookings=${bookings.length} payments=${payments.length} invoices=${invoices.length} staff=${staff.length}`
);
