export type Shift = "Morning" | "Afternoon" | "Night";
export type Role = "employee" | "manager";

export interface Slot {
  slotNumber: number;
  ticketName: string;
  imageUrl: string;
  currentCount: number;
  lastClosingDate: string;
  lastClosingShift: Shift;
  lastClosingEmployee: string;
}

export interface Employee {
  id: string;
  pin: string;
  name: string;
  role: Role;
}

export interface ClosingDelta {
  slotNumber: number;
  ticketName: string;
  previousCount: number;
  newCount: number;
  delta: number;
  flagged: boolean;
}

export interface ClosingLogEntry {
  entryId: string;
  timestamp: string;
  date: string;
  shift: Shift;
  employeeId: string;
  employeeName: string;
  changes: ClosingDelta[];
}

export interface TicketCatalogItem {
  id: string;
  name: string;
  imageUrl: string;
}

export interface AppData {
  slots: Slot[];
  employees: Employee[];
  closingLog: ClosingLogEntry[];
  ticketCatalog: TicketCatalogItem[];
}

export interface SessionData {
  employeeId: string;
  employeeName: string;
  role: Role;
}
