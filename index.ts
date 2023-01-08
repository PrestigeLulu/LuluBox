import {config} from "dotenv";
config();

import Bot from "./src/Bot/Bot";
new Bot().login();
