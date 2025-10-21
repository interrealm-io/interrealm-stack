import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  CreateMemberDTOSchema,
  UpdateMemberDTOSchema,
  ListMembersQuerySchema,
  type CreateMemberDTO,
  type UpdateMemberDTO,
  type CreateMemberResponseDTO,
  type MemberResponseDTO,
  type MemberListResponseDTO,
} from '@interrealm/nexus-shared';
import { logger } from '../config/logger';
import { prisma } from '../config/database';
import { generateApiKey, hashApiKey } from '../utils/helpers';

const router = Router();

/**
 * GET /api/members - List all members with pagination and filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListMembersQuerySchema.parse(req.query);

    const where: any = {};

    if (query.realmId) {
      where.realmId = query.realmId;
    }

    if (query.memberType) {
      where.memberType = query.memberType;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { name: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          agents: true,
        },
      }),
      prisma.member.count({ where }),
    ]);

    const response: MemberListResponseDTO = {
      members: members as any,
      total,
      page: query.page,
      pageSize: query.pageSize,
    };

    res.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        message: 'Invalid query parameters',
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

/**
 * GET /api/members/:id - Get member by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        agents: true,
      },
    });

    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    res.json(member as unknown as MemberResponseDTO);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/members - Create new member
 * Automatically generates an API key for the member
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: CreateMemberDTO = CreateMemberDTOSchema.parse(req.body);

    logger.info('Creating new member', { name: dto.name, realmId: dto.realmId });

    // Verify realm exists
    const realm = await prisma.realm.findUnique({
      where: { id: dto.realmId },
    });

    if (!realm) {
      res.status(404).json({
        message: 'Realm not found',
        realmId: dto.realmId
      });
      return;
    }

    // Generate a unique member ID
    const memberId = `${realm.realmId}/${dto.name}`.replace(/\s+/g, '-').toLowerCase();

    // Check if member with same ID already exists
    const existing = await prisma.member.findUnique({
      where: { id: memberId },
    });

    if (existing) {
      res.status(409).json({
        message: 'Member with this ID already exists in the realm',
        memberId
      });
      return;
    }

    // Generate API key for the member
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);

    // Create the member
    const member = await prisma.member.create({
      data: {
        id: memberId,
        name: dto.name,
        realmId: dto.realmId,
        memberType: dto.memberType,
        contractName: dto.contractName,
        contractVersion: dto.contractVersion,
        authType: 'api-key',
        authConfig: {
          apiKeyHash,
        } as any,
        status: 'offline',
        metadata: (dto.metadata || {}) as any,
      },
      include: {
        agents: true,
      },
    });

    logger.info('Member created successfully', { memberId: member.id, realmId: member.realmId });

    // Return member with API key (only time it's visible)
    const response: CreateMemberResponseDTO = {
      ...(member as any),
      apiKey,
    };

    res.status(201).json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Invalid member data', { errors: error.errors });
      res.status(400).json({
        message: 'Invalid member data',
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

/**
 * PUT /api/members/:id - Update member
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const dto: UpdateMemberDTO = UpdateMemberDTOSchema.parse(req.body);

    logger.info('Updating member', { id });

    // Check if member exists
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    // Update the member
    const member = await prisma.member.update({
      where: { id },
      data: {
        name: dto.name,
        contractName: dto.contractName,
        contractVersion: dto.contractVersion,
        status: dto.status,
        metadata: dto.metadata as any,
      },
      include: {
        agents: true,
      },
    });

    logger.info('Member updated successfully', { id });

    res.json(member as unknown as MemberResponseDTO);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Invalid update data', { errors: error.errors });
      res.status(400).json({
        message: 'Invalid update data',
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

/**
 * DELETE /api/members/:id - Delete member
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    logger.info('Deleting member', { id });

    // Check if member exists
    const existing = await prisma.member.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    // Delete the member (cascade will handle related entities)
    await prisma.member.delete({
      where: { id },
    });

    logger.info('Member deleted successfully', { id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
