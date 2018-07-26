export class Queue {
    private queues: any[]
    private concurrency: number
    private runCount: number
    constructor(opt = { concurrency: 1 }) {
        this.queues = []
        this.concurrency = opt.concurrency
        this.runCount = 0
    }

    public add(fn: () => Promise<any>): Queue {
        this.queues.push(fn)
        if (this.runCount === 0) {
            this.cusume()
        }
        return this
    }

    public pause() {
        // TODO
    }

    public setConcurrency(count: number): Queue {
        this.queues.push(
            () =>
                new Promise(resolve => {
                    if (Number.isInteger(count) && count > 0) {
                        this.concurrency = count
                    }
                    resolve()
                })
        )
        return this
    }

    public clean(): Queue {
        this.queues.length = 0
        return this
    }

    public getLength() {
        return this.queues.length
    }

    private cusume() {
        const q = this.queues.length
        while (this.runCount < this.concurrency && q) {
            this.runCount++
            const task = this.queues.shift()
            if (task) {
                const ret = task()
                if (~Object.prototype.toString.call(ret).indexOf('Promise')) {
                    ret.then(() => {
                        this.runCount--
                        this.cusume()
                    })
                } else {
                    setTimeout(() => {
                        this.runCount--
                        this.cusume()
                    }, 0)
                }
            }
        }
    }
}
