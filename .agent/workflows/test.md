---
description: Run backend (pytest) and frontend (vitest) tests
---

1. Run backend API tests:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && pytest
```

2. Run backend tests with coverage report:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && pytest --cov=src/veriqko --cov-report=term-missing
```

3. Run frontend tests:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/web && npm test
```

4. Run frontend tests with coverage:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/web && npm test -- --coverage
```
