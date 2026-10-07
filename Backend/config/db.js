import { connect } from "mongoose";
import dns from "node:dns";

export const connectDB = async () => {
    try {
        try {
            dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
        } catch {
            // Ignore if DNS servers cannot be set
        }
        await connect(process.env.DB_URL?.trim());
        console.log("DB connected");
    } catch (error) {
        console.error(
            "Error connecting to DB:",
            error.message
        );
        process.exit(1);
    }
};
