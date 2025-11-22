import dotenv from "dotenv";
import { initDatabase } from "./config/DataSource.js";
import createApp from "./app.js";
import { logger } from "./utils/Logger.js";

dotenv.config();

async function startServer() {
  try {
    await initDatabase();
    const app = await createApp();
    const port = process.env.PORT || 4000;
    app.listen(port, () => {
      logger.info("Server started successfully", {
        port,
        environment: process.env.NODE_ENV || "development",
        endpoints: {
          health: `http://localhost:${port}/health`,
          auth: `http://localhost:${port}/api/auth`,
        },
      });
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

startServer();
