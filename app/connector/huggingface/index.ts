import * as path from "path";
import * as dotenv from 'dotenv';
import { HuggingFaceDatasetSyncManager } from "./functions";
import { start } from "@hasura/ndc-duckduckapi";
import { makeConnector, duckduckapi } from "@hasura/ndc-duckduckapi";

dotenv.config();

const connectorConfig: duckduckapi = {
  dbSchema: `
    SELECT 1;
    -- HuggingFace Dataset Schema will be added dynamically
  `,
  functionsFilePath: path.resolve(__dirname, "./functions.ts"),
};

(async () => {
  try {
    const hfSyncManager = new HuggingFaceDatasetSyncManager();
    const isHuggingFaceConfigured = hfSyncManager.isConfigValid();

    if (!isHuggingFaceConfigured) {
      console.log("Hugging Face configurations are not valid. Exiting sync.");
      return;
    }

    if (isHuggingFaceConfigured) {
      const hfSyncManager = new HuggingFaceDatasetSyncManager();
      await hfSyncManager.sync();
      // Update connector config with HuggingFace schema
      // connectorConfig.dbSchema += `\n-- HuggingFace Dataset Schema\n${huggingFaceSchema}`;
    }

    // Initialize connector with schema
    const connector = await makeConnector(connectorConfig);
    start(connector);
  } catch (error) {
    console.error('Failed to initialize:', error);
    process.exit(1);
  }
})();