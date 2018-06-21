import agent from "superagent"

import appConfig from "../config";

export let NEO_API_URL = appConfig.neo.apiUrl

export function apiUrl()
{
	return `${NEO_API_URL}/api/main_net/v1/`
}

export function get_last_transactions_by_address(address: string, callback: (err: any, res?: ITransaction[]) => void)
{
	agent(apiUrl() + `get_last_transactions_by_address/${address}`)
		.end((err, res) =>
		{
			if (err)
				return callback(err, undefined)
			
			let txs = res.body as ITransaction[]
			if (!txs || !Array.isArray(txs))
				return callback(`not an array! ${txs}`, undefined)
			
			return callback(undefined, txs)
		})
}
type ISingleTransaction = { txid: string, script: string }
export function get_transaction(txid: string): Promise<ISingleTransaction>
{
	return agent.get(apiUrl() + `get_transaction/${txid}`).then(res => res.body)
}
export function get_transactions(txids: string[]): Promise<ISingleTransaction[]>
{
	return Promise.all(txids.map(get_transaction))
}