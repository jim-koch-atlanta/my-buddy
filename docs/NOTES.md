## Step 3: Produce the basic scaffolding of the Node/TS + Express project.

1. Run the following commands:
```
npm init -y
npm install typescript
npm install express pg dotenv
npm install -D typescript @types/node @types/express @types/pg ts-node-dev
```
2. Add [tsconfig.json](../tsconfig.json).
3. Add [db.ts](../src/db.ts).
4. Add [index.ts](../src/index.ts).
5. Add `dev`, `build,` and `start` tasks to [package.json](../package.json).
5. Start the Postgres DB container with `docker compose down -v && docker compose up --build`.
6. Run `npm run dev`.
7. In a browser, verify access to [http://localhost:3000/api/db-status](http://localhost:3000/api/db-status).
