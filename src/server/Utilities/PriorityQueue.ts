/**
 * Helper class for the PriorityQueue to contain both generic items and their priorities.
 *
 * @class PriorityQueueElement
 * @template T
 */
class PriorityQueueElement<T> {
	public item: T;
	public priority: number;
	constructor(item: T, priority: number) {
		this.item = item;
		this.priority = priority;
	}
}

/**
 * Implementation of a heap-style PriorityQueue that can have priorities updated after
 * addition, allowing for efficient shifting of items within the queue.
 *
 * The PriorityQueue will act as a normal queue, but with one exception: rather than
 * popping items out of the queue on a First-In-First-Out or Last-In-First-Out basis,
 * as a normal Queue or Stack would, items will be popped from the queue in the order
 * of highest priority first. As elements' priorities are updated, they will be
 * shuffled around the queue to maintain this ordering.
 *
 * Original code from https://github.com/bbecquet/updatable-priority-queue/, and adapted
 * for TypeScript/Luau implementation
 *
 * @class PriorityQueue
 * @template T
 */
class PriorityQueue<T> {
	private heap: PriorityQueueElement<T>[];

	constructor() {
		this.heap = [];
	}

	// TODO: make it an option, for max or min priority queue
	private _compare(a: PriorityQueueElement<T>, b: PriorityQueueElement<T>) {
		return a.priority - b.priority;
	}

	private _bubbleUp(idx: number) {
		const element = this.heap[idx];
		let parentIdx;
		let parent;
		while (idx > 0) {
			// Compute the parent element's index, and fetch it.
			parentIdx = math.floor((idx + 1) / 2) - 1;
			parent = this.heap[parentIdx];
			// If the parent has a lesser score, things are in order and we
			// are done.
			if (this._compare(element, parent) > 0) {
				break;
			}

			// Otherwise, swap the parent with the current element and
			// continue.
			this.heap[parentIdx] = element;
			this.heap[idx] = parent;
			idx = parentIdx;
		}
	}

	private _sinkDown(idx: number) {
		const length = this.heap.size();
		const element = this.heap[idx];
		let swapIdx;

		// eslint-disable-next-line no-constant-condition
		while (true) {
			const rChildIdx = (idx + 1) * 2;
			const lChildIdx = rChildIdx - 1;
			swapIdx = -1;

			// if the first child exists
			if (lChildIdx < length) {
				const lChild = this.heap[lChildIdx];
				// and is lower than the element, they must be swapped
				if (this._compare(lChild, element) < 0) {
					swapIdx = lChildIdx;
				}

				// unless there is another lesser child, which will be the one swapped
				if (rChildIdx < length) {
					const rChild = this.heap[rChildIdx];
					if ((swapIdx === -1 || this._compare(rChild, lChild) < 0) && this._compare(rChild, element) < 0) {
						swapIdx = rChildIdx;
					}
				}
			}

			// if no swap occurs, the element found its right place
			if (swapIdx === -1) {
				break;
			}

			// otherwise, swap and continue on next tree level
			this.heap[idx] = this.heap[swapIdx];
			this.heap[swapIdx] = element;
			idx = swapIdx;
		}
	}

	private _findElementIndex(item: T) {
		// TODO: optimize
		for (let i = 0, l = this.heap.size(); i < l; i++) {
			if (this.heap[i].item === item) {
				return i;
			}
		}
		return -1;
	}

	/**
	 * Returns the number of elements in the queue
	 *
	 * @return {number}
	 * @memberof PriorityQueue
	 */
	public getCount(): number {
		return this.heap.size();
	}

	/*
	 * Inserts an item into the PriorityQueue with a given priority
	 *
	 *
	 * @param {T} item
	 * @param {number} priority
	 * @memberof PriorityQueue
	 */
	public insert(item: T, priority: number) {
		this.heap.push(new PriorityQueueElement(item, priority));
		this._bubbleUp(this.heap.size() - 1);
	}

	/**
	 * Fetches and removed the highest-priority item in the queue
	 *
	 * @return {(T | undefined)}
	 * @memberof PriorityQueue
	 */
	public pop(): T | undefined {
		if (this.heap.size() === 0) {
			return undefined;
		}
		const element = this.heap[0];
		const end_element = this.heap.pop()!;
		// replace the first element by the last,
		// and let it sink to its right place
		if (this.heap.size() > 0) {
			this.heap[0] = end_element;
			this._sinkDown(0);
		}
		return element.item;
	}

	/**
	 * Views the item at the top of the heap without removing it from the PriorityQueue.
	 *
	 * If the PriorityQueue is empty, returns undefined
	 *
	 * @return {(T | undefined)}
	 * @memberof PriorityQueue
	 */
	public peek(): T | undefined {
		if (this.heap.size() === 0) {
			return undefined;
		}
		return this.heap[0].item;
	}

	/**
	 * Updates the priority of a given element.
	 *
	 * @param {T} item
	 * @param {number} newPriority
	 * @return {*}
	 * @memberof PriorityQueue
	 */
	public updatePriority(item: T, newPriority: number) {
		const idx = this._findElementIndex(item);
		if (idx === -1) {
			return;
		}
		const oldKey = this.heap[idx].priority;
		this.heap[idx].priority = newPriority;
		if (newPriority < oldKey) {
			this._bubbleUp(idx);
		} else {
			this._sinkDown(idx);
		}
	}
}

export default PriorityQueue;
