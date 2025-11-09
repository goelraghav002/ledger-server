import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an organization and default roles, and add the caller as org_owner.
   */
  async createOrg(dto: CreateOrgDto, user: any) {
    // create org + roles + membership in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          metadata: dto.metadata ? dto.metadata : undefined,
        },
      });

      // create default roles
      const ownerRole = await tx.role.create({
        data: { orgId: org.id, name: 'org_owner', description: 'Owner' },
      });
      const managerRole = await tx.role.create({
        data: { orgId: org.id, name: 'manager', description: 'Manager' },
      });
      const readonlyRole = await tx.role.create({
        data: { orgId: org.id, name: 'readonly', description: 'Read-only' },
      });

      // create membership for the creator as owner
      await tx.orgMembership.create({
        data: {
          orgId: org.id,
          userId: user.id,
          roleId: ownerRole.id,
        },
      });

      return {
        org,
        roles: { ownerRoleId: ownerRole.id, managerRoleId: managerRole.id, readonlyRoleId: readonlyRole.id },
      };
    });

    // After creation, return the created org and optionally updated org list for the user
    const memberships = await this.prisma.orgMembership.findMany({
      where: { userId: user.id },
      include: { org: true, role: true },
    });
    const orgs = memberships.map((m) => ({ id: m.orgId, name: m.org.name, roleId: m.roleId }));

    return { createdOrg: result.org, roles: result.roles, orgs };
  }
}