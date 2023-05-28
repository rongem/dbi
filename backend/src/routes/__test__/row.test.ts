import request from 'supertest';

import { app } from '../../app';

it('sends object with wrong data', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
            expect(response.body.data.errors[0].msg).toContain('rows is not an array');
        });
});

it('sends an empty array', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [],
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
            expect(response.body.data.errors[0].msg).toContain('rows contains less than 1 oder more than 10000 items');
        });
});

it('sends an array with unknown field', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [{
                Username: 'test',
                Allowed: false
            }],
            test: 'test'
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
            expect(response.body.data.errors[0].msg).toContain('Unknown field');
            expect(response.body.data.errors[0].fields[0].path).toContain('test');
        });
});

it('sends an array with field name not in table', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [{
                username: 'test',
                xAllowed: false
            }],
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
            expect(response.body.data.errors[0].msg).toContain('Key names of row 0 are different from table');
        });
});

it('sends an array with illegal field type', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [{
                username: 'test',
                Allowed: 'string'
            }],
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
            expect(response.body.data.errors[0].msg).toContain('Type string is not allowed for column Allowed');
        });
});

it('sends an array with two identical objects', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [{
                username: 'test',
                allowed: false
            }, {
                username: 'test',
                allowed: false
            }],
        })
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.message).toBeDefined();
            expect(response.body.message).toContain('Error line 1');
        });
});

it('sends an array with two valid objects', async () => {
    return request(app).post('/table/test/BoatExt_Authorizations')
        .set('Accept', 'application/json')
        .send({
            rows: [{
                username: 'test',
                allowed: false
            }, {
                username: 'test1',
                allowed: false
            }],
        })
        .expect(200);
});
