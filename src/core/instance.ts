import { ModuleNode } from './node.ts';

export class Instance {
    #module: ModuleNode
    #exports: {[key: string]: any}
    #functions: Function[] = []

    get exports(): {[key: string]: any} {
        return this.#exports
    }

    constructor(module: ModuleNode) {
        this.#module = module
        this.#exports = {}
    }

    compile() {
        const functionSection = this.#module.functionSection
        functionSection?.typeIdxs.forEach((typeIdx, i) => {
            const dummyFunc = (...args: any[]) => console.log(`args: ${args}`)
            this.#functions.push(dummyFunc)
        })

        const exportSection = this.#module.exportSection
        exportSection?.exports.forEach((exp => {
            if (exp.exportDesc?.tag === 0x00) {
                this.#exports[exp.name!] = (...args: number[]) => {
                    return this.#functions[exp.exportDesc!.index!](...args)
                }
            }
        }))
    }
}
