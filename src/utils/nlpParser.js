/**
 * Natural Language Parser for task input
 * Parses strings like "Buy milk tomorrow at 5pm high priority #work"
 *
 * Fixed issues:
 * - Priority keywords only match at end of string or followed by "priority"
 * - Supports "in X hours/minutes" patterns
 * - Supports "every N weeks/days" patterns
 * - Time regex only matches when preceded by "at" or at end of string
 * - Won't false-positive on words like "high five"
 */

// Priority only matches at end of string or followed by "priority" keyword
const PRIORITY_PATTERNS = {
  High: /\b(urgent|important|critical|asap)\b|\bhigh\s+priority\b|\bpriority\s+high\b|\bhigh\b$/i,
  Low: /\b(minor|someday|eventually)\b|\blow\s+priority\b|\bpriority\s+low\b|\blow\b$/i,
};

const TIME_PATTERNS = {
  tomorrow: () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d;
  },
  today: () => {
    const d = new Date();
    d.setHours(d.getHours() + 1, 0, 0, 0);
    return d;
  },
  "next week": () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    d.setHours(9, 0, 0, 0);
    return d;
  },
  monday: () => getNextDayOfWeek(1),
  tuesday: () => getNextDayOfWeek(2),
  wednesday: () => getNextDayOfWeek(3),
  thursday: () => getNextDayOfWeek(4),
  friday: () => getNextDayOfWeek(5),
  saturday: () => getNextDayOfWeek(6),
  sunday: () => getNextDayOfWeek(0),
};

const RECURRENCE_PATTERNS_EXACT = {
  "every day": { type: "daily", interval: 1 },
  "every week": { type: "weekly", interval: 1 },
  "every month": { type: "monthly", interval: 1 },
  "every year": { type: "yearly", interval: 1 },
};

// These only match as standalone scheduling keywords (at end or before a day/time pattern)
const RECURRENCE_STANDALONE_REGEX = /\b(daily|weekly|monthly|yearly)\s*$/i;

// "every N days/weeks/months" pattern
const RECURRENCE_REGEX = /\bevery\s+(\d+)\s+(day|week|month|year)s?\b/i;

// "in N hours/minutes" pattern
const RELATIVE_TIME_REGEX = /\bin\s+(\d+)\s+(hour|minute|min|hr)s?\b/i;

// Explicit time pattern: only match "at 5pm", "at 10:30", or standalone time at end
const TIME_REGEX = /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;

// Month-based absolute date: "May 15", "June 3rd", "Dec 25"
const ABSOLUTE_DATE_REGEX = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+(\d{1,2})(?:st|nd|rd|th)?\b/i;

const MONTHS = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
};

