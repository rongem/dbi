docker run --env-file=backend/.env --env=DB_SERVER=host.docker.internal -p 8000:8000 -d rongem/dbi:latest
