import request from 'supertest';

import { app } from '../app.js';

it('reports health', async () => {
    const response = await request(app)
        .get('/healthz')
        .expect(200)
        .expect('Content-Type', /json/);

    expect(response.body.status).toBe('ok');
    expect(response.body.uptime).toBeDefined();
});

it('reports readiness', async () => {
    const response = await request(app)
        .get('/readyz')
        .expect(200)
        .expect('Content-Type', /json/);

    expect(response.body.status).toBe('ready');
    expect(response.body.checks.database).toBe(true);
});