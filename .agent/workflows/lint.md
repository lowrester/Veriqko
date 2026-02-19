---
description: Lint and format the codebase (backend with ruff, frontend with eslint)
---

// turbo-all

1. Lint and auto-fix the backend Python code with ruff:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && ruff check src/ --fix && ruff format src/
```

2. Type-check the backend with mypy:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && mypy src/
```

3. Lint the frontend TypeScript/React code:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/web && npm run lint
```

4. Type-check the frontend:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/web && npx tsc --noEmit
```
