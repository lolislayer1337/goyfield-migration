import { migrate } from "@scripts/v2/migrate.js";
import dotenv from "dotenv";

dotenv.config();

console.log("Starting migration");

await migrate();

console.log("Migration finished");