import { WasmModule, WasmBuffer } from "../src/wasm.ts"

Deno.test("temporary", async () => {
    const code = await Deno.readFile("data/add.wasm")
    const wasmBuffer = new WasmBuffer(code)
    const wasmModule = new WasmModule()
    wasmModule.load(wasmBuffer)
    const instance = wasmModule.instantiate()
    instance.exports.add(1, 2)
})
