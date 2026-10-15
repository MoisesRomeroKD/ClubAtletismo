import assert from 'node:assert/strict';
import test, { beforeEach } from 'node:test';
import axios, { AxiosError } from 'axios';

const storage = new Map();
const dispatchedEvents = [];

globalThis.localStorage = {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: (key) => storage.delete(key),
};

globalThis.window = {
    dispatchEvent: (event) => {
        dispatchedEvents.push(event.type);
        return true;
    },
};

const { default: podApi } = await import('./podApi.js');

const response = (config, data, status = 200) => ({
    config,
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Unauthorized',
    headers: {},
});

const unauthorized = (config) => Promise.reject(new AxiosError(
    'Unauthorized',
    'ERR_BAD_REQUEST',
    config,
    null,
    response(config, { detail: 'Unauthorized' }, 401),
));

const setAdapter = (adapter) => {
    podApi.defaults.adapter = adapter;
    axios.defaults.adapter = adapter;
};

beforeEach(() => {
    storage.clear();
    dispatchedEvents.length = 0;
    storage.set('token', 'expired-access');
    storage.set('refresh_token', 'valid-refresh');
    storage.set('user_role', 'admin');
});

test('renews an expired access token and retries the request once', async () => {
    let protectedAttempts = 0;
    let refreshAttempts = 0;

    setAdapter(async (config) => {
        if (config.url.includes('/token/refresh/')) {
            refreshAttempts += 1;
            return response(config, { access: 'new-access' });
        }

        protectedAttempts += 1;
        if (config.headers.Authorization !== 'Bearer new-access') {
            return unauthorized(config);
        }
        return response(config, { ok: true });
    });

    const result = await podApi.get('/v1/users/permisos/mios/');

    assert.deepEqual(result.data, { ok: true });
    assert.equal(storage.get('token'), 'new-access');
    assert.equal(refreshAttempts, 1);
    assert.equal(protectedAttempts, 2);
    assert.deepEqual(dispatchedEvents, []);
});

test('shares one refresh between concurrent failed requests', async () => {
    let refreshAttempts = 0;
    const protectedAttempts = new Map();
    let releaseRefresh;
    let notifyRefreshStarted;
    const refreshGate = new Promise((resolve) => {
        releaseRefresh = resolve;
    });
    const refreshStarted = new Promise((resolve) => {
        notifyRefreshStarted = resolve;
    });

    setAdapter(async (config) => {
        if (config.url.includes('/token/refresh/')) {
            refreshAttempts += 1;
            notifyRefreshStarted();
            await refreshGate;
            return response(config, { access: 'new-access' });
        }

        const attempts = (protectedAttempts.get(config.url) || 0) + 1;
        protectedAttempts.set(config.url, attempts);
        if (config.headers.Authorization !== 'Bearer new-access') {
            return unauthorized(config);
        }
        return response(config, { ok: true });
    });

    const requests = [
        podApi.get('/protected/first/'),
        podApi.get('/protected/second/'),
    ];
    await refreshStarted;
    releaseRefresh();
    const results = await Promise.all(requests);

    assert.equal(refreshAttempts, 1);
    assert.deepEqual([...protectedAttempts.values()], [2, 2]);
    assert.deepEqual(results.map(({ data }) => data.ok), [true, true]);
    assert.deepEqual(dispatchedEvents, []);
});

test('reuses a refreshed token when another old-token 401 arrives late', async () => {
    let refreshAttempts = 0;
    let lateAttempts = 0;
    let finishFirstRetry;
    const firstRetryFinished = new Promise((resolve) => {
        finishFirstRetry = resolve;
    });

    setAdapter(async (config) => {
        if (config.url.includes('/token/refresh/')) {
            refreshAttempts += 1;
            return response(config, { access: 'new-access' });
        }

        if (config.url === '/protected/late/') {
            lateAttempts += 1;
            if (config.headers.Authorization !== 'Bearer new-access') {
                await firstRetryFinished;
                return unauthorized(config);
            }
            return response(config, { ok: true });
        }

        if (config.headers.Authorization !== 'Bearer new-access') {
            return unauthorized(config);
        }
        finishFirstRetry();
        return response(config, { ok: true });
    });

    const results = await Promise.all([
        podApi.get('/protected/first/'),
        podApi.get('/protected/late/'),
    ]);

    assert.equal(refreshAttempts, 1);
    assert.equal(lateAttempts, 2);
    assert.deepEqual(results.map(({ data }) => data.ok), [true, true]);
    assert.deepEqual(dispatchedEvents, []);
});

test('expires the session when refresh fails', async () => {
    let protectedAttempts = 0;
    let refreshAttempts = 0;

    setAdapter(async (config) => {
        if (config.url.includes('/token/refresh/')) {
            refreshAttempts += 1;
            return unauthorized(config);
        }
        protectedAttempts += 1;
        return unauthorized(config);
    });

    await assert.rejects(podApi.get('/protected/'));

    assert.equal(refreshAttempts, 1);
    assert.equal(protectedAttempts, 1);
    assert.deepEqual(dispatchedEvents, ['auth:session-expired']);
});

test('does not refresh or expire the session for a login 401', async () => {
    let attempts = 0;
    setAdapter(async (config) => {
        attempts += 1;
        return unauthorized(config);
    });

    await assert.rejects(podApi.post('/v1/auth/login/', {}));

    assert.equal(attempts, 1);
    assert.deepEqual(dispatchedEvents, []);
    assert.equal(storage.get('token'), 'expired-access');
});

test('does not start another refresh after the single retry fails', async () => {
    let protectedAttempts = 0;
    let refreshAttempts = 0;

    setAdapter(async (config) => {
        if (config.url.includes('/token/refresh/')) {
            refreshAttempts += 1;
            return response(config, { access: 'new-access' });
        }
        protectedAttempts += 1;
        return unauthorized(config);
    });

    await assert.rejects(podApi.get('/protected/'));

    assert.equal(refreshAttempts, 1);
    assert.equal(protectedAttempts, 2);
    assert.deepEqual(dispatchedEvents, ['auth:session-expired']);
});