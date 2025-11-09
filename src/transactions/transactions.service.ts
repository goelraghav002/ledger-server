// src/transactions/transactions.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a transaction and update the balance atomically.
   *
   * dto: { partyId?: string, type: 'credit'|'debit', amount: string | DecimalCompatible, currency?: string, note?: string, clientId?: string, deviceId?: string }
   */
  async createWithBalanceUpdate(orgId: string, createdById: string, dto: any) {
    // Basic validation
    if (!dto || !dto.type || !dto.amount) throw new BadRequestException('type and amount are required');
    if (!['credit', 'debit', 'settlement', 'adjustment'].includes(dto.type)) {
      throw new BadRequestException('invalid transaction type');
    }

    // convert amount to Prisma Decimal-compatible string (prisma uses Decimal internally)
    const amountStr = typeof dto.amount === 'string' ? dto.amount : String(dto.amount);

    const result = await this.prisma.runInTransaction(async (tx) => {
      // 1) Deduplicate by clientId if provided (idempotency)
      if (dto.clientId) {
        const existing = await tx.transaction.findFirst({
          where: { orgId, clientId: dto.clientId },
        });
        if (existing) return { alreadyExists: true, txRecord: existing };
      }

      // 2) Create transaction
      const txRecord = await tx.transaction.create({
        data: {
          orgId,
          partyId: dto.partyId || null,
          type: dto.type,
          amount: new Prisma.Decimal(amountStr) as any, // Prisma Decimal helper
          currency: dto.currency || 'INR',
          note: dto.note,
          clientId: dto.clientId,
          deviceId: dto.deviceId,
          createdById,
        },
      });

      // 3) Update / upsert balance
      // For credit: party owes money to org? Make sure your sign semantics are consistent.
      // Here we treat 'credit' as increasing the balance by amount, 'debit' as decreasing.
      const delta = dto.type === 'credit' ? new Prisma.Decimal(amountStr) : new Prisma.Decimal('-' + amountStr);

      const balance = await tx.balance.upsert({
        where: {
          orgId_partyId: {
            orgId,
            partyId: dto.partyId || null,
          },
        },
        update: {
          amount: { increment: delta as any }, // prisma supports Decimal increment via update with Decimal?
          // NOTE: If your Prisma version doesn't support increment on Decimal, read-modify-write below
        },
        create: {
          orgId,
          partyId: dto.partyId || null,
          amount: delta,
          currency: dto.currency || 'INR',
        },
      });

      // If your Prisma version doesn't support increment for Decimal, do:
      // const prev = await tx.balance.findUnique({ where: { orgId_partyId: { orgId, partyId: dto.partyId || null } } });
      // const newAmount = prev ? prev.amount.plus(delta) : delta;
      // await tx.balance.upsert({ where: { orgId_partyId: {...} }, create: {...}, update: { amount: newAmount } });

      // 4) Optionally write an audit log
      await tx.auditLog.create({
        data: {
          referenceTable: 'Transaction',
          referenceId: txRecord.id,
          action: 'create',
          payload: {
            tx: {
              id: txRecord.id,
              type: txRecord.type,
              amount: txRecord.amount.toString(),
            },
            delta: delta.toString(),
            balanceId: balance.id,
          },
          actorId: createdById,
        },
      });

      return { alreadyExists: false, txRecord, balance };
    });

    return result;
  }

  async list(orgId: string, limit = 50) {
    return this.prisma.transaction.findMany({
      where: { orgId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findSince(orgId: string, sinceServerSeq?: number, limit = 200) {
    const where = sinceServerSeq ? { orgId, serverSeq: { gt: BigInt(sinceServerSeq) } } : { orgId };
    return this.prisma.transaction.findMany({
      where,
      orderBy: { serverSeq: 'asc' },
      take: limit,
    });
  }
}