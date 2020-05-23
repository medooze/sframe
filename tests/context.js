import {Context}	from "../lib/Context.js";
import {Utils}		from "../lib/Utils.js";

tape.test("context", async function(suite){
	
	await suite.test("100 frames audio",async function(test){
		
		test.plan(100);
		
		const shared = Utils.fromHex("12345678901234567890123456789012");
		const keyPair = await window.crypto.subtle.generateKey (
			{
				name: "ECDSA",
				namedCurve: "P-521"
			},//
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
		
		///Should encrypt and sign
		for (let i=0;i<100;++i)
		{
			const frame = Utils.fromHex("cacadebaca"+i);
			const encrypted = await sender.encrypt("audio",0,frame);
			const decrypted = await receiver.decrypt("audio",0,encrypted);
			test.same(Utils.toHex(frame),Utils.toHex (decrypted));
		}
		
	});
	
	await suite.test("100 frames video",async function(test){
		
		test.plan(100);
		
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
		
		///Should encrypt and sign
		for (let i=0;i<100;++i)
		{
			const frame = Utils.fromHex("cacadebaca"+i);
			const encrypted = await sender.encrypt("video",0,frame);
			const decrypted = await receiver.decrypt("video",0,encrypted);
			test.same(Utils.toHex(frame),Utils.toHex (decrypted));
		}
		
	});
	
	await suite.test("two senders 1 reciever",async function(test){
		
		test.plan(2);
		
		const shared1 = Utils.fromHex("12345678901234567890123456789012");
		const shared2 = Utils.fromHex("22222222222222222222222222222222");
		
		const receiver = new Context(0);
		const sender1  = new Context(1);
		const sender2  = new Context(2);
		
		await sender1.setSenderEncryptionKey(shared1);
		await sender2.setSenderEncryptionKey(shared2);
		
		receiver.addReceiver(1);
		receiver.addReceiver(2);
		await receiver.setRecieverEncryptionKey(1,shared1);
		await receiver.setRecieverEncryptionKey(2,shared2);
		
		const frame1 = Utils.fromHex("cacadebaca1");
		const encrypted1 = await sender1.encrypt("audio",0,frame1);
		const decrypted1 = await receiver.decrypt("audio",0,encrypted1);
		test.same(Utils.toHex(frame1),Utils.toHex (decrypted1));
		
		const frame2 = Utils.fromHex("cacadebaca2");
		const encrypted2 = await sender2.encrypt("audio",0,frame2);
		const decrypted2 = await receiver.decrypt("audio",0,encrypted2);
		test.same(Utils.toHex(frame2),Utils.toHex (decrypted2));
	});
	
	await suite.test("two senders 1 reciever - wrong key",async function(test){
		
		test.plan(2);
		
		const shared1 = Utils.fromHex("12345678901234567890123456789012");
		const shared2 = Utils.fromHex("22222222222222222222222222222222");
		
		const receiver = new Context(0);
		const sender1  = new Context(1);
		const sender2  = new Context(2);
		
		
		await sender1.setSenderEncryptionKey(shared1);
		await sender2.setSenderEncryptionKey(shared2);
		
		receiver.addReceiver(1);
		receiver.addReceiver(2);
		//We exchange the keys to force fail
		await receiver.setRecieverEncryptionKey(1,shared2);
		await receiver.setRecieverEncryptionKey(2,shared1);
		
		const frame1 = Utils.fromHex("cacadebaca1");
		const encrypted1 = await sender1.encrypt("audio",0,frame1);
		try {
			const decrypted1 = await receiver.decrypt("audio",0,encrypted1);
		} catch (e){
			test.pass();
		}
		
		const frame2 = Utils.fromHex("cacadebaca2");
		const encrypted2 = await sender2.encrypt("audio",0,frame2);
		try {
			const decrypted2 = await receiver.decrypt("audio",0,encrypted2);
		} catch (e) {
			test.pass();
		}
	});
	
	await suite.test("ratchet key",async function(test){
		
		test.plan(5);
		
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
		
		///Should encrypt and sign
		for (let i=0;i<5;++i)
		{
			const frame = Utils.fromHex("cacadebaca"+i);
			const encrypted = await sender.encrypt("video",0,frame);
			const decrypted = await receiver.decrypt("video",0,encrypted);
			test.same(Utils.toHex(frame),Utils.toHex (decrypted));
			
			//Ratchet sener
			await sender.ratchetSenderEncryptionKey();
		}
		
	});

	await suite.test("ratchet key and skip",async function(test){
		
		test.plan(5);
		
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
		
		///Should encrypt and sign
		for (let i=0;i<5;++i)
		{
			const frame = Utils.fromHex("cacadebaca"+i);
			const encrypted = await sender.encrypt("video",0,frame);
			const decrypted = await receiver.decrypt("video",0,encrypted);
			test.same(Utils.toHex(frame),Utils.toHex (decrypted));
			
			//Ratchet sender
			await sender.ratchetSenderEncryptionKey();
			//Ratchet sender
			await sender.ratchetSenderEncryptionKey();
		}
		
	});

});
