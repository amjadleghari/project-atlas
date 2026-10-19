/**
 * Family colours: a validated categorical palette (CVD-safe in fixed order),
 * with separate steps for light and dark surfaces. Families are assigned slots
 * in alphabetical order and never cycle — a 9th+ family falls back to neutral
 * grey (its labelled box still identifies it).
 */
export const FAMILY_COLORS = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
const OTHER = { light: '#8a8984', dark: '#8a8984' };

export type Mode = 'light' | 'dark';

export function familyColor(index: number, mode: Mode): string {
  return FAMILY_COLORS[mode][index] ?? OTHER[mode];
}
