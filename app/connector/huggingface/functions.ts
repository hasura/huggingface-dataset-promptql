import { getDB } from "@hasura/ndc-duckduckapi";
import * as path from 'path';
import * as os from 'os';

export class HuggingFaceDatasetSyncManager {
    private dataset: string;
    private datasetId: string;
    private tempDir: string;
  
    constructor() {
        this.dataset = process.env.HUGGINGFACE_DATASET || '';
        this.datasetId = 'datasets/' + this.dataset;
        this.tempDir = path.join(os.tmpdir(), 'huggingface-dataset');

        if (!this.dataset) {
          console.log('Hugging Face environment variables not fully set. Skipping Hugging Face sync.');
          return;
        }
    }

    public isConfigValid(): boolean {
      return this.dataset !== '';
    }
  
    private generateTableName(): string {
      // Extracts the dataset name from the full datasetId path
      const match = this.datasetId.match(/^datasets\/[^\/]+\/([^\/]+)/);
      const tableName = match ? match[1] : 'default_table_name';

      return tableName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_') // Sanitize to avoid SQL errors
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
      return this.datasetId
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_|_$/g, '');
    }
  
    private async importDataset(): Promise<void> {
      const db = await getDB();
      const tableName = this.generateTableName();
  
      // Check if the table already exists to avoid re-downloading
      const tableExists = await db.all(`SELECT * FROM information_schema.tables WHERE table_name = '${tableName}'`);
      if (tableExists.length > 0) {
        console.log(`Table ${tableName} already exists, skipping download.`);
        return;
      }
  
      console.log(`Creating table ${tableName} from Hugging Face dataset ${this.dataset}...`);
  
      // Dynamically handle different file types using DuckDB's hf:// paths
      const filePath = `hf://${this.datasetId}`;
      await db.run(`
        CREATE TABLE ${tableName} AS 
        SELECT * FROM '${filePath}'
      `);

      console.log('create table is done')
  
      const [{ count }] = await db.all(`SELECT COUNT(*) as count FROM ${tableName}`);
      console.log(`Imported ${count} rows into ${tableName}`);
    } 

    public async sync(): Promise<void> {
      console.log('Starting Hugging Face dataset sync...');
      await this.importDataset();
      console.log('Hugging Face dataset sync completed');
    }
}