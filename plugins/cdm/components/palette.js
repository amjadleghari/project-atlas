"use strict";
exports.__esModule = true;
exports.familyColor = exports.FAMILY_COLORS = void 0;
/**
 * Family colours: a validated categorical palette (CVD-safe in fixed order),
 * with separate steps for light and dark surfaces. Families are assigned slots
 * in alphabetical order and never cycle — a 9th+ family falls back to neutral
 * grey (its labelled box still identifies it).
 */
exports.FAMILY_COLORS = {
    light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
    dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767']
};
var OTHER = { light: '#8a8984', dark: '#8a8984' };
function familyColor(index, mode) {
    var _a;
    return (_a = exports.FAMILY_COLORS[mode][index]) !== null && _a !== void 0 ? _a : OTHER[mode];
}
exports.familyColor = familyColor;
