import dotenv from "dotenv";
import ConnectDB from "./db/config.js";
import { server } from "./app.js";

dotenv.config({
  path: "./.env",
});

const PORT = process.env.PORT || process.env.VITE_PORT || 8000;

ConnectDB()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`✅ Server is running at port : ${PORT}`);
    });
  })
  .catch((error) => {
    console.log("❌ MongoDb connection Failed !!!", error);
  });
