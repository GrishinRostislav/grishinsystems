export function addFrequency(date: Date, frequency: string, interval: number, daysOfWeek: number[] = [], monthsOfYear: number[] = []): Date {
  let next = new Date(date);
  let safeguard = 0;

  do {
    safeguard++;
    switch (frequency) {
      case 'DAILY':
        next.setDate(next.getDate() + interval);
        break;
      case 'WEEKLY':
        if (daysOfWeek && daysOfWeek.length > 0) {
          next.setDate(next.getDate() + 1);
          // If we rolled over to Sunday, apply the interval jump
          if (next.getDay() === 0 && interval > 1) {
            next.setDate(next.getDate() + (interval - 1) * 7);
          }
        } else {
          next.setDate(next.getDate() + 7 * interval);
        }
        break;
      case 'MONTHLY':
      case 'YEARLY':
        if (monthsOfYear && monthsOfYear.length > 0) {
          next.setMonth(next.getMonth() + 1);
          if (frequency === 'YEARLY' && next.getMonth() === 0 && interval > 1) {
             next.setFullYear(next.getFullYear() + (interval - 1));
          }
        } else {
          if (frequency === 'YEARLY') {
            next.setFullYear(next.getFullYear() + interval);
          } else {
            next.setMonth(next.getMonth() + interval);
          }
        }
        break;
      default:
        next.setMonth(next.getMonth() + interval);
    }

    let isValid = true;
    if (frequency === 'WEEKLY' && daysOfWeek && daysOfWeek.length > 0) {
      if (!daysOfWeek.includes(next.getDay())) isValid = false;
    }
    if ((frequency === 'MONTHLY' || frequency === 'YEARLY') && monthsOfYear && monthsOfYear.length > 0) {
      if (!monthsOfYear.includes(next.getMonth() + 1)) isValid = false;
    }

    if (isValid) break;
  } while (safeguard < 1000);

  return next;
}
