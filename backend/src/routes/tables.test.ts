import request from 'supertest';

import { app } from '../../app.js';

it('get all table names from the database', async () => {
    const response = await request(app)
        .get('/tables')
        .set('Accept', 'application/json')
        .send()
        .expect('Content-Type', /json/)
        .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.length).toBeGreaterThanOrEqual(1);
});
