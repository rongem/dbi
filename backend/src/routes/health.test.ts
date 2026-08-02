import request from 'supertest';

import { app } from '../app.js';

it('reports health', async () => {
    const response = await request(app)
        .get('/api/v1/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.uptime).toBeDefined();
});

it('reports readiness', async () => {
    const response = await request(app)
        .get('/api/v1/readyz')
        .expect(200)
        .expect('Content-Type', /json/);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('ready');
    expect(response.body.data.checks.database).toBe(true);
});