import { Project } from "ts-morph";

interface TransformOptions {
    typeSuffix?: string;
    schemaSuffix?: string;
}

export function transform(inputGlob: string | string[], { typeSuffix, schemaSuffix }: TransformOptions = {}) {
    const project = new Project();

    project.addSourceFilesAtPaths(inputGlob);

    console.log("Transforming generated schemas...");

    const schemaSuff = schemaSuffix ?? "Schema";
    const typeSuff = typeSuffix ?? "Type";

    for (const file of project.getSourceFiles()) {
        // Find zod import to determine the correct namespace
        const zodImport = file.getImportDeclaration((i) => i.getModuleSpecifierValue() === "zod");

        if (!zodImport) continue; // Skip files without zod imports

        // Determine how zod is imported (zod., z., or destructured)
        const zodNamespace =
            zodImport.getNamespaceImport()?.getText() || zodImport.getDefaultImport()?.getText() || "z";

        const exportedVars = file.getVariableStatements().filter((v) => v.isExported());

        for (const statement of exportedVars) {
            for (const decl of statement.getDeclarations()) {
                const originalName = decl.getName();

                // Skip if already renamed
                if (originalName.endsWith(schemaSuff)) continue;

                const initializer = decl.getInitializer();
                if (!initializer) continue;

                const text = initializer.getText();

                // Only target zod schemas using flexible pattern matching
                const hasZodPattern =
                    text.includes(`${zodNamespace}.`) ||
                    text.includes("object(") ||
                    text.includes("string(") ||
                    text.includes("number(") ||
                    text.includes("array(");

                if (!hasZodPattern) continue;

                const schemaName = `${originalName}${schemaSuff}`;

                // Rename variable (this updates references too)
                decl.rename(schemaName);

                const typeAliasName = `${originalName}${typeSuff}`;

                // Add inferred type if it doesn't exist and doesn't conflict
                const existingType = file.getTypeAlias(typeAliasName);
                const existingDeclaration = file.getStatements().find(
                    (s) =>
                        (s.getKind() === 267 && (s as any).getName?.() === typeAliasName) || // VariableStatement
                        (s.getKind() === 261 && (s as any).getName?.() === typeAliasName) || // FunctionDeclaration
                        (s.getKind() === 262 && (s as any).getName?.() === typeAliasName), // ClassDeclaration
                );

                if (!existingType && !existingDeclaration) {
                    file.addTypeAlias({
                        name: typeAliasName,
                        isExported: true,
                        type: `${zodNamespace}.infer<typeof ${schemaName}>`,
                    });
                }
            }
        }
    }

    project.save();
}
