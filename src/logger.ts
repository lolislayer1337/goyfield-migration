import path from "node:path";
import winston, { format } from "winston";

const consoleFormat = winston.format.combine(
    format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    format.printf(({ timestamp, level, message }) => {
        const coloredTimestamp = format.colorize().colorize(level, `${timestamp}`);

        const coloredLevel = format.colorize().colorize(level, `[${level.toUpperCase()}]`);

        return `${coloredTimestamp} ${coloredLevel} ${message}`;
    })
);

const fileFormat = winston.format.combine(
    format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss.SSS",
    }),
    format.printf(({ timestamp, level, message }) => {
        return `${timestamp} ${level.toUpperCase()} ${message}`;
    })
);

export const logger = winston.createLogger({
    levels: winston.config.npm.levels,
    level: "debug",
    silent: false,
    transports: [
        new winston.transports.Console({
            format: consoleFormat
        }),
        new winston.transports.File({
            filename: path.join(process.cwd(), "logs/file.log"),
            format: fileFormat
        })
    ]
});
