import { serveNodeNext } from 'eve/next';
import agent from '../../../../agent/agent';

export const { GET, POST, PUT, DELETE, OPTIONS } = serveNodeNext({
  agent,
});
