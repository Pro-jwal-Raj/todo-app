import { format, isToday, isTomorrow, isPast, addDays, addWeeks, addMonths, addYears, parseISO } from "date-fns";

export const formatTaskDate = (dateString) => {
  if (!dateString) return "No date";
  const date = parseISO(dateString);
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isTomorrow(date)) return `Tomorrow, ${format(date, "h:mm a")}`;
  return format(date, "MMM d, h:mm a");
};

export const isOverdue = (dateString, status) => {
  if (!dateString || status === "done") return false;
  return isPast(parseISO(dateString));
};

export const getNextRecurrence = (date, recurrence) => {
  if (!recurrence) return null;
  const baseDate = date ? parseISO(date) : new Date();
  switch (recurrence.type) {
    case "daily":
      return addDays(baseDate, recurrence.interval || 1).toISOString();
    case "weekly":
      return addWeeks(baseDate, recurrence.interval || 1).toISOString();
    case "monthly":
      return addMonths(baseDate, recurrence.interval || 1).toISOString();
    case "yearly":
      return addYears(baseDate, recurrence.interval || 1).toISOString();
    default:
      return null;
  }
};

export const formatRecurrence = (recurrence) => {
  if (!recurrence) return "";
  const { type, interval } = recurrence;
  if (interval === 1) {
    const labels = { daily: "Daily", weekly: "Weekly", monthly: "Monthly", yearly: "Yearly" };
    return labels[type] || type;
  }
  const units = { daily: "day", weekly: "week", monthly: "month", yearly: "year" };
  return `Every ${interval} ${units[type]}s`;
};
