/**
 * Project Synchronization Service
 * Handles cross-device and multi-user project synchronization
 */

import type { Project, Message } from '@/types/project';

export interface SyncMetadata {
  projectId: string;
  userId: string;
  lastSyncedAt: number;
  syncStatus: 'syncing' | 'synced' | 'failed' | 'pending';
  changeCount: number;
  conflictCount: number;
}

export interface Change {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: 'message' | 'artifact' | 'file' | 'setting';
  entityId: string;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: number;
  userId: string;
}

export interface SyncConflict {
  changeId: string;
  type: 'version-conflict' | 'delete-conflict' | 'update-conflict';
  local: Change;
  remote: Change;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
}

/**
 * Track changes to a project for synchronization
 */
export class ProjectChangeTracker {
  private changes: Map<string, Change> = new Map();
  private conflictLog: SyncConflict[] = [];

  addChange(change: Change): void {
    this.changes.set(change.id, change);
  }

  getChanges(): Change[] {
    return Array.from(this.changes.values());
  }

  clearChanges(): void {
    this.changes.clear();
  }

  addConflict(conflict: SyncConflict): void {
    this.conflictLog.push(conflict);
  }

  getConflicts(): SyncConflict[] {
    return this.conflictLog;
  }

  resolveConflict(conflictId: string, resolution: 'local' | 'remote'): void {
    const conflict = this.conflictLog.find(c => c.changeId === conflictId);
    if (conflict) {
      conflict.resolution = resolution;
    }
  }
}

/**
 * Compare two projects and identify differences
 */
export function compareProjects(local: Project, remote: Project): Change[] {
  const changes: Change[] = [];

  // Compare basic properties
  if (local.name !== remote.name) {
    changes.push({
      id: `${local.id}-name-${Date.now()}`,
      type: 'update',
      entity: 'setting',
      entityId: local.id,
      field: 'name',
      oldValue: local.name,
      newValue: remote.name,
      timestamp: Date.now(),
      userId: remote.ownerId,
    });
  }

  // Compare messages
  const localMessageIds = new Set(local.messages.map(m => m.id));
  const remoteMessageIds = new Set(remote.messages.map(m => m.id));

  // Find new or updated messages
  for (const remoteMsg of remote.messages) {
    const localMsg = local.messages.find(m => m.id === remoteMsg.id);
    
    if (!localMsg) {
      // New message
      changes.push({
        id: `${local.id}-msg-create-${remoteMsg.id}`,
        type: 'create',
        entity: 'message',
        entityId: remoteMsg.id,
        field: 'content',
        oldValue: undefined,
        newValue: remoteMsg.content,
        timestamp: remoteMsg.timestamp,
        userId: remote.ownerId,
      });
    } else if (JSON.stringify(localMsg) !== JSON.stringify(remoteMsg)) {
      // Updated message
      changes.push({
        id: `${local.id}-msg-update-${remoteMsg.id}`,
        type: 'update',
        entity: 'message',
        entityId: remoteMsg.id,
        field: 'content',
        oldValue: localMsg.content,
        newValue: remoteMsg.content,
        timestamp: remoteMsg.timestamp,
        userId: remote.ownerId,
      });
    }
  }

  // Find deleted messages
  for (const localMsgId of localMessageIds) {
    if (!remoteMessageIds.has(localMsgId)) {
      changes.push({
        id: `${local.id}-msg-delete-${localMsgId}`,
        type: 'delete',
        entity: 'message',
        entityId: localMsgId,
        field: 'id',
        oldValue: localMsgId,
        newValue: undefined,
        timestamp: Date.now(),
        userId: local.ownerId,
      });
    }
  }

  return changes;
}

/**
 * Detect conflicts between local and remote changes
 */
export function detectConflicts(
  localChanges: Change[],
  remoteChanges: Change[]
): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  for (const local of localChanges) {
    for (const remote of remoteChanges) {
      // Same entity, different changes
      if (
        local.entity === remote.entity &&
        local.entityId === remote.entityId &&
        local.id !== remote.id
      ) {
        // Version conflict: both modified same field
        if (local.field === remote.field && local.type === 'update' && remote.type === 'update') {
          conflicts.push({
            changeId: local.id,
            type: 'version-conflict',
            local,
            remote,
            resolution: 'merge', // Default: use most recent timestamp
          });
        }

        // Delete conflict: one deletes, other modifies
        if (
          (local.type === 'delete' && remote.type === 'update') ||
          (local.type === 'update' && remote.type === 'delete')
        ) {
          conflicts.push({
            changeId: local.id,
            type: 'delete-conflict',
            local,
            remote,
            resolution: 'manual', // Requires user decision
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Merge changes with conflict resolution
 */
export function mergeChanges(
  local: Project,
  remote: Project,
  conflicts: SyncConflict[]
): Project {
  const merged = { ...local };

  // Apply all non-conflicting remote changes
  for (const remoteMsg of remote.messages) {
    const hasConflict = conflicts.some(
      c =>
        c.remote.entity === 'message' && c.remote.entityId === remoteMsg.id
    );

    if (!hasConflict) {
      // Add or update message
      const existingIndex = merged.messages.findIndex(m => m.id === remoteMsg.id);
      if (existingIndex >= 0) {
        merged.messages[existingIndex] = remoteMsg;
      } else {
        merged.messages.push(remoteMsg);
      }
    }
  }

  // Handle conflicts based on resolution strategy
  for (const conflict of conflicts) {
    if (conflict.type === 'version-conflict') {
      // Last-write-wins strategy (most recent timestamp)
      if (conflict.local.timestamp > conflict.remote.timestamp) {
        // Keep local
        continue;
      } else {
        // Use remote
        if (conflict.remote.entity === 'message') {
          const idx = merged.messages.findIndex(m => m.id === conflict.remote.entityId);
          const remoteMsg = remote.messages.find(m => m.id === conflict.remote.entityId);
          if (remoteMsg) {
            if (idx >= 0) {
              merged.messages[idx] = remoteMsg;
            } else {
              merged.messages.push(remoteMsg);
            }
          }
        }
      }
    } else if (conflict.resolution === 'remote') {
      // Apply remote change
      if (conflict.remote.entity === 'message') {
        const remoteMsg = remote.messages.find(m => m.id === conflict.remote.entityId);
        const idx = merged.messages.findIndex(m => m.id === conflict.remote.entityId);
        if (remoteMsg) {
          if (idx >= 0) {
            merged.messages[idx] = remoteMsg;
          } else {
            merged.messages.push(remoteMsg);
          }
        }
      }
    }
  }

  // Update metadata
  merged.updatedAt = Math.max(local.updatedAt, remote.updatedAt);

  return merged;
}

/**
 * Create sync metadata for a project
 */
export function createSyncMetadata(
  projectId: string,
  userId: string,
  changes: Change[] = [],
  conflicts: SyncConflict[] = []
): SyncMetadata {
  return {
    projectId,
    userId,
    lastSyncedAt: Date.now(),
    syncStatus: 'synced',
    changeCount: changes.length,
    conflictCount: conflicts.length,
  };
}

/**
 * Validate project ownership for sync
 */
export function validateProjectOwnership(project: Project, userId: string): boolean {
  return project.ownerId === userId;
}
