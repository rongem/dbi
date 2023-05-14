import request from 'supertest';

import { app } from '../../app';

it('get all table names from the database', async () => {
    return request(app).get('/tables')
        .set('Accept', 'application/json')
        .send()
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
})
