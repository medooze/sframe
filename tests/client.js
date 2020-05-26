import {SFrame}	from "../Client.js";
import {Utils}	from "../lib/Utils.js";

tape.test("client", async function(suite){
	
	await suite.test("api",async function(test) {
		
		test.plan(1);
		
		const shared = Utils.fromHex("12345678901234567890123456789012");
		const keyPair = await window.crypto.subtle.generateKey (
			{
				name: "ECDSA",
				namedCurve: "P-521"
			},
			true,
			["sign", "verify"]
		);
	
		const client = await SFrame.createClient(0);
		await client.setSenderEncryptionKey(shared);
		await client.ratchetSenderEncryptionKey();
		await client.setSenderSigningKey(keyPair.privateKey);
		await client.addReceiver(1);
		await client.setReceiverEncryptionKey(1,shared);
		await client.setReceiverVerifyKey(1,keyPair.publicKey);
		await client.deleteReceiver();
		await client.close();
		test.pass();
		
	});
});
