import { initBotId } from 'botid/client/core';

initBotId({
  protect: [{ path: '/api/customers/subscribe', method: 'POST' }],
});
