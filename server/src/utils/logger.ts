import pino, { LoggerOptions } from "pino";

const loggerOptions: LoggerOptions = {
  name: "sayoDB",
  level: process.env.LOG_LEVEL || "info",
};

if (process.env.NODE_ENV !== "production") {
  loggerOptions.transport = {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "SYS:HH:MM:ss.l",
      ignore: "pid,hostname",
    },
  };
}

export const logger = pino(loggerOptions);

