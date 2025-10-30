// controllers/maintenanceRequestController.js (ESM version)
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create maintenance request
export const createRequest = async (req, res) => {
  try {
    const { title, description, priority, propertyId } = req.body;
    const tenantId = req.user.id; // authenticated tenant

    const request = await prisma.maintenanceRequest.create({
      data: {
        title,
        description,
        priority,
        propertyId,
        tenantId,
      },
    });

    res.status(201).json({ message: 'Request submitted', request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit request', error });
  }
};

// Get all maintenance requests (admin or agent view)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        tenant: true,
        property: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests', error });
  }
};

// Get tenant's own maintenance requests
export const getMyRequests = async (req, res) => {
  try {
    const tenantId = req.user.id;
    const requests = await prisma.maintenanceRequest.findMany({
      where: { tenantId },
      include: { property: true },
      orderBy: {
        createdAt: 'desc',
      },
    });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch your requests', error });
  }
};

// Update maintenance status (agent/admin only)
export const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const request = await prisma.maintenanceRequest.update({
      where: { id: Number(id) },
      data: { status },
    });

    res.status(200).json({ message: 'Status updated', request });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update status', error });
  }
};
