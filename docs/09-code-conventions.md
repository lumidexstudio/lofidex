# Code Conventions

## Language & Style

- **Language**: TypeScript with strict mode
- **Module system**: CommonJS (`export =`)
- **TypeScript target**: ES2022
- **Naming**: PascalCase files, camelCase variables/functions
- **No ESLint/Prettier** configured

## TypeScript Configuration

```json
{
  "target": "ES2022",
  "module": "CommonJS",
  "strict": true,
  "moduleResolution": "Node10"
}
```

## Command Structure Pattern

```typescript
export = {
  name: string,
  description: string,
  aliases?: string[],
  cooldown?: number,
  category: string,
  execute(message, args, client): Promise<void>
};
```

## Event Handler Pattern

```typescript
export = {
  name: string,
  once?: boolean,
  execute(client, ...args): Promise<void>
};
```

## Best Practices

1. Use `async/await` for asynchronous operations
2. Add explicit type annotations
3. Use descriptive naming for variables and functions
4. Handle errors properly with try/catch blocks
5. Use embeds for Discord responses