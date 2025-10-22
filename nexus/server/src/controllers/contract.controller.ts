import { Router, Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';
import { prisma } from '../config/database';

const router = Router();

/**
 * GET /api/contracts - List all contracts
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, pageSize = 20, name, generatedFrom } = req.query;

    const where: any = {};

    if (name && typeof name === 'string') {
      where.name = { contains: name, mode: 'insensitive' };
    }

    if (generatedFrom && typeof generatedFrom === 'string') {
      where.generatedFrom = generatedFrom;
    }

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.contract.count({ where }),
    ]);

    res.json({
      contracts,
      total,
      page: Number(page),
      pageSize: Number(pageSize),
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contracts/:name/:version - Get specific contract version
 */
router.get('/:name/:version', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, version } = req.params;

    const contract = await prisma.contract.findUnique({
      where: {
        name_version: {
          name,
          version,
        },
      },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/contracts/:name/latest - Get latest version of a contract
 */
router.get('/:name/latest', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = req.params;

    const contract = await prisma.contract.findFirst({
      where: { name },
      orderBy: { createdAt: 'desc' },
    });

    if (!contract) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    res.json(contract);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/members/:memberId/contract - Get member's scanned contract
 */
router.get('/member/:memberId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { memberId } = req.params;

    const member = await prisma.member.findUnique({
      where: { id: memberId },
      select: {
        id: true,
        name: true,
        scannedContract: true,
        lastContractScan: true,
        contractName: true,
        contractVersion: true,
      },
    });

    if (!member) {
      res.status(404).json({ message: 'Member not found' });
      return;
    }

    if (!member.scannedContract) {
      res.status(404).json({ message: 'No contract found for this member' });
      return;
    }

    res.json({
      memberId: member.id,
      memberName: member.name,
      contract: member.scannedContract,
      lastScan: member.lastContractScan,
      contractName: member.contractName,
      contractVersion: member.contractVersion,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/contracts - Create or update a contract
 * Used for manually creating contracts or importing them
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      name,
      version,
      provided,
      required,
      description,
      author,
      tags,
      generatedFrom
    } = req.body;

    if (!name || !version || !provided) {
      res.status(400).json({
        message: 'Missing required fields: name, version, provided'
      });
      return;
    }

    // Check if contract already exists
    const existing = await prisma.contract.findUnique({
      where: {
        name_version: { name, version },
      },
    });

    if (existing) {
      res.status(409).json({
        message: 'Contract with this name and version already exists',
        name,
        version
      });
      return;
    }

    const contract = await prisma.contract.create({
      data: {
        name,
        version,
        provided: provided as any,
        required: required || [],
        description,
        author,
        tags: tags || [],
        generatedFrom: generatedFrom || 'manual',
      },
    });

    logger.info(`Contract created: ${name}@${version}`);

    res.status(201).json(contract);
  } catch (error) {
    logger.error('Failed to create contract:', error);
    next(error);
  }
});

/**
 * GET /api/realms/:realmId/contract - Get aggregated realm contract
 * Combines all member contracts in a realm
 */
router.get('/realm/:realmId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { realmId } = req.params;

    // Get the realm
    const realm = await prisma.realm.findUnique({
      where: { id: realmId },
    });

    if (!realm) {
      res.status(404).json({ message: 'Realm not found' });
      return;
    }

    // Get all members in the realm with their contracts
    const members = await prisma.member.findMany({
      where: { realmId },
      select: {
        id: true,
        name: true,
        scannedContract: true,
        contractName: true,
        contractVersion: true,
      },
    });

    // Aggregate capabilities from all member contracts
    const aggregatedCapabilities: any[] = [];
    const capabilityMap = new Map<string, any>();

    for (const member of members) {
      if (member.scannedContract && typeof member.scannedContract === 'object') {
        const contract = member.scannedContract as any;
        if (contract.spec && Array.isArray(contract.spec.provided)) {
          for (const capability of contract.spec.provided) {
            const key = `${capability.metadata?.name}@${capability.metadata?.version}`;
            if (!capabilityMap.has(key)) {
              capabilityMap.set(key, {
                ...capability,
                providedBy: [member.id],
              });
            } else {
              const existing = capabilityMap.get(key);
              existing.providedBy.push(member.id);
            }
          }
        }
      }
    }

    // Convert map to array
    for (const capability of capabilityMap.values()) {
      aggregatedCapabilities.push(capability);
    }

    // Build realm contract
    const realmContract = {
      apiVersion: 'interrealm.io/v1alpha1',
      kind: 'RealmContract',
      metadata: {
        realmId: realm.realmId,
        realmName: realm.displayName || realm.realmId,
        generatedAt: new Date().toISOString(),
        memberCount: members.length,
      },
      spec: {
        provided: aggregatedCapabilities,
        members: members.map(m => ({
          memberId: m.id,
          memberName: m.name,
          contractName: m.contractName,
          contractVersion: m.contractVersion,
          hasContract: !!m.scannedContract,
        })),
      },
    };

    res.json(realmContract);
  } catch (error) {
    logger.error('Failed to generate realm contract:', error);
    next(error);
  }
});

/**
 * DELETE /api/contracts/:name/:version - Delete a contract
 */
router.delete('/:name/:version', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, version } = req.params;

    const existing = await prisma.contract.findUnique({
      where: {
        name_version: { name, version },
      },
    });

    if (!existing) {
      res.status(404).json({ message: 'Contract not found' });
      return;
    }

    await prisma.contract.delete({
      where: {
        name_version: { name, version },
      },
    });

    logger.info(`Contract deleted: ${name}@${version}`);

    res.status(204).send();
  } catch (error) {
    logger.error('Failed to delete contract:', error);
    next(error);
  }
});

export default router;
