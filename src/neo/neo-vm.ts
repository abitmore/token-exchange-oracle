import { disassemble, IEntry } from "./neo-disassemble"
import { u as neon_u, wallet } from "@cityofzion/neon-js"

export const HALT_BREAK = "HALT, BREAK"
export const VM_TYPES = {
	Integer: "Integer"
}

export function checkTxSuccess(applog: IApplogTx): boolean
{
	// tx is successful when execution ends correctly
	// and TRUE (Integer "1") is returned on stack
	// (depends on contract implementation, works for us)

	if (applog.vmstate != HALT_BREAK) // execution failed
		return false
	
	if (!applog.stack || !applog.stack.length) // no items on stack
		return false
	
	let ret = applog.stack.pop()

	if (!ret) // can't happen, only needed for TS compiler
		return false
	
	if (ret.type != VM_TYPES.Integer) // return value type is incorrect
		return false
	
	if (ret.value != "1") // return value is not TRUE
		return false
	
	return true
}

export let juxt = (...funcs: ((a:string) => any)[]) => (...args: any[]) => args.map((x, idx) => funcs[idx](x))
export let CONV = {
	str: (x: string) => neon_u.hexstring2str(x),
	addr: (x: string) => wallet.getAddressFromScriptHash(neon_u.reverseHex(x)),
	int: (x: string) => neon_u.fixed82num(x),
}

export let parseExchangeCall = parseAnyCall("exchange", CONV.addr, CONV.int, CONV.str, CONV.str)
export let parseMintCall = parseAnyCall("mintTokens", CONV.addr, CONV.int, CONV.str, CONV.str)

export function parseAnyCall(method: string, ...args: ((a: string) => any)[])
{
	return (script: string) =>
	{
		let call = parseContractCall(script)
		if (!call)
			return undefined
		if (call.method != method)
			return undefined
		if (call.params.length != args.length)
			return undefined
		
		return {
			method,
			params: juxt(...args)(...call.params)
		}
	}
}

export function parseContractCall(script: string)
{
	let asm = disassemble(script)
	// console.log(asm)
	let e = asm.pop()
	if (!e)
		return undefined
	if (e.name != "APPCALL")
		return undefined
	
	let methodEntry = asm.pop()
	if (!methodEntry || !methodEntry.name.startsWith("PUSHBYTES") || !methodEntry.hex)
		return undefined
	
	let result = {
		method: neon_u.hexstring2str(methodEntry.hex),
		params: [] as string[]
	}

	// e = asm.pop()

	e = asm[asm.length - 1]


	if (e && e.name.startsWith("PACK"))
	{
		asm.pop() // PACK
		e = asm.pop() // length
		// console.log(e)
		// console.log(asm)
		if (!e || !e.name.startsWith("PUSH") || (e.int != asm.length))
			return undefined
	}
	
	// let argsLenEntry = asm.pop()
	// if (!argsLenEntry || !argsLenEntry.int)
	// 	return result
	
	while (asm.length)
	{
		e = asm.pop()
		if (!e)
			break
		
		// if (!e.name.startsWith("PUSHBYTES"))
		// 	break
		
		if (!e.hex)
			break
		
		result.params.push(e.hex)
	}

	return result
}