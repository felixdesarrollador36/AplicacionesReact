import { connectDb, disconnectDb } from '../config/db.js';
import {
  User,
  Transaction,
  Budget,
  Goal,
  Notification,
  PaymentReminder,
} from '../models/index.js';

const migrate = async () => {
  await connectDb();

  const models = [
    User,
    Transaction,
    Budget,
    Goal,
    Notification,
    PaymentReminder,
  ];

  for (const model of models) {
    await model.syncIndexes();
  }

  console.log('Migracion Mongo aplicada (colecciones e indices listos).');
};

migrate()
  .catch((error) => {
    console.error('Error en migracion Mongo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDb();
  });
