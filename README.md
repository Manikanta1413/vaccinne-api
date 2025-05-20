# 💉 Vaccine Registration API

This project is a backend API for a vaccine registration platform, similar to the CoWIN portal, built using **Node.js**, **Express**, and **MongoDB Atlas**. The API supports functionalities for users to register, book vaccination slots, and track their dose status. Admins can view registration summaries and slot availability.

---

## 🚀 Features

### 👤 User Functionality

- Register with personal details (name, phone number, age, pincode, Aadhar number)
- Login via phone number and password
- View available slots for first/second dose
- Book slots for first or second dose
- Change registered slots (only allowed 24 hours before scheduled time)
- Users can register for the second dose **only after** completing the first
- Automatically marked vaccinated once the slot time passes

### 🛠️ Admin Functionality

- Admin login (credentials created manually in DB)
- View all users with filters:
  - Age
  - Pincode
  - Vaccination status (none / first dose / fully vaccinated)
- View slot bookings:
  - For a specific date
  - For a date + pincode
  - First/second dose/total slot summary

---

## 🧩 Slot Details

- Vaccination drive: **1st Nov 2024 to 30th Nov 2024**
- Timings: **10:00 AM to 5:00 PM** (30 min slots)
- Slots per day: 14 slots (7 hours × 2 slots/hour)
- Each slot: 10 doses
- Total available doses: **30 days × 14 slots/day × 10 = 4200 doses**

---

## 📦 Project Structure


---

## 🧪 API Endpoints

### 📌 Auth Routes (`/api/auth`)
| Method | Endpoint         | Description               |
|--------|------------------|---------------------------|
| POST   | `/register`      | Register a new user       |
| POST   | `/login`         | User login                |
| POST   | `/logout`        | User logout               |

---

### 👤 User Routes (`/api/user`)
| Method | Endpoint       | Description         |
|--------|----------------|---------------------|
| GET    | `/profile`     | Get user profile    |

---

### ⏰ Slot Routes (`/api/slots`)
| Method | Endpoint                | Description                                    |
|--------|-------------------------|------------------------------------------------|
| GET    | `/available`            | View available slots                           |
| POST   | `/book`                 | Book a slot                                    |
| PUT    | `/change`               | Change slot registration (before 24 hrs only)  |
| POST   | `/mark-vaccinated`      | Mark users as vaccinated after slot time       |

---

### 🧑‍💼 Admin Routes (`/api/admin`)
| Method | Endpoint                              | Description                                            |
|--------|----------------------------------------|--------------------------------------------------------|
| POST   | `/login`                               | Admin login                                            |
| GET    | `/users`                               | Get users with optional filters                        |
| GET    | `/slot-summary`                        | Get first/second/total dose summary for a date        |
| GET    | `/slots`                               | Get all slots                                          |
| GET    | `/slots/:date`                         | Get slot details by date                               |
| GET    | `/slots/:date/:pinCode`                | Get slots by date and pinCode                          |
| POST   | `/logout`                              | Admin logout                                           |

---

## 🛠️ Models Summary

### 👥 User Model

```ts
{
  name: string;
  phoneNumber: string;
  age: number;
  pinCode: string;
  aadharNumber: string;
  password: string;
  vaccinationStatus: 'none' | 'first' | 'second';
  registeredSlot: {
    doseType: 'first' | 'second';
    slotId: ObjectId;
  };
}

⏳ Slot Model
{
  date: string; // Format: YYYY-MM-DD
  startTime: string; // e.g., "10:00"
  endTime: string;   // e.g., "10:30"
  capacity: number;
  bookedUsers: ObjectId[]; // References to User
  doseType: 'first' | 'second';
  pinCode: string;
}

🌱 Seeding the Slots
Run the following command to pre-fill the 420 available slots for Nov 2025:
npm run seed
This will:

Delete old slot entries

Generate slots from 1st to 30th Nov

Time slots from 10:00 AM to 5:00 PM

10 doses per slot

🔐 Environment Setup (.env)
PORT=5000
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin@123
MONGODB_URI=mongodb+srv://dintakurthimanikanta78:Mani%401358@cluster0.0wnnnxc.mongodb.net/vaccine-api?retryWrites=true&w=majority
JWT_SECRET=vaccine_api



# 1. Clone the repo
git clone https://github.com/your-repo/vaccine-api.git
cd vaccine-api

# 2. Install dependencies
npm install

# 3. Create .env file
PORT=5000
ADMIN_PHONE=9999999999
ADMIN_PASSWORD=admin@123
MONGODB_URI=mongodb+srv://dintakurthimanikanta78:Mani%401358@cluster0.0wnnnxc.mongodb.net/vaccine-api?retryWrites=true&w=majority
JWT_SECRET=vaccine_api

# 4. Seed Slots
npm run seed

# 5. Seed Users -- 1 Million
npm run seedUsers

# 6. Start the server (auto clusters based on CPU)
npm run dev


🌐 MongoDB Atlas Info
Cluster deployed on: MongoDB Atlas

Slot data is seeded through slot.seed.ts

Admin user added automatically to the users collection with role = admin

🧑‍💻 Technologies Used
Node.js

Express

MongoDB + Mongoose

MongoDB Atlas

JWT Auth

Bcrypt

Swagger

Clustering with os module

Express Rate Limiting



✅ Summary Format for Reporting
🔍 Admin Filter Query Test

Query Params: vaccinationStatus=firstDose

DB Size: 1,008,565 users

Matched Users: 253426

Response Size: 50 users (for preview)

Time Taken: 748.604 ms (from console.time)

Indexes Used: Yes (vaccinationStatus.firstDose.vaccinated, pinCode, age, role)




Query Params: age=30

DB Size: 1,008,565 users

Matched Users: 23488

Response Size: 50 users (for preview)

Time Taken: 130 ms (from console.time)

Indexes Used: Yes (vaccinationStatus.firstDose.vaccinated, pinCode, age, role )
