export interface FileEvent {
  type: "created" | "deleted" | "connected";
  category?: "building" | "character" | "tile";
  filename?: string;
}

export type FileEventListener = (event: FileEvent) => void;

const listeners = new Set<FileEventListener>();
let eventSource: EventSource | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

export function onFileEvent(listener: FileEventListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners(event: FileEvent) {
  for (const listener of listeners) {
    listener(event);
  }
}

export function connectFileWatcher() {
  if (eventSource) return;

  eventSource = new EventSource("/api/watch");

  eventSource.onmessage = (msg) => {
    try {
      const event: FileEvent = JSON.parse(msg.data);
      if (event.type !== "connected") {
        notifyListeners(event);
      }
    } catch {
      // ignore malformed events
    }
  };

  eventSource.onerror = () => {
    disconnectFileWatcher();
    // Reconnect after 2 seconds
    reconnectTimer = setTimeout(() => {
      connectFileWatcher();
    }, 2000);
  };
}

export function disconnectFileWatcher() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}
