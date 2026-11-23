import './src/config/loadEnv.js';
import { getJwtSecret } from './src/config/jwt.js';
import app from './app.js';

const PORT = process.env.PORT || 4000;

// Fail at startup if the JWT secret is missing or too short.
getJwtSecret();

app.listen(PORT, () => {
    console.log(`CivicEvents+ backend listening on port ${PORT}`);
});
