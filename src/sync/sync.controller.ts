import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('v1/sync')
export class SyncController {
  constructor(private prisma: PrismaService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async sync(@Body() body: any, @Request() req: any) {
    // body: { orgId, deviceId, ops: [{opType:'create_tx', clientId, payload}, ...], lastKnownServerSeq }
    const user = req.user;
    const orgId = body.orgId;
    const ops = body.ops || [];

    const acks = [];

    for (const op of ops) {
      if (op.opType === 'create_tx') {
        // dedupe by clientId
        const existing = op.clientId
          ? await this.prisma.transaction.findFirst({
              where: { orgId, clientId: op.clientId },
            })
          : null;

        if (existing) {
          acks.push({
            clientId: op.clientId,
            status: 'ok',
            serverId: existing.id,
            serverSeq: existing.serverSeq,
          });
          continue;
        }

        const tx = await this.prisma.transaction.create({
          data: {
            orgId,
            partyId: op.payload.partyId || null,
            type: op.payload.type,
            amount: op.payload.amount,
            currency: op.payload.currency || 'INR',
            note: op.payload.note,
            clientId: op.clientId,
            deviceId: body.deviceId || null,
            createdById: user.id,
          },
        });

        acks.push({
          clientId: op.clientId,
          status: 'ok',
          serverId: tx.id,
        });
      } else {
        acks.push({ status: 'ignored', reason: 'unknown opType' });
      }
    }

    return { acks };
  }
}