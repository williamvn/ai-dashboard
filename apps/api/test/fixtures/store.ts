import { StoreService } from '../../src/store/store.service';
import { TEST_AGENTS } from './agents';
import { TEST_ORGS, TEST_USERS } from './orgs';

/**
 * Build a StoreService pre-populated with the shared test orgs, users, and
 * agents. Runs and validations are NOT seeded — callers record what their
 * assertions depend on so each test stays explicit about its fixture.
 */
export function makeStore(): StoreService {
  const store = new StoreService();
  store.organizations.push(...TEST_ORGS);
  store.users.push(...TEST_USERS);
  store.agents.push(...TEST_AGENTS);
  return store;
}
