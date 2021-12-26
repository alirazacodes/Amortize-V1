
import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v0.14.0/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

Clarinet.test({
    name: "Disburses tokens once it can claim the time-locked wallet balance",
    async fn(chain: Chain, accounts: Map<string, Account>) {
        const deployer = accounts.get('deployer')!;
        const beneficiary = `${deployer.address}.equity-multi-claim`;
        const wallet1 = accounts.get('wallet_1')!;
        const wallet2 = accounts.get('wallet_2')!;
        const wallet3 = accounts.get('wallet_3')!;
        const wallet4 = accounts.get('wallet_4')!;
        // let list: Account[] = [wallet1, wallet2, wallet3, wallet4];
        const unlock_height = 10;
        const amount = 1000; // be sure to pick a test amount that is divisible by 4 for this test.
        const share = Math.floor(amount / 4);
        chain.mineBlock([
            Tx.contractCall('btc-lock', 'lock', [types.principal(beneficiary), types.uint(unlock_height), types.uint(amount)], deployer.address)
        ]);
        chain.mineEmptyBlockUntil(unlock_height);
        const block = chain.mineBlock([
            Tx.contractCall('equity-multi-claim', 'add-beneficiary', [types.principal(wallet1.address)], deployer.address),
            Tx.contractCall('equity-multi-claim', 'add-beneficiary', [types.principal(wallet2.address)], deployer.address),
            Tx.contractCall('equity-multi-claim', 'add-beneficiary', [types.principal(wallet3.address)], deployer.address),
            Tx.contractCall('equity-multi-claim', 'add-beneficiary', [types.principal(wallet4.address)], deployer.address),
            Tx.contractCall('equity-multi-claim', 'multi-claim', [], deployer.address)
        ]);

        // Take the first receipt.
        const [receipt] = block.receipts;
        // The claim should be successful.
        receipt.result.expectOk().expectBool(true);

        // All wallets should have received their share.
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet1.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet2.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet3.address);
        receipt.events.expectSTXTransferEvent(share, beneficiary, wallet4.address);
    }
});


