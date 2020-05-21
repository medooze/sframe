import {Context}	from "../lib/Context.js";
import {Utils}		from "../lib/Utils.js";

tape.test("e2e", async function(suite){
	
	await suite.test("generate",async function(test){
		
		test.plan(1);
		
		const shared = Utils.fromHex("12345678901234567890123456789012");
		const keyPair = await window.crypto.subtle.generateKey (
			{
				name: "ECDSA",
				namedCurve: "P-521"
			},
			false,
			["sign", "verify"]
		);
		const sender = new Context(0);
		const receiver = new Context(1);
		
		await sender.setSenderEncryptionKey(shared);
		await sender.setSenderSigningKey (keyPair.privateKey);
		
		receiver.addReceiver(0);
		await receiver.setRecieverEncryptionKey(0,shared);
		await receiver.setRecieverVerifyKey(0,keyPair.publicKey);
		
		const frame = Utils.fromHex("cacadebaca");
		const encrypted = await sender.encrypt("audio",0,frame);
		const decrypted = await receiver.decrypt("audio",0,encrypted);
		
		test.same(Utils.toHex(frame),Utils.toHex (decrypted));
		
	});


});
