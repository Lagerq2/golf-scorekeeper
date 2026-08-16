# GolfScore Vault

GolfScore Vault is a full-stack golf scorekeeper with a React frontend and a Java/Spring Boot backend. It tracks courses, players, live hole-by-hole rounds, score history, analytics, and JSON backups.

## Project structure

```text
.
├── backend/             Spring Boot API and persistent database
│   ├── data/
│   ├── src/main/java/
│   ├── src/main/resources/
│   └── pom.xml
├── frontend/            React, TypeScript, Vite, and Tailwind CSS
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── .github/
├── .gitignore
└── README.md
```

## Development

Requirements: Java 21, Maven, and Node.js 20 or newer.

Start the backend:

```bash
cd backend
mvn spring-boot:run
```

It listens on http://localhost:8080 and stores data in `backend/data/database.json`.

In another terminal, start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000. Vite proxies `/api` requests to Spring Boot.

## Builds

Build the frontend:

```bash
cd frontend
npm ci
npm run build
```

Build the backend after the frontend if you want the React production bundle included in the executable JAR:

```bash
cd backend
mvn package
java -jar target/golf-scorekeeper-1.0.0.jar
```

The application is then available at http://localhost:8080. The backend can also be built independently; when `frontend/dist` exists, Maven packages it under Spring Boot's static resources.

Set `PORT` to change the backend HTTP port or `GOLF_DATABASE_PATH` to store the JSON database elsewhere.
