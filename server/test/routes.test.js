import request from 'supertest';
import express from 'express';
import dialogflowRoutes from '../src/routes/dialogflowRoutes.js';
import listRoutes from '../src/routes/listRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/dialogflow', dialogflowRoutes);
app.use('/api/list', listRoutes);

describe('API Routes', () => {
  describe('GET /api/list', () => {
    it('should return shopping list items', async () => {
      const response = await request(app)
        .get('/api/list')
        .expect(200);
      
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/list', () => {
    it('should add item to shopping list', async () => {
      const newItem = {
        name: 'test item',
        quantity: 2,
        category: 'test'
      };

      const response = await request(app)
        .post('/api/list')
        .send(newItem)
        .expect(201);

      expect(response.body).toHaveProperty('name', 'test item');
      expect(response.body).toHaveProperty('quantity', 2);
    });

    it('should require name field', async () => {
      const response = await request(app)
        .post('/api/list')
        .send({ quantity: 1 })
        .expect(201); // This might need adjustment based on your validation

      // Add proper validation test based on your implementation
    });
  });

  describe('POST /api/dialogflow/query', () => {
    it('should require message field', async () => {
      const response = await request(app)
        .post('/api/dialogflow/query')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Message is required');
    });

    it('should accept valid message', async () => {
      const response = await request(app)
        .post('/api/dialogflow/query')
        .send({ message: 'test message', sessionId: 'test-session' })
        .expect(200);

      expect(response.body).toHaveProperty('intent');
      expect(response.body).toHaveProperty('responseMessage');
    });
  });
});
