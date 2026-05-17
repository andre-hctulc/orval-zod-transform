import { Project } from "ts-morph";
import { logWithLevel } from "./helpers.js";

interface TransformOptions {
    typeSuffix?: string;
    schemaSuffix?: string;
    logLevel?: string;
}

export function transform(
    inputGlob: string | string[],
    { typeSuffix, schemaSuffix, logLevel }: TransformOptions = {},
) {
    const project = new Project();

    project.addSourceFilesAtPaths(inputGlob);

    const schemaSuff = schemaSuffix ?? "Schema";
    const typeSuff = typeSuffix ?? "Type";

    for (const file of project.getSourceFiles()) {
        // Find zod import to determine the correct namespace
        const zodImport = file.getImportDeclaration((i) => i.getModuleSpecifierValue() === "zod");

        if (!zodImport) {
            logWithLevel(logLevel, "debug", `Skipping file: ${file.getBaseName()} (no zod import found)`);
            continue; // Skip files without zod imports
        }

        // Determine how zod is imported (zod., z., or destructured)
        const zodNamespace =
            zodImport.getNamespaceImport()?.getText() || zodImport.getDefaultImport()?.getText() || "z";

        logWithLevel(
            logLevel,
            "debug",
            `Processing file: ${file.getBaseName()} with zod namespace: ${zodNamespace}`,
        );

        const exportedVars = file.getVariableStatements().filter((v) => v.isExported());

        for (const statement of exportedVars) {
            for (const decl of statement.getDeclarations()) {
                const originalName = decl.getName();

                // Skip if already renamed
                if (originalName.endsWith(schemaSuff)) {
                    continue;
                }

                const initializer = decl.getInitializer();
                if (!initializer) {
                    continue;
                }

                const text = initializer.getText();

                // Only target zod schemas using flexible pattern matching
                const hasZodPattern =
                    text.includes(`${zodNamespace}.`) ||
                    text.includes("object(") ||
                    text.includes("string(") ||
                    text.includes("number(") ||
                    text.includes("array(") ||
                    text.includes("enum(");

                if (!hasZodPattern) {
                    continue;
                }

                const newSchemaName = `${originalName}${schemaSuff}`;

                // Rename variable (this updates references too)
                decl.rename(newSchemaName);
                logWithLevel(
                    logLevel,
                    "debug",
                    `Renamed ${originalName} to ${newSchemaName} in file: ${file.getBaseName()}`,
                );

                const newTypeName = `${originalName}${typeSuff}`;

                // Add inferred type if it doesn't exist and doesn't conflict
                const existingType = file.getTypeAlias(newTypeName);
                const existingDeclaration = file.getStatements().find(
                    (s) =>
                        (s.getKind() === 267 && (s as any).getName?.() === newTypeName) || // VariableStatement
                        (s.getKind() === 261 && (s as any).getName?.() === newTypeName) || // FunctionDeclaration
                        (s.getKind() === 262 && (s as any).getName?.() === newTypeName), // ClassDeclaration
                );

                if (!existingType && !existingDeclaration) {
                    file.addTypeAlias({
                        name: newTypeName,
                        isExported: true,
                        type: `${zodNamespace}.infer<typeof ${newSchemaName}>`,
                    });
                }
            }
        }
    }

    project.save();
}
