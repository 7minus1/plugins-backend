import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JobUsersService } from './users.service';
import { JobJwtAuthGuard } from './guards/job-jwt-auth.guard';
import { JobVipType } from './entities/vip-type.entity';

@ApiTags('求职VIP类型管理')
@Controller('job/vip-types')
export class JobVipTypeController {
  constructor(private readonly usersService: JobUsersService) {}

  @Get()
  @UseGuards(JobJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取所有VIP类型' })
  @ApiResponse({ status: 200, description: '获取成功' })
  async getAllVipTypes() {
    const vipTypes = await this.usersService.getAllVipTypes();
    return {
      success: true,
      data: vipTypes
    };
  }

  @Post()
  @UseGuards(JobJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '创建VIP类型' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async createVipType(
    @Body() data: { name: string; uploadLimit: number; description?: string }
  ) {
    const vipType = await this.usersService.createVipType(
      data.name,
      data.uploadLimit,
      data.description
    );
    return {
      success: true,
      data: vipType
    };
  }

  @Put(':id')
  @UseGuards(JobJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新VIP类型' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateVipType(
    @Param('id') id: number,
    @Body() data: Partial<JobVipType>
  ) {
    const vipType = await this.usersService.updateVipType(id, data);
    return {
      success: true,
      data: vipType
    };
  }

  @Delete(':id')
  @UseGuards(JobJwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '删除VIP类型' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async deleteVipType(@Param('id') id: number) {
    await this.usersService.deleteVipType(id);
    return {
      success: true,
      message: 'VIP类型删除成功'
    };
  }
} 