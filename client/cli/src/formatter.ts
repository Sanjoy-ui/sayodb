import { RESPValue, RESPType } from "./protocol/parser.js";

// ANSI Color codes
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  gray: "\x1b[90m",
  bold: "\x1b[1m",
};

export function formatRESPValue(val: RESPValue | null, rawMode = false): string {
  if (val === null) {
    return rawMode ? "" : `${colors.gray}(nil)${colors.reset}\n`;
  }

  switch (val.type) {
    case RESPType.SimpleString:
      return rawMode ? `${val.value}\n` : `${colors.green}${val.value}${colors.reset}\n`;

    case RESPType.Error:
      return rawMode ? `${val.value}\n` : `${colors.red}(error) ${val.value}${colors.reset}\n`;

    case RESPType.Integer:
      return rawMode ? `${val.value}\n` : `${colors.cyan}(integer) ${val.value}${colors.reset}\n`;

    case RESPType.BulkString:
      if (val.value === null) {
        return rawMode ? "" : `${colors.gray}(nil)${colors.reset}\n`;
      }
      return rawMode ? `${val.value}\n` : `${colors.yellow}"${val.value}"${colors.reset}\n`;

    case RESPType.Array:
      if (val.value === null) {
        return rawMode ? "" : `${colors.gray}(nil)${colors.reset}\n`;
      }
      if (val.value.length === 0) {
        return rawMode ? "" : `${colors.gray}(empty array)${colors.reset}\n`;
      }

      let out = "";
      val.value.forEach((item, idx) => {
        const itemFormatted = formatRESPValue(item, rawMode).trimEnd();
        out += rawMode ? `${itemFormatted}\n` : `${colors.gray}${idx + 1})${colors.reset} ${itemFormatted}\n`;
      });
      return out;

    default:
      return `${String(val)}\n`;
  }
}
