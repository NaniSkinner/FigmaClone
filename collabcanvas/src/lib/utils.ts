import { USER_COLORS } from "./constants";

/**
 * Generate a consistent color for a user based on their ID
 */
export const generateUserColor = (userId: string): string => {
  const hash = userId.split("").reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
};

/**
 * Throttle function to limit how often a function can be called
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Generate a random name for anonymous users
 */
export const generateAnonymousName = (): string => {
  const adjectives = ["Swift", "Brave", "Clever", "Bright", "Quick", "Bold"];
  const nouns = ["Fox", "Eagle", "Wolf", "Bear", "Lion", "Tiger"];
  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
};
