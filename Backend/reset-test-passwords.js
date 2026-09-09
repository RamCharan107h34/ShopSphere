// One-off dev utility: reset passwords of the seeded test accounts to a known value.
// Usage: node reset-test-passwords.js [newPassword]
// Run from Backend/ so --env-file=.env picks up DB_URL.
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const newPassword = process.argv[2] || "Test@1234";
const emails = [
    "admin@test.com",
    "seller@test.com",
    "customer@test.com",
    "agent_1788582441711@test.com",
];

const run = async () => {
    await mongoose.connect(process.env.DB_URL);
    const col = mongoose.connection.collection("users");
    const hash = await bcrypt.hash(newPassword, 10);

    for (const email of emails) {
        const result = await col.updateOne({ email }, { $set: { password: hash } });
        console.log(`${email}: ${result.matchedCount ? "password reset" : "NOT FOUND"}`);
    }

    await mongoose.disconnect();
};

run().catch((error) => {
    console.error("Failed:", error.message);
    process.exit(1);
});
