import request from 'supertest';

import { app } from '../../app.js';
import { getLocale } from '../../utils/locales.function.js';
import { EnvironmentController } from '../../controllers/environment.controller.js';

const testSchemaName = 'test';
const testTableName = 'BoatExt_Authorizations';
const testRowPrefix = `rowtest_${Date.now()}_${Math.random().toString(36).slice(2)}`;

it('sends object with wrong data', async () => {
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({})
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 1', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].msg).toContain(getLocale(EnvironmentController.instance.locale).rowsIsNotAnArrayError);
});

it('sends an empty array', async () => {
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({ rows: [] })
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 2', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].msg).toContain(getLocale(EnvironmentController.instance.locale).rowNumberExceedsBoundariesError);
});

it('sends an array with unknown field', async () => {
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({
            rows: [{ Username: 'test', Allowed: false }],
            test: 'test',
        })
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 3', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].msg).toContain('Unknown field');
    expect(response.body.data.errors[0].fields[0].path).toContain('test');
});

it('sends an array with field name not in table', async () => {
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({ rows: [{ username: 'test', xAllowed: false }] })
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 4', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].msg).toContain(getLocale(EnvironmentController.instance.locale).columnIsNotPartOfTheTableError('xAllowed'));
});

it('sends an array with illegal field type', async () => {
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({ rows: [{ username: 'test', Allowed: 'string' }] })
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 5', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].msg).toContain(getLocale(EnvironmentController.instance.locale).typeIsNotAllowedForColumError('string', 'Allowed'));
});

it('sends an array with two identical objects', async () => {
    const duplicateName = `${testRowPrefix}_duplicate`;
    const response = await request(app).post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({
            rows: [
                { username: duplicateName, allowed: false },
                { username: duplicateName, allowed: false },
            ],
        })
        .expect(400)
        .expect('Content-Type', /json/);

    console.log('DEBUG RESPONSE 6', response.status, JSON.stringify(response.body));
    expect(response.body).toBeDefined();
    expect(response.body.message).toBeDefined();
    expect(response.body.message).toContain('Errors during import');
    expect(response.body.data).toBeDefined();
    expect(response.body.data.errors).toBeDefined();
    expect(response.body.data.errors.length).toBeDefined();
    expect(response.body.data.errors.length).toBe(1);
    expect(response.body.data.errors[0].row).toBe(1);
    expect(response.body.data.errors[0].msg).toContain('PRIMARY KEY');
});

it('sends an array with two valid objects', async () => {
    const firstName = `${testRowPrefix}_valid1`;
    const secondName = `${testRowPrefix}_valid2`;
    await request(app)
        .post(`/table/${testSchemaName}/${testTableName}`)
        .set('Accept', 'application/json')
        .send({
            rows: [
                { username: firstName, allowed: false },
                { username: secondName, allowed: false },
            ],
        })
        .expect(200);
});

jest.setTimeout(300000);
it('sends an array with a lot of valid objects', async () => {
    const rows: { username: string; allowed: boolean }[] = [];
    for (let i = 0; i < 1000; i++) {
        rows.push({ username: 'test' + i.toString(), allowed: true });
    }

    await request(app)
        .post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({ rows })
        .expect(200);
});
