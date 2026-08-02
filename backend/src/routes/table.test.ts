import request from 'supertest';

import { app } from '../app.js';

it('gets columnames for table and schema from database', async () => {
    const response = await request(app)
        .get('/api/v1/table/test/BoatExt_Budgets')
        .set('Accept', 'application/json')
        .send()
        .expect(200)
        .expect('Content-Type', /json/);

    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();
    expect(response.body.data.length).toBeGreaterThanOrEqual(1);
});

it('gets columnames for illegal table and schema from database', async () => {
    const response = await request(app)
        .get('/api/v1/table/false/BoatExt_Budgets')
        .set('Accept', 'application/json')
        .send()
        .expect(400)
        .expect('Content-Type', /json/);

    expect(response.body).toBeDefined();
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBeDefined();
    expect(response.body.error.details).toBeDefined();
    expect(response.body.error.details.errors).toBeDefined();
    expect(response.body.error.details.errors.length).toBe(1);
});
