import { Router, Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import {
  CreateRealmDTOSchema,
  UpdateRealmDTOSchema,
  ListRealmsQuerySchema,
  type CreateRealmDTO,
  type UpdateRealmDTO,
  type RealmResponseDTO,
  type RealmListResponseDTO,
} from '@interrealm/nexus-shared';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/realms - List all realms with pagination and filtering
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = ListRealmsQuerySchema.parse(req.query);

    const where: any = {};

    if (query.realmType) {
      where.realmType = query.realmType;
    }

    if (query.parentRealmId) {
      where.parentRealmId = query.parentRealmId;
    }

    if (query.search) {
      where.OR = [
        { realmId: { contains: query.search, mode: 'insensitive' } },
        { displayName: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [realms, total] = await Promise.all([
      prisma.realm.findMany({
        where,
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          members: true,
          routes: true,
          bridges: true,
          children: true,
        },
      }),
      prisma.realm.count({ where }),
    ]);

    const response: RealmListResponseDTO = {
      realms: realms as any, // Type assertion for now, will map properly
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
 * GET /api/realms/:id - Get realm by ID
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const realm = await prisma.realm.findUnique({
      where: { id },
      include: {
        members: true,
        routes: true,
        bridges: true,
        children: {
          include: {
            members: true,
            routes: true,
            bridges: true,
          },
        },
      },
    });

    if (!realm) {
      res.status(404).json({ message: 'Realm not found' });
      return;
    }

    res.json(realm as unknown as RealmResponseDTO);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/realms - Create new realm
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto: CreateRealmDTO = CreateRealmDTOSchema.parse(req.body);

    logger.info('Creating new realm', { realmId: dto.realmId });

    // Check if realm with same realmId already exists
    const existing = await prisma.realm.findFirst({
      where: { realmId: dto.realmId },
    });

    if (existing) {
      res.status(409).json({
        message: 'Realm with this ID already exists',
        realmId: dto.realmId
      });
      return;
    }

    // If parentRealmId is provided, verify it exists
    let parentId: string | undefined;
    if (dto.parentRealmId) {
      const parent = await prisma.realm.findUnique({
        where: { id: dto.parentRealmId },
      });

      if (!parent) {
        res.status(404).json({
          message: 'Parent realm not found',
          parentRealmId: dto.parentRealmId
        });
        return;
      }
      parentId = dto.parentRealmId;
    }

    // Create the realm (simplified for MVP - nested relations can be added via separate endpoints)
    const realm = await prisma.realm.create({
      data: {
        realmId: dto.realmId,
        displayName: dto.displayName,
        realmType: dto.realmType,
        description: dto.description,
        contractName: dto.contractName,
        contractVersion: dto.contractVersion,
        policies: dto.policies as any,
        inheritPolicies: dto.inheritPolicies,
        metadata: dto.metadata as any,
        parentId: parentId,
      },
      include: {
        members: true,
        routes: true,
        bridges: true,
        children: true,
      },
    });

    logger.info('Realm created successfully', { realmId: realm.realmId, id: realm.id });

    res.status(201).json(realm as RealmResponseDTO);
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error('Invalid realm data', { errors: error.errors });
      res.status(400).json({
        message: 'Invalid realm data',
        errors: error.errors
      });
    } else {
      next(error);
    }
  }
});

/**
 * PUT /api/realms/:id - Update realm
 */
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const dto: UpdateRealmDTO = UpdateRealmDTOSchema.parse(req.body);

    logger.info('Updating realm', { id });

    // Check if realm exists
    const existing = await prisma.realm.findUnique({
      where: { id },
    });

    if (!existing) {
      res.status(404).json({ message: 'Realm not found' });
      return;
    }

    // Update the realm
    const realm = await prisma.realm.update({
      where: { id },
      data: {
        displayName: dto.displayName,
        description: dto.description,
        contractName: dto.contractName,
        contractVersion: dto.contractVersion,
        policies: dto.policies,
        inheritPolicies: dto.inheritPolicies,
        metadata: dto.metadata as any,
      },
      include: {
        members: true,
        routes: true,
        bridges: true,
        children: true,
      },
    });

    logger.info('Realm updated successfully', { id });

    res.json(realm as unknown as RealmResponseDTO);
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
 * DELETE /api/realms/:id - Delete realm
 */
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    logger.info('Deleting realm', { id });

    // Check if realm exists
    const existing = await prisma.realm.findUnique({
      where: { id },
      include: {
        children: true,
      },
    });

    if (!existing) {
      res.status(404).json({ message: 'Realm not found' });
      return;
    }

    // Check if realm has children
    if (existing.children && existing.children.length > 0) {
      res.status(409).json({
        message: 'Cannot delete realm with children. Delete or reassign children first.',
        childCount: existing.children.length
      });
      return;
    }

    // Delete the realm (cascade will handle related entities)
    await prisma.realm.delete({
      where: { id },
    });

    logger.info('Realm deleted successfully', { id });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;
