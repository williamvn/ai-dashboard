import { NotFoundException } from '@nestjs/common';
import { makeRun, makeValidation, resetRunSeq } from '../../test/fixtures/builders';
import { ORG_A, ORG_B, USER_A1, USER_B1 } from '../../test/fixtures/orgs';
import { makeStore } from '../../test/fixtures/store';
import { StoreService } from '../store/store.service';
import { OrganizationsService } from './organizations.service';

describe('OrganizationsService', () => {
  let store: StoreService;
  let service: OrganizationsService;

  beforeEach(() => {
    resetRunSeq();
    store = makeStore();
    service = new OrganizationsService(store);
  });

  describe('findAll', () => {
    it('returns every seeded organization', () => {
      expect(service.findAll()).toEqual([ORG_A, ORG_B]);
    });
  });

  describe('findUsers', () => {
    it('returns only users belonging to the requested organization', () => {
      const users = service.findUsers(ORG_A.id);
      const orgIds = new Set(users.map((u) => u.organizationId));
      expect(orgIds).toEqual(new Set([ORG_A.id]));
      expect(users).toHaveLength(3);
    });

    it('throws NotFoundException for an unknown organization', () => {
      expect(() => service.findUsers('missing')).toThrow(NotFoundException);
    });
  });

  describe('clearData', () => {
    it('removes the target org’s runs, validations, and aggregates, leaving other orgs untouched', () => {
      const runA = makeRun({ organizationId: ORG_A.id, userId: USER_A1.id });
      const runB = makeRun({ organizationId: ORG_B.id, userId: USER_B1.id });
      store.recordRun(runA);
      store.recordRun(runB);
      store.recordValidation(runA, makeValidation({ runId: runA.id, accepted: true }));

      const { runsRemoved } = service.clearData(ORG_A.id);

      expect(runsRemoved).toBe(1);
      expect(store.findRunById(runA.id)).toBeUndefined();
      expect(store.getOrgWindowStats(ORG_A.id)).toBeUndefined();
      expect(store.findRunById(runB.id)).toBeDefined();
      expect(store.getOrgWindowStats(ORG_B.id)!.totalCalls).toBe(1);
    });

    it('returns { runsRemoved: 0 } when the organization has no recorded runs', () => {
      expect(service.clearData(ORG_A.id)).toEqual({ runsRemoved: 0 });
    });

    it('throws NotFoundException for an unknown organization instead of silently clearing', () => {
      expect(() => service.clearData('missing')).toThrow(NotFoundException);
    });
  });
});
