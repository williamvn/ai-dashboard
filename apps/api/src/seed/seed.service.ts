import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Organization, User } from '@repo/types';
import { StoreService } from '../store/store.service';

/**
 * Small first/last pools combined deterministically. Avoids hand-listing 150+
 * engineers for the two large orgs — iterate first names fastest so each
 * last-name "cohort" contains the full first-name set, yielding unique pairs
 * up to FIRST_NAMES.length * LAST_NAMES.length (100).
 */
const FIRST_NAMES = [
  'Alice', 'Ben', 'Chloe', 'Diego', 'Ella', 'Finn', 'Grace', 'Hugo', 'Isla', 'Jake',
];
const LAST_NAMES = [
  'Chen', 'Martinez', 'Smith', 'Lee', 'Johnson', 'Kim', 'Davis', 'Wilson', 'Taylor', 'Moore',
];

function generateEngineers(count: number): string[] {
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[Math.floor(i / FIRST_NAMES.length) % LAST_NAMES.length];
    out.push(`${first} ${last}`);
  }
  return out;
}

const ORGS: { id: string; name: string; engineers: string[] }[] = [
  {
    id: 'org-1',
    name: 'Acme Engineering',
    engineers: generateEngineers(50),
  },
  {
    id: 'org-2',
    name: 'Stellar Labs',
    engineers: generateEngineers(100),
  },
  {
    id: 'org-3',
    name: 'Nova Systems',
    engineers: [
      'Omar Nelson', 'Petra Carter', 'Quinn Mitchell', 'Rosa Perez', 'Seth Roberts',
      'Tara Turner', 'Uma Phillips', 'Victor Campbell', 'Wendy Parker', 'Xander Evans',
      'Yara Edwards', 'Zach Collins',
    ],
  },
  {
    id: 'org-4',
    name: 'Orbit Tech',
    engineers: [
      'Aaron Stewart', 'Bella Sanchez', 'Cole Morris', 'Diana Rogers', 'Ethan Reed',
      'Fiona Cook', 'George Morgan', 'Hannah Bell', 'Ian Murphy', 'Julia Bailey',
      'Kevin Rivera', 'Laura Cooper', 'Mason Richardson', 'Nora Cox', 'Oscar Ward',
      'Paige Torres', 'Ryan Peterson', 'Sophia Gray', 'Tyler Ramirez',
    ],
  },
  {
    id: 'org-5',
    name: 'Pulse Dev',
    engineers: [
      'Alexis James', 'Brandon Watson', 'Camila Brooks', 'Derek Kelly', 'Elena Sanders',
      'Felix Price', 'Gabrielle Bennett', 'Hassan Wood', 'Isabel Barnes', 'Julian Ross',
      'Kiara Henderson',
    ],
  },
];

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(private readonly store: StoreService) {}

  onModuleInit(): void {
    let userSeq = 1;

    for (const def of ORGS) {
      const org: Organization = {
        id: def.id,
        name: def.name,
        profilePicUrl: getOrganizationProfilePicUrl(def.name),
      };
      this.store.organizations.push(org);

      for (const name of def.engineers) {
        const user: User = {
          id: `user-${userSeq++}`,
          organizationId: def.id,
          name,
          profilePicUrl: getUserProfilePicUrl(name),
        };
        this.store.users.push(user);
      }
    }
  }
}

function getUserProfilePicUrl(userName: string): string {
  return `https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(userName)}`;
}

function getOrganizationProfilePicUrl(organizationName: string): string {
  return `https://api.dicebear.com/9.x/rings/svg?seed=${encodeURIComponent(organizationName)}`;
}
