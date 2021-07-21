import { WasmModule, WasmBuffer } from "../src/wasm.ts"
import { assertEquals } from 'https://deno.land/std@0.93.0/testing/asserts.ts';

Deno.test("temporary", async () => {
    const code = await Deno.readFile("data/add.wasm")
    const wasmBuffer = new WasmBuffer(code)
    const wasmModule = new WasmModule()
    wasmModule.load(wasmBuffer)
    const instance = wasmModule.instantiate()
    instance.exports.add(1, 2)
})

Deno.test("invoke add.wasm", async () => {
    const code = await Deno.readFile("data/add.wasm")
    const wasmBuffer = new WasmBuffer(code)
    const wasmModule = new WasmModule()
    wasmModule.load(wasmBuffer)
    const instance = wasmModule.instantiate()
    assertEquals(3, instance.exports.add(1, 2), `expected 3 but got ${instance.exports.add(1, 2)}`)
    assertEquals(300, instance.exports.add(100, 200), "b")
    assertEquals(1, instance.exports.add(2, -1), "c")
    assertEquals(100, instance.exports.add(200, -100), "d")
})
