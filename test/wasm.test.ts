import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { WasmModule, WasmBuffer } from '../src/wasm.ts';

Deno.test("load const.wat", async() => {
    const code = await Deno.readFile("data/const.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(3, wasmModule.sections.length)
})

Deno.test("load local.wat", async() => {
    const code = await Deno.readFile("data/local.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(3, wasmModule.sections.length)
})

Deno.test("load add.wat", async() => {
    const code = await Deno.readFile("data/add.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(4, wasmModule.sections.length)
})

Deno.test("load if.wat", async() => {
    const code = await Deno.readFile("data/if.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(4, wasmModule.sections.length)
})

Deno.test("load loop.wat", async() => {
    const code = await Deno.readFile("data/loop.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(4, wasmModule.sections.length)
})
