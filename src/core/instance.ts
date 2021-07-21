import { FuncTypeNode, CodeNode, ModuleNode } from './node.ts';
import { Buffer, StackBuffer } from './buffer.ts';

export class Instance {
    #module: ModuleNode
    #exports: {[key: string]: any}
    #context: Context

    get exports(): {[key: string]: any} {
        return this.#exports
    }

    constructor(module: ModuleNode) {
        this.#module = module
        this.#exports = {}
        this.#context = new Context()
    }

    compile() {
        const typeSection = this.#module.typeSection

        const functionSection = this.#module.functionSection
        const codeSection = this.#module.codeSection

        functionSection?.typeIdxs.forEach((typeIdx, i) => {
            const func = new WasmFunction(typeSection!.funcTypes[typeIdx], codeSection!.codes[i])
            this.#context.functions.push(func)
        })

        const exportSection = this.#module.exportSection
        exportSection?.exports.forEach((exp => {
            if (exp.exportDesc?.tag === 0x00) {
                this.#exports[exp.name!] = (...args: number[]) => {
                    const result = this.#context.functions[exp.exportDesc!.index!].invoke(this.#context, ...args)
                    return result
                }
            }
        }))
    }
}

class LocalValue {
    #type: number
    value: number

    constructor(type: number, value: number) {
        this.#type = type
        this.value = value
    }
}

class WasmFunction {
    #funcType: FuncTypeNode
    #code: CodeNode

    constructor(funcType: FuncTypeNode, code: CodeNode) {
        this.#funcType = funcType
        this.#code = code
    }

    invoke(context: Context, ...args: number[]) {
        console.log(`args: ${args}`)
    }
}

export class Context {
    stack: Buffer
    functions: WasmFunction[]
    locals: LocalValue[]

    constructor() {
        this.stack = new StackBuffer({ buffer: new ArrayBuffer(1024) })
        this.functions = []
        this.locals = []
    }
}
