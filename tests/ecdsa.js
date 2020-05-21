import {EcdsaVerifyKey}	from "../lib/EcdsaVerifyKey.js";
import {EcdsaSignKey}	from "../lib/EcdsaSignKey.js";
import {Utils}		from "../lib/Utils.js";

tape.test("ecdsa", async function(suite){
	
	await suite.test("set+sign+verify",async function(test){
		test.plan(1);
		//Create key pair
		const keyPair = await window.crypto.subtle.generateKey (
			{
				name: "ECDSA",
				namedCurve: "P-521"
			},
			false,
			["sign", "verify"]
		);
		//Create 
		const signer	= new EcdsaSignKey();
		const verifier	= new EcdsaVerifyKey();
		//Set the public and private key
		await signer.setKey(keyPair.privateKey);
		await verifier.setKey(keyPair.publicKey);
		
		//LIst of tag
		const authTags = Utils.fromHex("abcde012345678");
		//Sign and verify
		const signed = await signer.sign(authTags);
		//Verify
		const verified = await verifier.verify(authTags,signed)
		//Must be verified
		test.ok(verified);
	});


});
