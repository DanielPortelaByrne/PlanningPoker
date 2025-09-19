# PlanningPoker

A collaborative planning poker tool for Agile teams.

## Features

- Real-time session creation and joining
- User voting with Fibonacci sequence cards
- Spectator mode
- User event logging (session, voting, actions) to a local SQLite database

## Getting Started (Local Development)

### Prerequisites

- Node.js (v16+ recommended)
- npm

### Install dependencies

From the project root:

```sh
npm install
```

Then install dependencies for both client and server:

```sh
cd client
npm install

cd ../server
npm install
```

### Start the app locally

Open two terminals:

**Terminal 1 (Server):**
```sh
cd server
npm start
```

**Terminal 2 (Client):**
```sh
cd client
npm start
```

- Client runs at [http://localhost:3000](http://localhost:3000)
- Server runs at [http://localhost:4000](http://localhost:4000)

### User Event Logging

- All user actions (session creation, joining, voting, etc.) are logged to a local SQLite database (`server/userlogs.db`).
- You can view logs using a SQLite browser or VS Code SQLite extension.

#### View logs in VS Code

1. Install a SQLite extension (e.g., "SQLite Viewer").
2. Open `server/userlogs.db` in VS Code.
3. Browse the `user_logs` table for user events.

#### View logs via command line

```sh
cd server
sqlite3 userlogs.db
SELECT * FROM user_logs;
```

## Deployment (Heroku)

1. Commit your changes:
    ```sh
    git add .
    git commit -m "Add user event logging to SQLite"
    ```

2. Push to Heroku:
    ```sh
    git push heroku main
    ```
    *(or `git push heroku master` if your branch is named `master`)*

### Important Notes About Production Logging

- The SQLite database (`userlogs.db`) is stored on the Heroku dyno and is **ephemeral**. It will be reset on dyno restarts or redeploys.
- To view logs in production:
    - Use `heroku run bash` and query with `sqlite3 userlogs.db`
    - **Logs are not persistent**. For reliable production logging, use a managed database (e.g., Heroku PostgreSQL).

## Switching Between Local and Production

- In `client/src/App.js`, update the socket connection URL:
    - Local: `const socket = io("http://localhost:4000");`
    - Production: `const socket = io("https://planning-poker-pointing-9f9b8406bb5e.herokuapp.com/");`

## Troubleshooting

- If logging does not work, check:
    - The client is pointing to the correct server URL.
    - The server console for errors.
    - The database file exists and is being updated.

## License

MIT
