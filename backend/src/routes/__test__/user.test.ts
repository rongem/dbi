import request from 'supertest';

import { app } from '../../app';

it('get authenticated user', async () => {
    return request(app).get('/user')
        .set('Accept', 'application/json')
        .send()
        .expect('Content-Type', /json/)
        .expect(200)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.databaseName).toBeDefined();
        });
});
