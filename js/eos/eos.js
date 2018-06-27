"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var lib_1 = require("./lib");
var config_1 = __importDefault(require("../config"));
var CONTRACT_ADDR = config_1.default.eos.contract.addr;
function parseAmount(amount) {
    var _a = amount.split(' '), value = _a[0], symbol = _a[1];
    value = parseFloat(value);
    return {
        value: value,
        symbol: symbol
    };
}
exports.parseAmount = parseAmount;
function getEosTransfers(callback) {
    lib_1.getTableRows(CONTRACT_ADDR, CONTRACT_ADDR, "exchanges").then(function (res) {
        // console.log(res.rows)
        var transfers = res.rows.map(function (x) { return ({
            amount: parseAmount(x.amount).value,
            to: x.to,
            from: x.from,
            tx: x.id + "",
            blockchainFrom: 'eos',
            blockchainTo: x.blockchain,
        }); });
        callback(undefined, transfers);
    })
        .catch(function (err) { return callback(err, undefined); });
}
exports.getEosTransfers = getEosTransfers;
function sendEosToken(transfer) {
    // mint EOS tokens
    console.log("\n\n-----TRANSFER EOS-----\n");
    console.log(transfer);
    console.log("\n----------------------\n\n");
    // return
    var args = {
        to: transfer.to,
        token_master: config_1.default.eos.contract.owner,
        quantity: transfer.amount.toFixed(4) + " DUC",
        memo: transfer.tx
    };
    var extra = {
        authorization: config_1.default.eos.contract.owner,
        sign: true,
        broadcast: true,
    };
    lib_1.callContract(config_1.default.eos.contract.addr, "transfer", args, extra).then(function (x) {
        console.log(x);
    }).catch(function (err) { return console.error(err); });
}
exports.sendEosToken = sendEosToken;
