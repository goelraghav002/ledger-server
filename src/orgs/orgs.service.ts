import { Injectable, BadRequestException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrgDto } from './dto/create-org.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrgsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create an organization and default roles, and add the caller as org_owner.
   * Validates slug uniqueness and basic DTO constraints, maps DB errors to HTTP errors.
   */
  async createOrg(dto: CreateOrgDto, user: any) {
    // Basic server-side validation (supplement DTO checks)
    if (!dto?.name || String(dto.name).trim().length === 0) {
      throw new BadRequestException('Organization name is required');
    }

    // optional: normalize slug if provided
    let slug: string | undefined = undefined;
    if (dto.slug) {
      slug = String(dto.slug).trim();
      // simple slug validation; keep consistent with DTO regex
      if (!/^[a-z0-9-]+$/.test(slug)) {
        throw new BadRequestException('slug may contain lowercase letters, numbers and hyphens only');
      }
    }

    // verify caller exists (defensive)
    const caller = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!caller) throw new NotFoundException('Requesting user not found');

    try {
      // check slug uniqueness if provided (use tx to avoid race conditions if necessary)
      if (slug) {
        const existing = await this.prisma.organization.findUnique({ where: { slug } });
        if (existing) {
          throw new ConflictException('Organization slug already taken');
        }
      }

      // create org + roles + membership in a transaction
      const result = await this.prisma.$transaction(async (tx) => {
        const org = await tx.organization.create({
          data: {
            name: dto.name,
            slug: slug ?? undefined,
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

      // fetch updated membership list for caller
      const memberships = await this.prisma.orgMembership.findMany({
        where: { userId: user.id },
        include: { org: true, role: true },
      });
      const orgs = memberships.map((m) => ({ id: m.orgId, name: m.org?.name, roleId: m.roleId }));

      return { createdOrg: result.org, roles: result.roles, orgs };
    } catch (err: any) {
      // Prisma unique constraint / known errors mapping
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 = Unique constraint failed
        if (err.code === 'P2002') {
          // attempt to provide the field that caused it
          const metaTarget = (err.meta as any)?.target;
          const field = Array.isArray(metaTarget) ? metaTarget.join(',') : metaTarget;
          throw new ConflictException(`Unique constraint failed on the field(s): ${field}`);
        }
      }

      // If we already threw a Nest exception above, rethrow
      if (err instanceof BadRequestException || err instanceof ConflictException || err instanceof NotFoundException) {
        throw err;
      }

      // otherwise log and return 500
      console.error('createOrg error', err);
      throw new InternalServerErrorException('Failed to create organization');
    }
  }
}