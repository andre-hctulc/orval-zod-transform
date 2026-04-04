# orval-zod-transform

Transform generated Zod schemas from Orval

## Why?

We want to generate zod schemas and inferred types with different suffixes.
Orval does not support this for zod clients.

## Usage

```json
{
    "scripts": {
        "orval:gen": "orval && npx orval-zod-transform src/schemas/**/*.ts"
    }
}
```

This uses the default suffixes `Schema` and `Type`.

**Use custom suffixes**

```bash
npx orval-zod-transform src/schemas/**/*.ts --type-suffix Contract --schema-suffix Contract
```

## Help

```bash
npx orval-zod-transform --help
```
