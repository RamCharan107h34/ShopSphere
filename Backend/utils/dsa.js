// DSA utilities used by real ShopSphere features
//
// 1. MaxHeap            -> "top picks" popularity ranking (GET /product-api/top-picks)
// 2. mergeSort          -> sort prices in-memory for price ranking (GET /product-api/price-position)
// 3. binarySearch       -> fast lookup of a price inside the sorted price list
// 4. buildIdMap (hash)  -> O(1) product lookup during bulk stock updates (PUT /product-api/bulk-stock)

// ------------------------------------------------------------------
// Max Heap (Priority Queue)
// Keeps the highest-score item on top. Extracting the top K items
// costs O(K log N) instead of sorting everything O(N log N).
// ------------------------------------------------------------------

export class MaxHeap {
    constructor() {
        this.heap = [];
    }

    size() {
        return this.heap.length;
    }

    // entry = { score: number, data: any }
    push(entry) {
        this.heap.push(entry);
        this.bubbleUp(this.heap.length - 1);
    }

    // Remove and return the highest-score entry
    pop() {
        if (this.heap.length === 0) return null;
        const top = this.heap[0];
        const last = this.heap.pop();

        if (this.heap.length > 0) {
            this.heap[0] = last;
            this.sinkDown(0);
        }

        return top;
    }

    bubbleUp(index) {
        while (index > 0) {
            const parentIndex = Math.floor((index - 1) / 2);
            if (this.heap[parentIndex].score >= this.heap[index].score) break;

            [this.heap[parentIndex], this.heap[index]] = [this.heap[index], this.heap[parentIndex]];
            index = parentIndex;
        }
    }

    sinkDown(index) {
        const size = this.heap.length;

        while (true) {
            const leftChild = 2 * index + 1;
            const rightChild = 2 * index + 2;
            let largest = index;

            if (leftChild < size && this.heap[leftChild].score > this.heap[largest].score) {
                largest = leftChild;
            }
            if (rightChild < size && this.heap[rightChild].score > this.heap[largest].score) {
                largest = rightChild;
            }
            if (largest === index) break;

            [this.heap[index], this.heap[largest]] = [this.heap[largest], this.heap[index]];
            index = largest;
        }
    }
}

// ------------------------------------------------------------------
// Merge Sort
// Stable O(N log N) in-memory sort, used where data is already
// loaded from Mongo and we need a classic, explainable sort.
// ------------------------------------------------------------------

export const mergeSort = (array) => {
    if (array.length <= 1) return array;

    const mid = Math.floor(array.length / 2);
    const left = mergeSort(array.slice(0, mid));
    const right = mergeSort(array.slice(mid));

    return merge(left, right);
};

const merge = (left, right) => {
    const result = [];
    let i = 0;
    let j = 0;

    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }

    return result.concat(left.slice(i), right.slice(j));
};

// ------------------------------------------------------------------
// Binary Search
// Finds a target in a sorted array in O(log N). Returns the index or -1.
// ------------------------------------------------------------------

export const binarySearch = (sortedArray, target) => {
    let low = 0;
    let high = sortedArray.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);

        if (sortedArray[mid] === target) return mid;
        if (sortedArray[mid] < target) low = mid + 1;
        else high = mid - 1;
    }

    return -1;
};

// Helper: how many items are strictly below the target?
// (used to answer "how many products are cheaper than this price?")
export const countLessThan = (sortedArray, target) => {
    let low = 0;
    let high = sortedArray.length;

    while (low < high) {
        const mid = Math.floor((low + high) / 2);
        if (sortedArray[mid] < target) low = mid + 1;
        else high = mid;
    }

    return low;
};

// ------------------------------------------------------------------
// Hashing
// Builds a { id -> object } hash map from a list of docs so lookups
// are O(1) instead of scanning the array (O(N)) every time.
// ------------------------------------------------------------------

export const buildIdMap = (documents) => {
    const map = {};

    for (const doc of documents) {
        map[doc._id.toString()] = doc;
    }

    return map;
};
