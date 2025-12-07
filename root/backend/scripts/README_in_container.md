# In-Container Data Ingestion

This guide explains how to use the `copy_into_postgres.sh` script to import data efficiently when running Postgres in a Docker container.

## Why run inside the container?
Running the `COPY` command from within the container (via `docker exec`) avoids network overhead if the file is mounted directly to the container's filesystem. This is ideal for large datasets (e.g., 1M+ rows).

## Prerequisites
1.  **Docker Container Running**: Ensure your Postgres container is up (e.g., `postgres_db`).
2.  **Mount Access**: The host folder containing the CSV must be mounted to the container.
    -   In our `docker-compose.yml`, `./data` is mounted to `/data_host`.
    -   Ensure `dataset_for_copy.csv` is present in `./data` on the host.

## Usage

### 1. Connect and Run (One-Liner)

You can execute the script directly via `docker exec`:

```bash
docker exec -it postgres_db bash /data_host/../backend/scripts/copy_into_postgres.sh --file /data_host/dataset_for_copy.csv --yes
```

*Note: The path `/data_host/../backend/scripts/...` depends on how you mounted your volumes. If you only mounted `/data_host`, you might need to copy the script there first or mount the `backend` folder as well.*

**Recommended Approach (if backend is not mounted in DB container):**
1.  Copy the script to the data folder on host: `cp backend/scripts/copy_into_postgres.sh data/`
2.  Run inside container:
    ```bash
    docker exec -it postgres_db bash /data_host/copy_into_postgres.sh --file /data_host/dataset_for_copy.csv --yes
    ```

### 2. Interactive Shell

1.  Enter the container:
    ```bash
    docker exec -it postgres_db bash
    ```
2.  Navigate to the mounted data directory:
    ```bash
    cd /data_host
    ```
3.  Run the script (assuming you copied it here or it's mounted):
    ```bash
    bash copy_into_postgres.sh
    ```

## Troubleshooting

-   **Permission Denied**: Ensure the CSV file is readable by the `postgres` user inside the container (UID 70/999 usually). `chmod 644 data/dataset_for_copy.csv` on the host usually fixes this.
-   **File Not Found**: Check your `docker-compose.yml` volumes. Ensure `./data:/data_host` is correct.
-   **Encoding Errors**: Postgres expects UTF-8 by default. If your CSV is different, add `ENCODING 'LATIN1'` (or relevant) to the `COPY` command arguments in the script.

## Client-Side Alternative
If you prefer not to mount volumes, you can use `\copy` (client-side) from your host machine:

```bash
# Requires psql installed on host
export PGPASSWORD=password
psql -h localhost -U postgres -d postgres -c "\copy sales(...) FROM 'backend/data/dataset_for_copy.csv' WITH CSV HEADER"
```
