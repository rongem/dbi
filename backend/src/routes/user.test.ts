import request from 'supertest';

import { app } from '../app.js';

it('get authenticated user', async () => {
    const response = await request(app)
        .get('/api/v1/user')
        .set('Accept', 'application/json')
        .send()
        .expect('Content-Type', /json/)
        .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.databaseName).toBeDefined();
});
