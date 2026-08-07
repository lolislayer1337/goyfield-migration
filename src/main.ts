import { migrate } from "@scripts/v2/migrate.js";

console.log("Starting migration");

await migrate();

console.log("Migration finished");