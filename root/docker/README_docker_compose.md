# Docker Compose Environment Setup

This setup allows you to run the full database and backend stack comfortably using Docker.

## Services Included

1.  **Postgres (v15-alpine)**: Main database.
    -   Port: `5432`
    -   Host Data Mount: `./data` mapped to `/data_host` inside container.
2.  **pgAdmin 4**: Web-based database management UI.
    -   Port: `8080`
    -   Login: `admin@local` / `admin`
3.  **Backend**: Node.js API (builds from `./backend`).
    -   Port: `3001`

## Usage Instructions

### 1. Start Environment
```bash
docker compose up -d
```

### 2. Loading Data (Bulk Ingestion)
The `./data` directory on your host is mounted to `/data_host` inside the Postgres container.
To run the `COPY` command from within the container (faster/local):

1.  Place `dataset_for_copy.csv` in your host's `./data` folder.
2.  Connect to the container:
    ```bash
    docker exec -it postgres_db psql -U postgres
    ```
3.  Run the COPY command referencing the mounted path:
    ```sql
    \copy sales(...) FROM '/data_host/dataset_for_copy.csv' WITH (FORMAT csv, HEADER true, NULL '');
    ```

**Note on Trade-off**: Mounting `./data` to `/var/lib/postgresql/data` (for persistence) implies that your database files live in `./data`. Mounting it *also* to `/data_host` is a convenience hack so you don't need `docker cp`. In a strict production environment, you would separate raw data input folders from database storage volumes.

### 3. Accessing pgAdmin
- Open [http://localhost:8080](http://localhost:8080)
- Login with `admin@local` / `admin`.
- Add Server:
    - Host name/address: `postgres`
    - Port: `5432`
    - Maintenance database: `postgres`
    - Username: `postgres`
    - Password: `password`

## Security Note
The setup uses default passwords (`password`, `admin`). **Change these** in `docker-compose.yml` before deploying to any shared or production environment.
