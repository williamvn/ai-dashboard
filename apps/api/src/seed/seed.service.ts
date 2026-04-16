import { Injectable, OnModuleInit } from '@nestjs/common';
import type { Organization, User } from '@repo/types';
import { StoreService } from '../store/store.service';

const ORGS: { id: string; name: string; engineers: string[] }[] = [
  {
    id: 'org-1',
    name: 'Acme Engineering',
    engineers: [
      'Alice Chen', 'Bob Martinez', 'Carol Smith', 'Dan Lee', 'Eve Johnson',
      'Frank Brown', 'Grace Kim', 'Hank Davis', 'Iris Wilson', 'Jack Taylor',
      'Karen Moore', 'Leo Anderson', 'Mia Thomas', 'Ned Jackson', 'Olivia White',
    ],
  },
  {
    id: 'org-2',
    name: 'Stellar Labs',
    engineers: [
      'Ava Harris', 'Ben Clark', 'Chloe Lewis', 'Diego Robinson', 'Ella Walker',
      'Finn Hall', 'Gina Allen', 'Hugo Young', 'Isla King', 'Jake Wright',
      'Lena Scott', 'Marco Green', 'Nina Adams',
    ],
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
      const org: Organization = { id: def.id, name: def.name };
      this.store.organizations.push(org);

      for (const name of def.engineers) {
        const user: User = {
          id: `user-${userSeq++}`,
          organizationId: def.id,
          name,
        };
        this.store.users.push(user);
      }
    }
  }
}
