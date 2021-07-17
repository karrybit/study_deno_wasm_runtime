import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts"
import { WasmModule, WasmBuffer } from '../src/wasm.ts';

Deno.test("load local.wat", async() => {
    const code = await Deno.readFile("data/local.wasm");
    const wasmBuffer = new WasmBuffer(code);
    const wasmModule = new WasmModule();
    wasmModule.load(wasmBuffer);
    assertEquals(3, wasmModule.sections.length)
})
