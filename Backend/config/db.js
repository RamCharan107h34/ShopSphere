import { connect } from "mongoose";

export const connectDB = async () => {
    try {
        await connect(process.env.DB_URL);
        console.log("DB connected");
    } catch (error) {
        console.error(
            "Error connecting to DB:",
            error.message
        );
        process.exit(1);
    }
};
