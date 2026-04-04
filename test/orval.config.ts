import { defineConfig } from "orval";

const OPENAPI_SCHEMA_PATH = "petstore.yaml";

export default defineConfig({
    schemas: {
        input: OPENAPI_SCHEMA_PATH,
        output: {
            clean: true,
            mode: "tags-split",
            client: "zod",
            target: "./out",
            override: {
                zod: {},
            },
        },
    },
});
