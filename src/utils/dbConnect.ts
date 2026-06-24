import mongoose from "mongoose";

const monogo_uri:string = process.env.MONGO_URI || 'mongodb://admin:lotus@allacess-@ac-k5rvmvl-shard-00-00.a7eiv19.mongodb.net:27017,ac-k5rvmvl-shard-00-01.a7eiv19.mongodb.net:27017,ac-k5rvmvl-shard-00-02.a7eiv19.mongodb.net:27017/game?ssl=true&replicaSet=atlas-32hq2y-shard-0&authSource=admin&appName=Cluster0'
console.log("Mongo URI:", monogo_uri);
export const connectDb = async () => {
    try {
        const db = await mongoose.connect(monogo_uri);
        console.log(`MongoDB connected: ${db.connection.host}`);
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
}
