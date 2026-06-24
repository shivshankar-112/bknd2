import mongoose from "mongoose";

const monogo_uri:string = process.env.MONGO_URI || 'mongodb://affliateApp:JI3uX6ufLJFSgyBN@ac-j8gotxu-shard-00-00.lxjhahz.mongodb.net:27017,ac-j8gotxu-shard-00-01.lxjhahz.mongodb.net:27017,ac-j8gotxu-shard-00-02.lxjhahz.mongodb.net:27017/game?ssl=true&replicaSet=atlas-zojvwq-shard-0&authSource=admin&appName=myCluster';

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