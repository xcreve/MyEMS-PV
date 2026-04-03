export interface Station {
  id: string;
  name: string;
  location: string;
  capacity: number;
  group?: string;
  ownerId: string;
  createdAt: string;
}

export interface Gateway {
  id: string;
  name: string;
  type: 'DTU' | 'EdgeGateway' | 'SmartDongle';
  stationId: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'fault';
  communicationType: 'MQTT' | 'Polling';
  config: {
    brokerUrl?: string;
    topic?: string;
    pollingInterval?: number; // in seconds
    protocol?: 'ModbusTCP' | 'ModbusRTU' | 'IEC60870';
  };
  lastSeen: string;
  createdAt: string;
}

export interface Inverter {
  id: string;
  gatewayId: string; // Now belongs to a gateway
  inverterNumber?: string;
  model: string;
  serialNumber: string;
  status: 'online' | 'offline' | 'fault';
  lastSeen: string;
  currentPower?: number;
  dailyYield?: number;
}

export interface Telemetry {
  id: string;
  inverterId: string;
  activePower: number;
  dailyYield: number;
  totalYield: number;
  voltage: number;
  current: number;
  timestamp: string;
}

export interface DailyStat {
  id: string;
  stationId: string;
  date: string;
  yield: number;
}

export interface Alert {
  id: string;
  level: 'critical' | 'warning' | 'info';
  content: string;
  source: string;
  time: string;
  status: 'active' | 'resolved';
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: string;
}

export interface SystemUser {
  id: string;
  username: string;
  phone: string;
  roleId: string;
  status: 'active' | 'disabled';
  createdAt: string;
}
