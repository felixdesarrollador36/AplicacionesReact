import cron from 'node-cron';
import dayjs from 'dayjs';
import { PaymentReminder } from '../models/index.js';
import { createNotification } from '../services/notificationService.js';

const shouldTriggerMonthly = (dueDate, currentDate) => {
  return dueDate.date() === currentDate.date();
};

export const startReminderJob = () => {
  cron.schedule('0 9 * * *', async () => {
    const today = dayjs();

    const reminders = await PaymentReminder.find({}).lean();

    for (const reminder of reminders) {
      const due = dayjs(reminder.dueDate);
      const lastTriggered = reminder.lastTriggered ? dayjs(reminder.lastTriggered) : null;

      if (lastTriggered && lastTriggered.isSame(today, 'day')) {
        continue;
      }

      const isOnceDue = reminder.frequency === 'once' && !today.isBefore(due, 'day');
      const isMonthlyDue =
        reminder.frequency === 'monthly' &&
        !today.isBefore(due, 'day') &&
        shouldTriggerMonthly(due, today);

      if (!isOnceDue && !isMonthlyDue) {
        continue;
      }

      const amountText = reminder.amount ? ` por ${Number(reminder.amount).toFixed(2)}` : '';
      await createNotification({
        userId: reminder.userId.toString(),
        type: 'payment_reminder',
        message: `Recordatorio: ${reminder.title}${amountText}`,
      });

      await PaymentReminder.updateOne(
        { _id: reminder._id },
        { $set: { lastTriggered: today.startOf('day').toDate() } },
      );
    }
  });
};
