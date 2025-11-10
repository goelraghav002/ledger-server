import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrgsService } from './orgs.service';
import { CreateOrgDto } from './dto/create-org.dto';

@Controller('v1/orgs')
export class OrgsController {
  constructor(private readonly orgsService: OrgsService) { }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() dto: CreateOrgDto, @Request() req: any) {
    try {
      const user = req.user;
      return this.orgsService.createOrg(dto, user);
    } catch (error) {
      throw error;
    }
  }
}