import request from 'supertest';

import { app } from '../../app';

it('gets columnames for table and schema from database', async () => {
    return request(app).get('/table/test/BoatExt_Budgets')
        .set('Accept', 'application/json')
        .send()
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
});

it('gets columnames for illegal table and schema from database', async () => {
    return request(app).get('/table/false/BoatExt_Budgets')
        .set('Accept', 'application/json')
        .send()
        .expect(400)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.data).toBeDefined();
            expect(response.body.data.errors).toBeDefined();
            expect(response.body.data.errors.length).toBe(1);
        });
});
