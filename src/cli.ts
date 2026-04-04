#!/usr/bin/env node
import { Command } from "commander";
import { transform } from "./transform.js";

const program = new Command();

program
    .name("orval-zod-transform")
    .description("CLI to transform generated Zod schemas from Orval")
    .version("1.0.0")
    .argument("<files...>", 'File patterns to transform (e.g., "src/**/*.ts" "lib/**/*.ts")')
    .option("-T --type-suffix <suffix>", "Suffix for inferred type exports", "Type")
    .option("-S --schema-suffix <suffix>", "Suffix for schema variable names", "Schema")
    .action((files: string | string[], options) => {
        try {
            transform(files, {
                typeSuffix: options.typeSuffix,
                schemaSuffix: options.schemaSuffix,
            });

            console.log("✅ Transformed zod schemas!");
        } catch (error) {
            console.error("❌ Error during zod schema transformation:", error);
            process.exit(1);
        }
    })
    .description("Transform generated schemas to add type exports and rename schema variables");

program.parse();
