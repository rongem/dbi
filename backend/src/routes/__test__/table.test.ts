import request from 'supertest';

import { app } from '../../app';

it('gets columnames for table and schema from database', async () => {
    return request(app).get('/table/test1/test2')
        .set('Accept', 'application/json')
        .send()
        .expect(200)
        .expect('Content-Type', /json/)
        .then(response => {
            expect(response.body).toBeDefined();
            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
});
