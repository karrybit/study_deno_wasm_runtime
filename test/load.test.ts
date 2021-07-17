import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { WasmModule, WasmBuffer } from '../src/wasm.ts';

async function initWasmModule(path: string): Promise<WasmModule> {
    const code = await Deno.readFile(path);
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    return wasmModule
}

Deno.test("load const.wat", async() => {
    const wasmModule = await initWasmModule("data/const.wasm")
    assertEquals(3, wasmModule.sections.length)
})

Deno.test("load local.wat", async() => {
    const wasmModule = await initWasmModule("data/local.wasm")
    assertEquals(3, wasmModule.sections.length)
})

Deno.test("load add.wat", async() => {
    const wasmModule = await initWasmModule("data/add.wasm")
    assertEquals(4, wasmModule.sections.length)
})

Deno.test("load if.wat", async() => {
    const wasmModule = await initWasmModule("data/if.wasm")
    assertEquals(4, wasmModule.sections.length)
})

Deno.test("load loop.wat", async() => {
    const wasmModule = await initWasmModule("data/loop.wasm")
    assertEquals(4, wasmModule.sections.length)
})

Deno.test("load call.wat", async() => {
    const wasmModule = await initWasmModule("data/call.wasm")
    assertEquals(4, wasmModule.sections.length)
})
