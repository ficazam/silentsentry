export const hasItBeenADay = (now = new Date()): Date =>
  new Date(now.getTime() - 24 * 60 * 60 * 1000);
