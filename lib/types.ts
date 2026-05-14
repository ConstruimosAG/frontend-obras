export interface Work {
  id: number;
  code: string;
  finalized: boolean;
  quotationDeadline: Date | null;
  createdAt: Date;
  updatedAt: Date;
  personnelRequired?: Record<string, unknown> | null;
  extras?: Record<string, unknown> | null;
  titles?: string[] | null;
  items?: Item[];
  quote?: QuoteWork;
}

export interface Item {
  id: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  estimatedExecutionTime: number | null;
  workId: number;
  contractorId: number | null;
  contractor?: User;
  createdById?: number;
  updatedById?: number;
  quoteItems?: QuoteItem[];
  title?: string | null;
  work?: Work;
}

export interface QuoteItem {
  id: number;
  subquotations: Record<string, unknown>;
  totalContractor: string;
  materials: Record<string, unknown> | null;
  materialCost: string;
  subtotal: string;
  managementPercentage: string;
  agValue: string;
  vat: boolean;
  administrationPercentage: string;
  contingenciesPercentage: string;
  profitPercentage: string;
  createdAt: Date;
  itemId: number;
  quoteWorkId: number | null;
  assignedContractorId: number | null;
  ConstruimosAG?: boolean;
}

export interface QuoteWork {
  id: number;
  subtotal: string;
  total: string;
  createdAt: Date;
  updatedAt: Date;
  workId: number;
  quoteItems?: QuoteItem[];
}

export interface User {
  id: number;
  name: string;
  role: string;
  identifier: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  items?: Item[];
  assignedQuoteItems?: QuoteItem[];
}

// Tipos para formularios
export interface WorkFormData {
  code: string;
  quotationDeadline?: string;
}

export interface WorkEditFormData {
  code?: string;
  quotationDeadline?: string;
  finalized?: boolean;
}

export interface ItemFormData {
  description: string;
  estimatedExecutionTime?: number;
  workId: number;
}

export interface ItemEditFormData {
  description?: string;
  estimatedExecutionTime?: number;
}
