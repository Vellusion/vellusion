/**
 * A generic event class that manages a list of listeners.
 * Listeners can be added and removed, and the event can be raised
 * to notify all registered listeners.
 */
export class Event<T = void> {
  private _listeners: ((arg: T) => void)[] = [];

  /**
   * Registers a listener function that will be called when the event is raised.
   * @returns An unsubscribe function that removes the listener when called.
   */
  addEventListener(listener: (arg: T) => void): () => void {
    this._listeners.push(listener);
    return () => this.removeEventListener(listener);
  }

  /**
   * Removes a previously registered listener.
   */
  removeEventListener(listener: (arg: T) => void): void {
    const idx = this._listeners.indexOf(listener);
    if (idx !== -1) this._listeners.splice(idx, 1);
  }

  /**
   * Raises the event, calling all registered listeners with the given argument.
   */
  raiseEvent(arg: T): void {
    for (const listener of this._listeners) {
      listener(arg);
    }
  }

  /**
   * The number of currently registered listeners.
   */
  get numberOfListeners(): number {
    return this._listeners.length;
  }
}
