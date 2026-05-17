import { log } from "console";

export function logWithLevel(currentLevel: string | undefined, level: string, ...message: string[]) {
    if (!currentLevel) {
        currentLevel = "info"; // Default log level
    }

    const levels = ["debug", "info", "error"];
    if (!levels.includes(level)) {
        level = "info";
    }

    if (levels.indexOf(currentLevel) > levels.indexOf(level)) {
        return; // Skip logging if current level is less severe than message level
    }

    const prefix = {
        debug: "🐛 [DEBUG]",
        info: "ℹ [INFO]",
        error: "❌ [ERROR]",
    }[level];

    log(prefix, ...message);
}
