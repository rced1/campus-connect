const config = require('./config');

describe('GET /api/cc/config handler', () => {
  const original = { ...process.env };

  afterEach(() => {
    process.env = { ...original };
  });

  test('returns public config without secrets', () => {
    process.env.REACT_APP_SHARETRIBE_SDK_CLIENT_ID = 'client-public';
    process.env.REACT_APP_MARKETPLACE_ROOT_URL = 'http://localhost:3000';
    process.env.REACT_APP_MARKETPLACE_NAME = 'Campus Connect';
    process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY = 'pk_test_x';
    process.env.SHARETRIBE_SDK_CLIENT_SECRET = 'should-not-appear';

    const res = {
      headers: {},
      statusCode: 0,
      body: null,
      set(k, v) {
        this.headers[k] = v;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    config({}, res);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.clientId).toBe('client-public');
    expect(res.body.data.stripePublishableKey).toBe('pk_test_x');
    expect(JSON.stringify(res.body)).not.toContain('should-not-appear');
    expect(res.body.data.flags.chores).toBe(false);
  });
});
