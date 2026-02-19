---
description: Start the FastAPI backend development server
---

// turbo-all

1. Activate the virtual environment and start the API server with hot-reload:
```bash
cd /home/rickard/Development/Veriqko/Veriqko/apps/api && source .venv/bin/activate && uvicorn src.veriqko.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at http://localhost:8000
API docs (Swagger UI) at http://localhost:8000/docs
