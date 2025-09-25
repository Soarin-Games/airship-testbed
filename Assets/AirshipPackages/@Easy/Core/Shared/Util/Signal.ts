import ObjectUtils from "@Easy/Core/Shared/Util/ObjectUtils";
import { Cancellable } from "./Cancellable";

type SignalParams<T> = Parameters<
	[T] extends [unknown[]] ? (...args: T) => never : [T] extends [unknown] ? (arg: T) => never : () => never
>;

export type SignalCallback<T> = (...args: SignalParams<T>) => unknown;
type SignalWait<T> = T extends unknown[] ? LuaTuple<T> : T;

interface CallbackItem<T> {
	callback: SignalCallback<T>;
}

export const enum SignalPriority {
	HIGHEST = 0,
	HIGH = 100,
	NORMAL = 200,
	LOW = 300,
	LOWEST = 400,

	/**
	 * The very last priority to get fired.
	 */
	MONITOR = 500,
}

let idCounter = 1;

let freeRunnerThread: thread | undefined;

function acquireRunnerThreadAndCall(fn: Callback, ...params: unknown[]) {
	const acquiredThread = freeRunnerThread as thread;
	freeRunnerThread = undefined;
	fn(...params);
	freeRunnerThread = acquiredThread;
}

function runEventHandlerThread(...params: unknown[]) {
	(acquireRunnerThreadAndCall as Callback)(...params);
	while (true) {
		(acquireRunnerThreadAndCall as Callback)(coroutine.yield() as any);
	}
}

/**
 * A Signal is an object that is used to dispatch and receive arbitrary events.
 */
export class Signal<T extends unknown[] | unknown = void> {
	private debugLogging = false;
	private allowYielding = false;
	private keys: number[] = [];
	private readonly connections: Map<number, Array<CallbackItem<T>>> = new Map();
	public debugGameObject = false;
	public isDestroyed = false;

	/**
	 * Connect a callback function to the signal.
	 *
	 * The returned function can be called to disconnect the callback.
	 */
	public Connect(callback: SignalCallback<T>): () => void {
		return this.ConnectWithPriority(SignalPriority.NORMAL, callback);
	}

	/**
	 * Connect a callback function to the signal.
	 * Highest SignalPriority is called first.
	 *
	 * The returned function can be called to disconnect the callback.
	 */
	public ConnectWithPriority(priority: SignalPriority, callback: SignalCallback<T>): () => void {
		let id = idCounter;
		idCounter++;
		const item: CallbackItem<T> = {
			callback,
		};
		if (this.connections.has(priority)) {
			this.connections.get(priority)!.push(item);
		} else {
			this.connections.set(priority, [item]);

			// Ordered insertion of "priority" into keys array:
			let inserted = false;
			for (let i = 0; i < this.keys.size(); i++) {
				const key = this.keys[i];
				if (key > priority) {
					this.keys.insert(i, priority);
					inserted = true;
					break;
				}
			}
			if (!inserted) {
				this.keys.push(priority);
			}
		}
		return () => {
			const items = this.connections.get(priority);
			if (!items) return;

			const itemIdx = items.indexOf(item);
			if (itemIdx !== -1) {
				items.unorderedRemove(itemIdx);

				if (items.size() === 0) {
					this.connections.delete(priority);
					const keyIdx = this.keys.indexOf(priority);
					if (keyIdx !== -1) {
						this.keys.remove(keyIdx);
					}
				}
			}
		};
	}

	/**
	 * Connects a callback function to the signal. The connection is
	 * automatically disconnected after the first invocation.
	 *
	 * The returned function can be called to disconnect the callback.
	 */
	public Once(callback: SignalCallback<T>): () => void {
		let done = false;
		const c = this.Connect((...args) => {
			if (done) return;
			done = true;
			c();
			callback(...args);
		});
		return c;
	}

	/**
	 * Invokes all callback functions with the given arguments.
	 */
	public Fire(...args: SignalParams<T>): T {
		if (this.debugLogging) {
			print("key count: " + this.connections.size());
			let callbackCount = 0;
			for (let priority of ObjectUtils.keys(this.connections)) {
				for (let connection of this.connections.get(priority)!) {
					callbackCount++;
				}
			}
			print("callback count: " + callbackCount);
		}

		let fireCount = 0;
		let cancelled = false;
		const isCancellable = args.size() === 1 && args[0] instanceof Cancellable;

		for (const priority of this.keys) {
			const conns = this.connections.get(priority);
			if (!conns) continue;

			const entries = [...conns];
			for (let entry of entries) {
				fireCount++;

				if (this.allowYielding) {
					try {
						entry.callback(...args);
					} catch (e) {
						warn("Error in signal callback: " + e);
					}
				} else {
					if (!isCancellable) {
						if (!freeRunnerThread) {
							freeRunnerThread = coroutine.create(runEventHandlerThread);
						}
						task.spawnDetached(freeRunnerThread, entry.callback, ...args);
					} else {
						const thread = task.spawnDetached(entry.callback, ...args);

						if (coroutine.status(thread) !== "dead") {
							warn(
								debug.traceback(thread, "Signal callback yielded. This might be an error.") + "\n--\n",
							);
						}
					}
				}

				if (isCancellable) {
					const cancellable = args[0] as Cancellable;
					if (cancellable.IsCancelled()) {
						cancelled = true;
						break;
					}
				}
			}
			if (cancelled) {
				break;
			}
		}
		if (this.debugLogging) {
			print("fire count: " + fireCount);
		}
		return args[0] as T;
	}

	/**
	 * Yields the current thread until the next invocation of the
	 * signal occurs. The invoked arguments will be returned.
	 */
	public Wait() {
		const thread = coroutine.running();
		this.Once((...args) => {
			task.spawn(thread, ...args);
		});
		return coroutine.yield() as SignalWait<T>;
	}

	/**
	 * Fires the given signal any time this signal is fired.
	 *
	 * The returned function can be called to disconnect the proxy.
	 */
	public Proxy(signal: Signal<T>) {
		return this.Connect((...args) => {
			signal.Fire(...args);
		});
	}

	/**
	 * Clears all connections.
	 */
	public DisconnectAll() {
		this.connections.clear();
		this.keys.clear();
	}

	/**
	 * Returns `true` if there are any connections.
	 */
	public HasConnections() {
		return !this.connections.isEmpty();
	}

	/**
	 * Alias for `DisconnectAll()`.
	 */
	public Destroy() {
		this.DisconnectAll();
		this.isDestroyed = true;
	}

	public SetDebug(value: boolean): Signal<T> {
		this.debugLogging = value;
		return this;
	}

	public WithAllowYield(value: boolean): Signal<T> {
		this.allowYielding = value;
		return this;
	}

	public GetConnectionCount(): number {
		let i = 0;
		for (const value of ObjectUtils.values(this.connections)) {
			i += value.size();
		}
		return i;
	}
}
