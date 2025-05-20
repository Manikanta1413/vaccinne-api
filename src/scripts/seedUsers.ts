import mongoose from "mongoose";
import dotenv from "dotenv";
import  User  from "../models/user.model"; // Adjust the import path
import { faker } from "@faker-js/faker";

dotenv.config();

const TOTAL_USERS = 1_000_000;

async function seedUsers() {
  await mongoose.connect(process.env.MONGODB_URI || "");

  const users = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    users.push({
      name: faker.person.fullName(),
      phoneNumber: faker.phone.number("99999#####" as any),
      age: faker.number.int({ min: 18, max: 60 }),
      aadharNumber: faker.string.numeric(12),
      pinCode: faker.location.zipCode("######"),
      role: "user",
      vaccinationStatus: {
        firstDose: {
          vaccinated: faker.datatype.boolean(),
          date: faker.date.past(),
        },
        secondDose: {
          vaccinated: faker.datatype.boolean(),
          date: faker.date.past(),
        },
      },
      password: "hashedPasswordHere",
    });

    // Bulk insert in chunks
    if (users.length === 10000) {
      await User.insertMany(users);
      console.log(`${i + 1} users inserted`);
      users.length = 0;
    }
  }

  if (users.length > 0) await User.insertMany(users);

  console.log("Seeding complete");
  await mongoose.disconnect();
}

seedUsers().catch(console.error);
