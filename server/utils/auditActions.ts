export const AuditCategories = {
  USER_MANAGEMENT: 'USER_MANAGEMENT',
  SUPPORT: 'SUPPORT',
  SECURITY: 'SECURITY',
  SETTINGS: 'SETTINGS',
  FINANCE: 'FINANCE',
  MARKETPLACE: 'MARKETPLACE',
  COMMUNICATIONS: 'COMMUNICATIONS',
  SYSTEM: 'SYSTEM',
} as const;

export const AuditActions = {
  // User Management
  USER_CREATE: 'USER_CREATE',
  USER_UPDATE: 'USER_UPDATE',
  USER_DELETE: 'USER_DELETE',
  USER_BAN: 'USER_BAN',
  USER_UNBAN: 'USER_UNBAN',
  
  // Support
  TICKET_REPLY: 'TICKET_REPLY',
  TICKET_STATUS_CHANGE: 'TICKET_STATUS_CHANGE',
  TICKET_PRIORITY_CHANGE: 'TICKET_PRIORITY_CHANGE',
  
  // Security
  IP_BAN: 'IP_BAN',
  IP_UNBAN: 'IP_UNBAN',
  
  // Settings
  SETTING_UPDATE: 'SETTING_UPDATE',
  
  // Communications
  ANNOUNCEMENT_CREATE: 'ANNOUNCEMENT_CREATE',
  ANNOUNCEMENT_PUBLISH: 'ANNOUNCEMENT_PUBLISH',
  CAMPAIGN_CREATE: 'CAMPAIGN_CREATE',
  CAMPAIGN_SEND: 'CAMPAIGN_SEND',
  
  // Finance
  COIN_GRANT: 'COIN_GRANT',
  COIN_DEDUCT: 'COIN_DEDUCT',
  
  // Marketplace
  ITEM_APPROVE: 'ITEM_APPROVE',
  ITEM_REJECT: 'ITEM_REJECT',
  
  // System
  EXPORT_DATA: 'EXPORT_DATA',
} as const;

// Map actions to categories
export const actionCategoryMap: Record<string, string> = {
  USER_CREATE: AuditCategories.USER_MANAGEMENT,
  USER_UPDATE: AuditCategories.USER_MANAGEMENT,
  USER_DELETE: AuditCategories.USER_MANAGEMENT,
  USER_BAN: AuditCategories.USER_MANAGEMENT,
  USER_UNBAN: AuditCategories.USER_MANAGEMENT,
  TICKET_REPLY: AuditCategories.SUPPORT,
  TICKET_STATUS_CHANGE: AuditCategories.SUPPORT,
  TICKET_PRIORITY_CHANGE: AuditCategories.SUPPORT,
  IP_BAN: AuditCategories.SECURITY,
  IP_UNBAN: AuditCategories.SECURITY,
  SETTING_UPDATE: AuditCategories.SETTINGS,
  ANNOUNCEMENT_CREATE: AuditCategories.COMMUNICATIONS,
  ANNOUNCEMENT_PUBLISH: AuditCategories.COMMUNICATIONS,
  CAMPAIGN_CREATE: AuditCategories.COMMUNICATIONS,
  CAMPAIGN_SEND: AuditCategories.COMMUNICATIONS,
  COIN_GRANT: AuditCategories.FINANCE,
  COIN_DEDUCT: AuditCategories.FINANCE,
  ITEM_APPROVE: AuditCategories.MARKETPLACE,
  ITEM_REJECT: AuditCategories.MARKETPLACE,
  EXPORT_DATA: AuditCategories.SYSTEM,
};

// Route pattern to action mapping
export const routeActionMap: Record<string, string> = {
  // User Management
  'POST_/api/admin/users': AuditActions.USER_CREATE,
  'PUT_/api/admin/users/:id': AuditActions.USER_UPDATE,
  'DELETE_/api/admin/users/:id': AuditActions.USER_DELETE,
  'POST_/api/admin/users/:id/ban': AuditActions.USER_BAN,
  'POST_/api/admin/users/:id/unban': AuditActions.USER_UNBAN,
  
  // Support
  'POST_/api/admin/support/tickets/:id/messages': AuditActions.TICKET_REPLY,
  'PUT_/api/admin/support/tickets/:id/status': AuditActions.TICKET_STATUS_CHANGE,
  'PUT_/api/admin/support/tickets/:id/priority': AuditActions.TICKET_PRIORITY_CHANGE,
  
  // Security
  'POST_/api/admin/security/ip-bans': AuditActions.IP_BAN,
  'DELETE_/api/admin/security/ip-bans/:id': AuditActions.IP_UNBAN,
  
  // Settings
  'PUT_/api/admin/settings/:key': AuditActions.SETTING_UPDATE,
  
  // Communications
  'POST_/api/admin/communications/announcements': AuditActions.ANNOUNCEMENT_CREATE,
  'POST_/api/admin/communications/announcements/:id/publish': AuditActions.ANNOUNCEMENT_PUBLISH,
  'POST_/api/admin/communications/campaigns': AuditActions.CAMPAIGN_CREATE,
  'POST_/api/admin/communications/campaigns/:id/send': AuditActions.CAMPAIGN_SEND,
  
  // Finance
  'POST_/api/admin/coins/grant': AuditActions.COIN_GRANT,
  'POST_/api/admin/coins/deduct': AuditActions.COIN_DEDUCT,
  
  // Marketplace
  'POST_/api/admin/marketplace/items/:id/approve': AuditActions.ITEM_APPROVE,
  'POST_/api/admin/marketplace/items/:id/reject': AuditActions.ITEM_REJECT,
  
  // System
  'GET_/api/admin/audit-logs/export': AuditActions.EXPORT_DATA,
};

// Helper to match route patterns with parameters
function matchRoute(method: string, path: string): string | null {
  const key = `${method}_${path}`;
  
  // Try exact match first
  if (routeActionMap[key]) {
    return routeActionMap[key];
  }
  
  // Try pattern matching (replace IDs with :id placeholder)
  const normalizedPath = path.replace(/\/[0-9a-f-]+/gi, '/:id');
  const normalizedKey = `${method}_${normalizedPath}`;
  
  if (routeActionMap[normalizedKey]) {
    return routeActionMap[normalizedKey];
  }
  
  // Try UUID pattern
  const uuidPattern = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  const uuidNormalizedPath = path.replace(uuidPattern, '/:id');
  const uuidNormalizedKey = `${method}_${uuidNormalizedPath}`;
  
  if (routeActionMap[uuidNormalizedKey]) {
    return routeActionMap[uuidNormalizedKey];
  }
  
  return null;
}

export function getActionFromRoute(method: string, path: string): string {
  const matchedAction = matchRoute(method, path);
  if (matchedAction) {
    return matchedAction;
  }
  
  // Fallback: generate action from path
  const pathParts = path.split('/').filter(Boolean);
  return `${method}_${pathParts.slice(2).join('_')}`.toUpperCase();
}
