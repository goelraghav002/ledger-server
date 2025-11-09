// src/transactions/transactions.controller.ts
import { Controller, Post, Body, UseGuards, Request, Get, Query, Param } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('v1/orgs/:orgId/transactions')
export class TransactionsController {
  constructor(private tx: TransactionsService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Param('orgId') orgId: string, @Body() body: any, @Request() req: any) {
    const user = req.user;
    // call the transactional create that updates balances
    return this.tx.createWithBalanceUpdate(orgId, user.id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async list(@Param('orgId') orgId: string, @Query('limit') limit?: number) {
    return this.tx.list(orgId, Number(limit) || 50);
  }
}