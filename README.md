# BallerLeague (JavaScript Monorepo Style)

React + Express application using JavaScript only, Tailwind CSS v4, React Router, and express-validator.

## Stack

- Frontend: React, Vite, Tailwind CSS v4, React Router
- Backend: Express, express-validator
- Database (planned): MongoDB Atlas via Mongoose

## Project Structure

```
src/
   components/
   pages/
   App.jsx
   main.jsx
ballerleague-server/
   src/
      app.js
      server.js
      config/
         mongodb.js
      data/
         store.js
      middleware/
         validate.js
      routes/
         api.routes.js
      validators/
         *.validators.js
```

## Environment Variables

Create a `.env` file in `ballerleague-server`:

```
PORT=5000
MONGODB_URI=
```

`MONGODB_URI` is optional for now. If provided, the app attempts to connect to MongoDB Atlas.

## Run Locally

1. Install frontend dependencies

```bash
npm install
```

2. Install backend dependencies

```bash
cd ballerleague-server
npm install
```

3. Start backend

```bash
cd ballerleague-server
npm run dev
```

4. Start frontend

```bash
npm run dev
```

5. Build frontend

```bash
npm run build
```
