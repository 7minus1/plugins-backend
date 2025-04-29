import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JobJwtAuthGuard extends AuthGuard('job-jwt') {} 