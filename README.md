# MSSQL Database importer (dbi)
You need a quick approach to allow users importing lots of data from Excel oder CSV into a MSSQL database table? This tool may be what you are looking for.
- No need to install MSSQL Management Studio or write an application or configure complex optional datasources.
- Simple per-User-Control for allowing access.

## Technical overview
The database importer will use an sql authentication to connect to the database, and an NTLM authentication for the frontend. You will need to configure the following environment variables:
- DB_SERVER (database server name)
- DB_PORT (tcp port for connecting the server)
- DB_INSTANCE (optional instance name of the database server)
- DB_NAME (database name)
- DB_USER (database username)
- DB_PWD (database password)
- AUTH_MODE (use ntlm or leave blank)
- AUTH_TABLENAME (defaults to _Authorizations, table with two columns, username and allowed, that is used for authorizations of NTLM users to use the tool)
- LOCALE (defaults to en, de is also possible; sets frontend language and locale)
- ALLOWED_ORIGINS (comma-separated list of allowed browser origins for unsafe methods, for example https://dbi.intra.local)
- ORIGIN_PROTECTION_ENABLED (defaults to true in ntlm mode, false in none mode)
- CSRF_PROTECTION_ENABLED (defaults to true in ntlm mode, false in none mode)
- CSRF_SECRET (required in production when CSRF protection is enabled)
- WRITE_RATE_LIMIT_ENABLED (defaults to true in ntlm mode, false in none mode)
- WRITE_RATE_LIMIT_WINDOW_MS (defaults to 60000)
- WRITE_RATE_LIMIT_MAX_REQUESTS (defaults to 60)

With CSRF protection enabled, the backend returns a csrfToken in GET /api/v1/user. The bundled frontend sends this token as request header x-csrf-token on POST/PUT/PATCH/DELETE calls.

All API requests now use an x-request-id correlation id. The bundled frontend sends x-request-id with each API call. If another client sends x-request-id, it is reused. Otherwise, the backend generates one and returns it in the response header.

Structured audit logs are emitted for table import operations with requestId, userName, operation (preview/commit), schemaName, tableName, rowCount, rowsInserted and resultStatus (success, failed_validation, failed_internal).

### Column metadata contract (backend-neutral)
To keep the frontend decoupled from database vendors, `/api/v1/table/:schema/:table` can provide generic constraints per column.

The frontend primarily reads `constraints.logicalTypes` and additional constraint blocks. `typeInfo.allowedTypes` is still supported as legacy fallback.

Example:

```json
{
    "name": "Status",
    "isNullable": false,
    "hasDefaultValue": false,
    "constraints": {
        "logicalTypes": ["string"],
        "enumValues": ["new", "ready", "done"],
        "string": {
            "maxLength": 20
        },
        "extensions": {
            "rest": {
                "pattern": "^[a-z]+$"
            }
        }
    }
}
```

Supported generic keys:
- `logicalTypes`: one or more of `string`, `number`, `boolean`, `date`, `binary`
- `enumValues`: explicit allowed set for enum-like constraints
- `string`: `minLength`, `maxLength`
- `number`: `minimum`, `maximum`, `integer`, `precision`, `scale`
- `binary`: `maxBytes`
- `date`: format hint (`date`, `date-time`, `time`)
- `extensions`: open object for backend-specific metadata that should not break consumers

MSSQL-specific metadata (`dataType`, `characterData`, `numericData`) can still be included, but frontend validation and display should rely on `constraints` whenever available.

> Integration note: the OpenAPI schema for column metadata contains the generic `constraints` contract and examples for enum, length, range, and binary constraints in [openapi.yaml](openapi.yaml). This is the recommended contract for any non-MSSQL backend or custom data source.

The node http server inside the container will listen on port 8000. It is a good idea to use a reverse proxy with SSL inside your infrastructure.

### Example database script for auth table
    CREATE TABLE [dbo].[_Authorizations](
	    [Username] [nvarchar](50) NOT NULL,
	    [Allowed] [bit] NOT NULL,
        CONSTRAINT [PK__Authorizations] PRIMARY KEY CLUSTERED 
        (
            [Username] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    ) ON [PRIMARY];
    GO
    ALTER TABLE [dbo].[_Authorizations] ADD  CONSTRAINT [DF__Authorizations_Allowed]  DEFAULT ((0)) FOR [Allowed];
    GO

The user needs both SELECT and UPDATE privileges to the authorization table. The table will though never will be listed for import on frontend.

## Usage
After successfully connecting to the database, the frontend will check if the NTLM user is in the authorization table with "allowed" set to 1. Then it enumerates all schemas, the database user has tables in with write privilege. If it only finds one schema (which should be the case most times), it selects the schema.

After selecting the schema, all tables with write privilege to are enumerated. If selected, that column headers are displayed with additional information. The headers can be reordered per drag&drop.

Pressing Ctrl+V inserts clipboard content. If a table is found, it is inserted, and all values are checked for obvious errors. Column headers can still be moved, and if, the data stays in plays and a new validation starts.

If no obvious errors are found, the frontend sends data to the backend, validating for any errors. Rows with errors are marked with an exclamation mark. Hovering over it will display the errors.

If no errors occured during dry run, the "start import" button occurs, and pressing it will import all data. After that, the number of lines is displayed and the data is deleted.

Sounds complicated? Just try, it's quity simple to handle, and works with all kind of spreadsheet data on every operating system.

## Fast local browser testing (without Docker rebuild)
For day-to-day manual testing, run backend and frontend separately and proxy API calls from Angular dev server to backend.

1. Configure `backend/.env` for local development (for example set `AUTH_MODE=none` to skip NTLM during local tests).
2. Start backend:
    - cd backend
    - npm run dev:local
3. Start frontend in a second terminal:
    - cd frontend
    - npm run start
4. Open `http://localhost:4200`.

The frontend keeps hot-reloading in the browser, while requests to `/api/*` are forwarded to `http://localhost:8000`.
This avoids rebuilding container images for every UI change.

Note: `dev:local` only overrides `AUTH_MODE=none` for local browser testing. Production and container runs still use your configured `AUTH_MODE` from `.env`.
Note: the production and container build keep using relative API paths (`/api/v1`), so inside container/frontend-hosted mode requests still go to the same backend process as before.
Note: when running `npm run dev:local`, pressing Ctrl+C stops the backend process gracefully. Depending on your local watch runtime, you may still see a watcher status line afterwards; that does not indicate a backend error.

## Restrictions
- At the moment, the maximum row count for an import is 10,000 rows. If you have more data, just import it in chunks.
- Using the clipboard instead of uploading files is on purpose. Clipboard works with every operating system and every spreadsheet application, and there is no problem with file formats or malicious file contents.
- If you need different sets of accessible tables for different NTLM users, you'll have to use more container instances, since the configured database user's rights determines the tables you will see.
- If you want to access different databases, start a container instance for each one.
- There is no way to edit pasted data, so make sure you finished editing it before pasting.
- You cannot see what is inside the database table. The tool is not for displaying, just for importing.
- Trying to import SQL statements as cell data may result in errors due to protection settings.
- Column expecting binary data won't allow an import if they are not nullable.
- Each import is a transaction, so it will work all at once or won't work at all.

## Intranet hardening checklist
P1 (must-have)
- Enforce AUTH_MODE safety: disallow AUTH_MODE=none in production.
- Use origin allow list for unsafe methods (POST, PUT, PATCH, DELETE).
- Require anti-CSRF token for unsafe methods.
- Keep backend-internal error details out of 5xx API responses.
- Block direct access to the authorization table from import and metadata endpoints.

P2 (strongly recommended)
- Add rate limiting for write endpoints.
- Add structured audit logging for imports (user, schema, table, row count, request id).
- Add proxy-level security headers and strict TLS policy.
- Restrict DB user permissions to exact operational minimum.

P3 (nice-to-have)
- Optional per-origin rollout modes (monitor-only before enforce).
- Automated dependency and container image vulnerability scanning.
- Signed release process and deployment policy checks.