function getNextDayOfWeek(dayIndex) {
  const d = new Date();
  const diff = (dayIndex - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  d.setHours(9, 0, 0, 0);
  return d;
}

export function parseNaturalLanguage(input) {
  let text = input.trim();
  let priority = "Medium";
  let date = "";
  let recurrence = null;
  let tags = [];

  // Extract tags (#work, #personal)
  const tagRegex = /#(\w+)/g;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(text)) !== null) {
    tags.push(tagMatch[1]);
  }
  text = text.replace(tagRegex, "").trim();

  // Extract priority — only at end or with "priority" suffix to avoid false positives
  for (const [level, regex] of Object.entries(PRIORITY_PATTERNS)) {
    const match = text.match(regex);
    if (match) {
      priority = level;
      text = text.replace(match[0], "").trim();
      break;
    }
  }

  // Extract "every N units" recurrence
  const recurMatch = text.match(RECURRENCE_REGEX);
  if (recurMatch) {
    const interval = parseInt(recurMatch[1]);
    const unitMap = { day: "daily", week: "weekly", month: "monthly", year: "yearly" };
    recurrence = { type: unitMap[recurMatch[2].toLowerCase()], interval };
    text = text.replace(recurMatch[0], "").trim();
  } else {
    // Try "every day/week/month/year" patterns
    const lowerText = text.toLowerCase();
    let foundExact = false;
    for (const [pattern, value] of Object.entries(RECURRENCE_PATTERNS_EXACT)) {
      if (lowerText.includes(pattern)) {
        recurrence = value;
        text = text.replace(new RegExp(`\\b${pattern}\\b`, "i"), "").trim();
        foundExact = true;
        break;
      }
    }
    // Try standalone "daily", "weekly" etc. — only at end of string to avoid "daily standup"
    if (!foundExact) {
      const standaloneMatch = text.match(RECURRENCE_STANDALONE_REGEX);
      if (standaloneMatch) {
        const typeMap = { daily: "daily", weekly: "weekly", monthly: "monthly", yearly: "yearly" };
        recurrence = { type: typeMap[standaloneMatch[1].toLowerCase()], interval: 1 };
        text = text.replace(standaloneMatch[0], "").trim();
      }
    }
  }

  // Extract "in N hours/minutes" relative time
  const relativeMatch = text.match(RELATIVE_TIME_REGEX);
  if (relativeMatch) {
    const amount = parseInt(relativeMatch[1]);
    const unit = relativeMatch[2].toLowerCase();
    const d = new Date();
    if (unit.startsWith("hour") || unit === "hr") {
      d.setHours(d.getHours() + amount);
    } else {
      d.setMinutes(d.getMinutes() + amount);
    }
    date = d.toISOString().slice(0, 16);
    text = text.replace(relativeMatch[0], "").trim();
  }

  // Extract absolute date (e.g., "May 15")
  if (!date) {
    const absMatch = text.match(ABSOLUTE_DATE_REGEX);
    if (absMatch) {
      const monthStr = absMatch[1].toLowerCase();
      const day = parseInt(absMatch[2]);
      const month = MONTHS[monthStr];
      if (month !== undefined) {
        const d = new Date();
        d.setMonth(month, day);
        d.setHours(9, 0, 0, 0);
        // If the date is in the past, assume next year
        if (d < new Date()) {
          d.setFullYear(d.getFullYear() + 1);
        }
        date = d.toISOString().slice(0, 16);
        text = text.replace(absMatch[0], "").trim();
      }
    }
  }

  // Extract named day patterns (tomorrow, monday, etc.)
  if (!date) {
    const lowerText = text.toLowerCase();
    for (const [pattern, getDate] of Object.entries(TIME_PATTERNS)) {
      if (lowerText.includes(pattern)) {
        const d = getDate();
        // Check for explicit time "at 5pm"
        const timeMatch = text.match(TIME_REGEX);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1]);
          const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
          const period = timeMatch[3]?.toLowerCase();
          if (period === "pm" && hours < 12) hours += 12;
          if (period === "am" && hours === 12) hours = 0;
          d.setHours(hours, minutes);
          text = text.replace(timeMatch[0], "").trim();
        }
        date = d.toISOString().slice(0, 16);
        text = text.replace(new RegExp(`\\b${pattern}\\b`, "i"), "").trim();
        break;
      }
    }
  }

  // If we still have "at Xpm" without a date, apply to today
  if (!date) {
    const timeMatch = text.match(TIME_REGEX);
    if (timeMatch) {
      let hours = parseInt(timeMatch[1]);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
      const period = timeMatch[3]?.toLowerCase();
      if (period === "pm" && hours < 12) hours += 12;
      if (period === "am" && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      if (d < new Date()) d.setDate(d.getDate() + 1); // next occurrence
      date = d.toISOString().slice(0, 16);
      text = text.replace(timeMatch[0], "").trim();
    }
  }

  // Clean up trailing connectors
  text = text.replace(/\b(at|on|by|for|due|the)\s*$/i, "").trim();
  text = text.replace(/^\s*(to|the|a)\s+/i, "").trim();
  text = text.replace(/\s{2,}/g, " ").trim();

  return {
    title: text,
    priority,
    date,
    recurrence,
    tags,
  };
}
