import path from 'path';


beforeAll(async () => {
    expect(process.env.DB_USER).toBeDefined();
    expect(process.env.DB_PWD).toBeDefined();
    expect(process.env.DB_NAME).toBeDefined();
    expect(process.env.DB_SERVER).toBeDefined();
    // start database here
});

beforeEach(async () => {
    // reset all data in database
});

afterAll(async () => {
    // stop & disconnect database here
});
