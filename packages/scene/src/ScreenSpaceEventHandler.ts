// ---------------------------------------------------------------------------
// ScreenSpaceEventHandler — translates raw DOM mouse/wheel events into
// typed callbacks keyed by ScreenSpaceEventType.
// ---------------------------------------------------------------------------

export enum ScreenSpaceEventType {
  LEFT_DOWN,
  LEFT_UP,
  LEFT_CLICK,
  RIGHT_DOWN,
  RIGHT_UP,
  RIGHT_CLICK,
  MIDDLE_DOWN,
  MIDDLE_UP,
  MIDDLE_CLICK,
  MOUSE_MOVE,
  WHEEL,
}

export interface ScreenSpacePosition {
  x: number;
  y: number;
}

export interface MoveEvent {
  startPosition: ScreenSpacePosition;
  endPosition: ScreenSpacePosition;
}

export interface WheelEventData {
  delta: number;
  position: ScreenSpacePosition;
}

type EventCallback = (event: any) => void;

/** Maximum pixel distance between mousedown and mouseup for a click. */
const CLICK_THRESHOLD = 5;

/**
 * Maps DOM `MouseEvent.button` values to the corresponding DOWN, UP, and
 * CLICK event types.
 */
const BUTTON_MAP: Record<number, {
  down: ScreenSpaceEventType;
  up: ScreenSpaceEventType;
  click: ScreenSpaceEventType;
}> = {
  0: {
    down: ScreenSpaceEventType.LEFT_DOWN,
    up: ScreenSpaceEventType.LEFT_UP,
    click: ScreenSpaceEventType.LEFT_CLICK,
  },
  1: {
    down: ScreenSpaceEventType.MIDDLE_DOWN,
    up: ScreenSpaceEventType.MIDDLE_UP,
    click: ScreenSpaceEventType.MIDDLE_CLICK,
  },
  2: {
    down: ScreenSpaceEventType.RIGHT_DOWN,
    up: ScreenSpaceEventType.RIGHT_UP,
    click: ScreenSpaceEventType.RIGHT_CLICK,
  },
};

export class ScreenSpaceEventHandler {
  private _canvas: HTMLCanvasElement;
  private _actions: Map<ScreenSpaceEventType, EventCallback> = new Map();
  private _lastPosition: ScreenSpacePosition = { x: 0, y: 0 };

  /** Position recorded at the most recent mousedown, per button. */
  private _downPosition: Map<number, ScreenSpacePosition> = new Map();

  /** Bound handlers stored for cleanup in `destroy()`. */
  private _boundHandlers: { event: string; handler: EventListener }[] = [];

  constructor(canvas: HTMLCanvasElement) {
    this._canvas = canvas;
    this._setupListeners();
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  setInputAction(callback: EventCallback, type: ScreenSpaceEventType): void {
    this._actions.set(type, callback);
  }

  removeInputAction(type: ScreenSpaceEventType): void {
    this._actions.delete(type);
  }

  getInputAction(type: ScreenSpaceEventType): EventCallback | undefined {
    return this._actions.get(type);
  }

  destroy(): void {
    for (const { event, handler } of this._boundHandlers) {
      this._canvas.removeEventListener(event, handler);
    }
    this._boundHandlers = [];
    this._actions.clear();
  }

  // -----------------------------------------------------------------------
  // Internals
  // -----------------------------------------------------------------------

  /** Compute canvas-relative position from a MouseEvent. */
  private _positionFromEvent(e: MouseEvent): ScreenSpacePosition {
    const rect = this._canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  /** Register a DOM listener and track it for later cleanup. */
  private _listen(event: string, handler: EventListener): void {
    this._canvas.addEventListener(event, handler);
    this._boundHandlers.push({ event, handler });
  }

  private _setupListeners(): void {
    // --- mousedown ---
    this._listen('mousedown', ((e: MouseEvent) => {
      const pos = this._positionFromEvent(e);
      this._downPosition.set(e.button, { x: pos.x, y: pos.y });

      const mapping = BUTTON_MAP[e.button];
      if (mapping) {
        this._actions.get(mapping.down)?.(pos);
      }
    }) as EventListener);

    // --- mouseup ---
    this._listen('mouseup', ((e: MouseEvent) => {
      const pos = this._positionFromEvent(e);
      const mapping = BUTTON_MAP[e.button];
      if (!mapping) return;

      // Fire the UP event.
      this._actions.get(mapping.up)?.(pos);

      // Click detection: if the mouse hasn't moved far, fire a click event.
      const downPos = this._downPosition.get(e.button);
      if (downPos) {
        const dx = pos.x - downPos.x;
        const dy = pos.y - downPos.y;
        if (Math.sqrt(dx * dx + dy * dy) <= CLICK_THRESHOLD) {
          this._actions.get(mapping.click)?.(pos);
        }
        this._downPosition.delete(e.button);
      }
    }) as EventListener);

    // --- mousemove ---
    this._listen('mousemove', ((e: MouseEvent) => {
      const endPosition = this._positionFromEvent(e);
      const startPosition = { ...this._lastPosition };
      this._lastPosition = { x: endPosition.x, y: endPosition.y };

      const moveEvent: MoveEvent = { startPosition, endPosition };
      this._actions.get(ScreenSpaceEventType.MOUSE_MOVE)?.(moveEvent);
    }) as EventListener);

    // --- wheel ---
    this._listen('wheel', ((e: WheelEvent) => {
      const position = this._positionFromEvent(e as unknown as MouseEvent);
      const data: WheelEventData = { delta: e.deltaY, position };
      this._actions.get(ScreenSpaceEventType.WHEEL)?.(data);
    }) as EventListener);

    // --- contextmenu (block right-click menu) ---
    this._listen('contextmenu', ((e: Event) => {
      e.preventDefault();
    }) as EventListener);
  }
}
