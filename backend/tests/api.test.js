import { jest } from '@jest/globals';

// ESM-aware module mocking
const mockCreateUser = jest.fn();
const mockVerifyUser = jest.fn();
const mockFindUserByUsername = jest.fn();
const mockGetShelters = jest.fn();

const mockFind = jest.fn();
const mockFindById = jest.fn();

await jest.unstable_mockModule('../services/userService.js', () => ({
  createUser: mockCreateUser,
  verifyUser: mockVerifyUser,
  findUserByUsername: mockFindUserByUsername,
}));

await jest.unstable_mockModule('../services/shelterService.js', () => ({
  getShelters: mockGetShelters,
}));

await jest.unstable_mockModule('../models/Route.js', () => ({
  Route: {
    find: mockFind,
    findById: mockFindById,
  }
}));

const { default: app } = await import('../app.js');
const { registerRoutes } = await import('../route.js');
const request = (await import('supertest')).default;

beforeAll(async () => {
  // Register routes onto the test app (mocks are in place)
  await registerRoutes(app);
});

beforeEach(() => {
  mockCreateUser.mockReset();
  mockVerifyUser.mockReset();
  mockFindUserByUsername.mockReset();
  mockGetShelters.mockReset();
  mockFind.mockReset();
  mockFindById.mockReset();
});

describe('Backend API (mocked services/models)', () => {

     test('POST /api/users/login returns 200 and user object when verifyUser succeeds', async () => {
    // Make verifyUser return a user-like object
    mockVerifyUser.mockImplementation(async (username, password) => ({ _id: '622222222222222222222222', username }));

    const payload = { username: 'bob', password: 'hunter2' };
    const res = await request(app).post('/api/users/login').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', 'bob');
  });

  test('GET /api/routes returns 200 and an array when DB empty', async () => {
    // mock Route.find().select(...).lean() chain
    mockFind.mockImplementation(() => ({ select: () => ({ lean: () => Promise.resolve([]) }) }));

    const res = await request(app).get('/api/routes');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('routes');
    expect(Array.isArray(res.body.routes)).toBe(true);
  });
    test('POST /api/users returns 200 and user object when createUser succeeds', async () => {
    // Make createUser return a user-like object
    mockCreateUser.mockImplementation(async (username, password, emergencyEmail) => ({ _id: '611111111111111111111111', username, emergencyEmail }));

    const payload = { username: 'alice', password: 'secret', emergencyEmail: 'alice@example.com' };
    const res = await request(app).post('/api/users').send(payload);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('username', 'alice');
  });

  test('POST /api/users returns 400 when missing fields', async () => {
    const res = await request(app).post('/api/users').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/users/login returns 400 when missing fields', async () => {
    const res = await request(app).post('/api/users/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('GET /api/shelters returns 400 when lat/lon missing', async () => {
    const res = await request(app).get('/api/shelters');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });


  test('GET /api/routes/:id returns 404 for non-existent id', async () => {
    mockFindById.mockImplementation(() => ({ lean: () => Promise.resolve(null) }));
    const res = await request(app).get('/api/routes/000000000000000000000000');
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('error');
  });



 
});
