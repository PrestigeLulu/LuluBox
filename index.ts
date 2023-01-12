import {config} from "dotenv";
config();
import {connect,set} from "mongoose";
set('strictQuery', true);
connect("mongodb://127.0.0.1:27017/LuluBox")
	.then(() => {
		console.log("Connected to MongoDB");
	});
import Bot from "./src/Bot/Bot";

new Bot().login();