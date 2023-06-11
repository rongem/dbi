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

# Container
You'll find the docker container on docker hub at https://hub.docker.com/r/rongem/dbi
