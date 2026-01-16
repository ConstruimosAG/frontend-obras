import type { Work, Item } from "./types";

// =====================================================
// MOCK DATA - TEST DATA
// To use real data, just remove this import
// and replace with your data source (API, database, etc.)
// =====================================================

// Mock works data
export const mockWorks: Work[] = [
  {
    id: 1,
    code: "PCN-2024-001",
    finalized: false,
    quotationDeadline: new Date("2025-01-15"),
    createdAt: new Date("2024-12-10"),
    updatedAt: new Date("2024-12-10"),
  },
  {
    id: 2,
    code: "MEC-2024-002",
    finalized: false,
    quotationDeadline: new Date("2025-01-20"),
    createdAt: new Date("2024-12-08"),
    updatedAt: new Date("2024-12-08"),
  },
  {
    id: 3,
    code: "RAA-2024-003",
    finalized: true,
    quotationDeadline: new Date("2025-02-01"),
    createdAt: new Date("2024-12-05"),
    updatedAt: new Date("2024-12-05"),
  },
  {
    id: 4,
    code: "ISE-2024-004",
    finalized: false,
    quotationDeadline: new Date("2025-01-30"),
    createdAt: new Date("2024-12-01"),
    updatedAt: new Date("2024-12-01"),
  },
  {
    id: 5,
    code: "RFE-2024-005",
    finalized: false,
    quotationDeadline: new Date("2025-02-15"),
    createdAt: new Date("2024-11-28"),
    updatedAt: new Date("2024-11-28"),
  },
  {
    id: 6,
    code: "SCH-2024-006",
    finalized: true,
    quotationDeadline: new Date("2025-01-25"),
    createdAt: new Date("2024-11-25"),
    updatedAt: new Date("2024-11-25"),
  },
];

// Mock items data
export const mockItems: Item[] = [
  {
    id: 1,
    active: true,
    createdAt: new Date("2024-12-10T12:28:00"),
    updatedAt: new Date("2024-12-10T12:28:00"),
    description:
      "Removal, supply and installation of LED luminaires in main corridors of the north campus",
    personnelRequired: {
      technician: "Mauricio Cardenas",
      contractor: "Contractor Comodin",
    },
    extras: {
      notes: "Requires coordination with security area for night access",
    },
    estimatedExecutionTime: 24,
    workId: 1,
    contractorId: null,
  },
  {
    id: 2,
    active: true,
    createdAt: new Date("2024-12-11T09:15:00"),
    updatedAt: new Date("2024-12-11T09:15:00"),
    description:
      "Repair of air conditioning system in administrative offices of the main block",
    personnelRequired: { technician: "Juan Perez", role: "HVAC Technician" },
    extras: { notes: "Verify spare parts stock before starting" },
    estimatedExecutionTime: 16,
    workId: 1,
    contractorId: null,
  },
  {
    id: 3,
    active: true,
    createdAt: new Date("2024-12-12T14:30:00"),
    updatedAt: new Date("2024-12-12T14:30:00"),
    description:
      "Painting and finishing of the main building exterior facade with anti-corrosive paint",
    personnelRequired: { team: "Ana Garcia", role: "Painting Team" },
    extras: { notes: "Depends on favorable weather conditions" },
    estimatedExecutionTime: 40,
    workId: 1,
    contractorId: null,
  },
  {
    id: 4,
    active: false,
    createdAt: new Date("2024-12-13T08:00:00"),
    updatedAt: new Date("2024-12-13T08:00:00"),
    description:
      "Preventive maintenance of pumping system and drinking water reserve tanks",
    personnelRequired: {
      technician: "Carlos Mendoza",
      role: "Hydraulic Technician",
    },
    extras: {},
    estimatedExecutionTime: 8,
    workId: 1,
    contractorId: null,
  },
  {
    id: 5,
    active: true,
    createdAt: new Date("2024-12-14T10:45:00"),
    updatedAt: new Date("2024-12-14T10:45:00"),
    description:
      "Installation of structured cabling for data network and WiFi access points",
    personnelRequired: {
      technician: "Roberto Sanchez",
      contractor: "Contractor Comodin",
    },
    extras: { notes: "Coordinate with IT department for configuration" },
    estimatedExecutionTime: 32,
    workId: 1,
    contractorId: null,
  },
  {
    id: 6,
    active: true,
    createdAt: new Date("2024-12-08T11:00:00"),
    updatedAt: new Date("2024-12-08T11:00:00"),
    description: "Elevator review and maintenance in the central building",
    personnelRequired: {
      technician: "Pedro Lopez",
      role: "Elevator Technician",
    },
    extras: { notes: "Requires stopping elevator use during maintenance" },
    estimatedExecutionTime: 16,
    workId: 2,
    contractorId: null,
  },
  {
    id: 7,
    active: true,
    createdAt: new Date("2024-12-09T15:20:00"),
    updatedAt: new Date("2024-12-09T15:20:00"),
    description:
      "Waterproofing of terrace and repair of leaks on the top floor",
    personnelRequired: { team: "Maria Torres", role: "Waterproofing Team" },
    extras: { notes: "Height work, requires safety equipment" },
    estimatedExecutionTime: 24,
    workId: 2,
    contractorId: null,
  },
  {
    id: 8,
    active: true,
    createdAt: new Date("2024-12-10T09:30:00"),
    updatedAt: new Date("2024-12-10T09:30:00"),
    description:
      "Replacement of broken glass in windows on the south facade of the building",
    personnelRequired: { specialist: "Luis Ramirez", role: "Glass Specialist" },
    extras: { notes: "Special tempered glass, verify availability" },
    estimatedExecutionTime: 8,
    workId: 2,
    contractorId: null,
  },
  {
    id: 9,
    active: true,
    createdAt: new Date("2024-12-05T08:00:00"),
    updatedAt: new Date("2024-12-05T08:00:00"),
    description: "Demolition of partition walls to create open office space",
    personnelRequired: {
      team: "Demolition Team",
      contractor: "Main Contractor",
    },
    extras: {
      notes: "Requires construction permits and protection of adjacent areas",
    },
    estimatedExecutionTime: 32,
    workId: 3,
    contractorId: null,
  },
  {
    id: 10,
    active: true,
    createdAt: new Date("2024-12-06T10:00:00"),
    updatedAt: new Date("2024-12-06T10:00:00"),
    description:
      "Installation of new smart lighting system with motion sensors",
    personnelRequired: {
      team: "Certified Electricians",
      company: "Smart Home Co.",
    },
    extras: { notes: "Integration with existing home automation system" },
    estimatedExecutionTime: 24,
    workId: 3,
    contractorId: null,
  },
];

// Helper function to get items by work ID
export function getItemsByWorkId(workId: number): Item[] {
  return mockItems.filter((item) => item.workId === workId);
}

// Helper function to get a work by ID
export function getWorkById(workId: number): Work | undefined {
  return mockWorks.find((w) => w.id === workId);
}

// Helper function to get an item by ID
export function getItemById(itemId: number): Item | undefined {
  return mockItems.find((item) => item.id === itemId);
}

// Helper function to count items by work ID
export function getItemsCountByWorkId(workId: number): number {
  return mockItems.filter((item) => item.workId === workId).length;
}
