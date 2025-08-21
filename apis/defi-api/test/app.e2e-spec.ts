import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Application (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /monitoring/health', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/monitoring/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body.status).toBe('healthy');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('providers');
        });
    });
  });

  describe('GET /monitoring/status', () => {
    it('should return detailed service status', () => {
      return request(app.getHttpServer())
        .get('/monitoring/status')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(['operational', 'degraded']).toContain(res.body.status);
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('totalRequests');
          expect(res.body).toHaveProperty('averageResponseTime');
          expect(res.body).toHaveProperty('providers');
          expect(res.body.providers).toHaveProperty('total');
          expect(res.body.providers).toHaveProperty('enabled');
          expect(res.body.providers).toHaveProperty('disabled');
          expect(res.body).toHaveProperty('recentErrors');
        });
    });
  });

  describe('GET /monitoring/metrics', () => {
    it('should return system metrics', () => {
      return request(app.getHttpServer())
        .get('/monitoring/metrics')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('totalRequests');
          expect(res.body).toHaveProperty('averageResponseTime');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('activeProviders');
        });
    });
  });

  describe('GET /monitoring/metrics/providers', () => {
    it('should return provider metrics', () => {
      return request(app.getHttpServer())
        .get('/monitoring/metrics/providers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('providers');
          expect(res.body.providers).toBeInstanceOf(Object);
        });
    });
  });

  describe('GET /monitoring/logs/transactions', () => {
    it('should return transaction logs', () => {
      return request(app.getHttpServer())
        .get('/monitoring/logs/transactions')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('logs');
          expect(res.body.logs).toBeInstanceOf(Array);
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/monitoring/logs/transactions?limit=5')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('logs');
          expect(res.body.logs).toBeInstanceOf(Array);
          expect(res.body.logs.length).toBeLessThanOrEqual(5);
        });
    });
  });

  describe('GET /monitoring/logs/errors', () => {
    it('should return error logs', () => {
      return request(app.getHttpServer())
        .get('/monitoring/logs/errors')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('logs');
          expect(res.body.logs).toBeInstanceOf(Array);
        });
    });

    it('should respect limit parameter', () => {
      return request(app.getHttpServer())
        .get('/monitoring/logs/errors?limit=3')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('logs');
          expect(res.body.logs).toBeInstanceOf(Array);
          expect(res.body.logs.length).toBeLessThanOrEqual(3);
        });
    });
  });

  describe('GET /swap/providers', () => {
    it('should return list of available providers', () => {
      return request(app.getHttpServer())
        .get('/swap/providers')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('providers');
          expect(res.body.providers).toBeInstanceOf(Array);
        });
    });
  });
});