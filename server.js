import express from 'express';
import routes from './routes';

const app = express();

app.use(routes);

const PORT = parseInt(process.env.PORT || 5000, 10);

app.listen(PORT);
