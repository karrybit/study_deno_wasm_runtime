import { Buffer, StackBuffer } from './buffer.ts';
import {
    FuncTypeNode, CodeNode, ModuleNode, InstrNode,
    BlockInstrNode, LoopInstrNode, IfInstrNode, BrInstrNode,
    BrIfInstrNode, CallInstrNode, I32ConstInstrNode, I32EqzInstrNode,
    I32LtSInstrNode, I32GeSInstrNode, I32AddInstrNode, I32RemSInstrNode,
    LocalGetInstrNode, LocalSetInstrNode
} from './node.ts';

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

    store(buffer: Buffer) {
        switch(this.#type) {
            case 0x7f:
                buffer.writeI32(this.value)
                break
            default:
                throw new Error(`invalid local type: ${this.#type}`)
        }
    }

    load(buffer: Buffer) {
        switch (this.#type) {
            case 0x7f:
                this.value = buffer.readI32()
                break
            default:
                throw new Error(`invalid local type: ${this.#type}`)
        }
    }
}

class WasmFunction {
    #funcType: FuncTypeNode
    #code: CodeNode
    #instructions: InstructionSeq

    constructor(funcType: FuncTypeNode, code: CodeNode) {
        this.#funcType = funcType
        this.#code = code
        this.#instructions = new InstructionSeq(this.#code.func?.expr?.instrs)
    }

    invoke(context: Context, ...args: number[]) {
        const params = [...args]
        const paramTypes = this.#funcType.paramType.valTypes
        for (let i = 0; i < paramTypes.length - args.length; i++) {
            const param = context.stack.readI32()
            params.push(param)
        }

        params.forEach((v, i) => {
            context.locals[i] = new LocalValue(paramTypes[i], v)
        })

        const localses = this.#code.func?.localses
        if (localses) {
            for (let i = 0; i < localses.length; i++) {
                const locals = localses[i]
                for (let j = 0; j < (locals.num || 0); j++) {
                    context.locals.push(new LocalValue(locals.valType!, 0))
                }
            }
        }

        let instr = this.#instructions.top
        while (instr) {
            instr = instr.invoke(context)
        }

        const resultTypes = this.#funcType.resultType.valTypes
        if (resultTypes.length === 0) {
            return null
        } else {
            return context.stack.readI32()
        }
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

class Instruction {
    parent?: Instruction
    #next?: Instruction

    get next(): Instruction | undefined {
        if (this.#next) {
            return this.#next
        } else {
            return this.parent?.next
        }
    }

    set next(instr: Instruction | undefined) {
        this.#next = instr
    }

    constructor(parent?: Instruction) {
        this.parent = parent
    }

    static create(node: InstrNode, parent?: Instruction): Instruction {
        if (node instanceof I32ConstInstrNode) {
            return new I32ConstInstruction(node, parent)
        } else if (node instanceof I32EqzInstrNode) {
            return new I32EqzInstruction(node, parent)
        } else if (node instanceof I32LtSInstrNode) {
            return new I32LtSInstruction(node, parent)
        } else if (node instanceof I32GeSInstrNode) {
            return new I32GeSInstruction(node, parent)
        } else if (node instanceof I32AddInstrNode) {
            return new I32AddInstruction(node, parent)
        } else if (node instanceof I32RemSInstrNode) {
            return new I32RemSInstruction(node, parent)
        } else if (node instanceof LocalGetInstrNode) {
            return new LocalGetInstruction(node, parent)
        } else if (node instanceof LocalSetInstrNode) {
            return new LocalSetInstruction(node, parent)
        } else {
            throw new Error(`invalid node: ${node.constructor.name}`)
        }
    }

    invoke(context: Context): Instruction | undefined {
        throw new Error(`subclass responsibility; ${this.constructor.name}`)
    }
}

class InstructionSeq extends Instruction {
    #instructions: Instruction[] = []

    get top(): Instruction | undefined {
        return this.#instructions[0]
    }

    constructor(nodes: InstrNode[] = [], parent?: Instruction) {
        super()

        if (nodes.length === 0) return

        let prev = Instruction.create(nodes[0], parent)!
        this.#instructions.push(prev)
        for (let i = 1; i < nodes.length; i++) {
            prev.next = Instruction.create(nodes[0], parent)!
            this.#instructions.push(prev)
            prev = prev.next
        }
    }

    invoke(context: Context): Instruction | undefined {
        return this.top
    }
}

class LocalGetInstruction extends Instruction {
    #localIdx: number

    constructor(node: LocalGetInstrNode, parent?: Instruction) {
        super(parent)
        this.#localIdx = node.localIdx
    }

    invoke(context: Context): Instruction | undefined {
        const local = context.locals[this.#localIdx]
        local.store(context.stack)
        return this.next
    }
}

class LocalSetInstruction extends Instruction {
    #localIdx: number

    constructor(node: LocalGetInstrNode, parent?: Instruction) {
        super(parent)
        this.#localIdx = node.localIdx
    }

    invoke(context: Context): Instruction | undefined {
        const local = context.locals[this.#localIdx]
        local.load(context.stack)
        return this.next
    }
}

class I32ConstInstruction extends Instruction {
    #num: number

    constructor(node: I32ConstInstrNode, parent?: Instruction) {
        super(parent)
        this.#num = node.num
    }

    invoke(context: Context): Instruction | undefined {
        context.stack.writeI32(this.#num)
        return this.next
    }
}

class I32AddInstruction extends Instruction {
    constructor(node: I32AddInstrNode, parent?: Instruction) {
        super(parent)
    }

    invoke(context: Context): Instruction | undefined {
        const rhs = context.stack.readI32()
        const lhs = context.stack.readI32()
        console.log(rhs)
        console.log(lhs)
        context.stack.writeI32(lhs + rhs)
        return this.next
    }
}

class I32RemSInstruction extends Instruction {
    constructor(node: I32RemSInstrNode, parent?: Instruction) {
        super(parent)
    }

    invoke(context: Context): Instruction | undefined {
        const rhs = context.stack.readS32()
        const lhs = context.stack.readS32()
        context.stack.writeS32(lhs % rhs)
        return this.next
    }
}

class I32EqzInstruction extends Instruction {
    constructor(node: I32EqzInstrNode, parent?: Instruction) {
        super(parent)
    }

    invoke(context: Context): Instruction | undefined {
        const num = context.stack.readS32()
        context.stack.writeI32(num === 0 ? 1 : 0)
        return this.next
    }
}

class I32LtSInstruction extends Instruction {
    constructor(node: I32LtSInstrNode, parent?: Instruction) {
        super(parent)
    }

    invoke(context: Context): Instruction | undefined {
        const rhs = context.stack.readS32()
        const lhs = context.stack.readS32()
        context.stack.writeI32(lhs < rhs ? 1 : 0)
        return this.next
    }
}

class I32GeSInstruction extends Instruction {
    constructor(node: I32GeSInstrNode, parent?: Instruction) {
        super(parent)
    }

    invoke(context: Context): Instruction | undefined {
        const rhs = context.stack.readS32()
        const lhs = context.stack.readS32()
        context.stack.writeI32(lhs >= rhs ? 1 : 0)
        return this.next
    }
}
