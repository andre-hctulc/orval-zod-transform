#!/usr/bin/env node
import { Command } from "commander";
import { transform } from "./transform.js";
import { logWithLevel } from "./helpers.js";

const program = new Command();

program
    .name("orval-zod-transform")
    .description("CLI to transform generated Zod schemas from Orval")
    .version("1.0.0")
    .argument("<files...>", 'File patterns to transform (e.g., "src/**/*.ts" "lib/**/*.ts")')
    .option("-T --type-suffix <suffix>", "Suffix for inferred type exports", "Type")
    .option("-S --schema-suffix <suffix>", "Suffix for schema variable names", "Schema")
    .option("-L --log-level <level>", "Log level (e.g., info, debug, error)", "info")
    .action((files: string | string[], options) => {
        logWithLevel(options.logLevel, "info", "Transforming zod schemas...");

        try {
            transform(files, {
                typeSuffix: options.typeSuffix,
                schemaSuffix: options.schemaSuffix,
                logLevel: options.logLevel,
            });

            logWithLevel(options.logLevel, "info", "Transformed zod schemas!");
        } catch (error) {
            logWithLevel(options.logLevel, "error", "Error during zod schema transformation:", error);
            process.exit(1);
        }
    });

program.parse();
