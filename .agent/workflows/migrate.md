---
description: Run Alembic database migrations for the API
---

1. Activate the virtual environment:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate
```

2. Generate a new migration (replace "description" with a short description of the change):
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && alembic revision --autogenerate -m "description"
```

3. Review the generated migration file in `alembic/versions/` before applying it.

// turbo
4. Apply all pending migrations:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && alembic upgrade head
```

5. To roll back the last migration:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && alembic downgrade -1
```

6. To check current migration status:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && alembic current
```
