
export class EcdsaVerifyKey
{
	async setKey(pubKey)
	{
		//If it is a crypto key already
		if (pubKey instanceof CryptoKey)
		{
			//Check 
			if (pubKey.algorithm.name!="ECDSA" || !pubKey.usages.includes("verify"))
				//Error
				throw new Error("Invalid key");
			//Set it
			this.pubKey = pubKey;
		} else {
			//Import it
			this.pubKey = await crypto.subtle.importKey(
				"raw",
				pubKey,
				{
					name		: "ECDSA",
					namedCurve	: "P-521"
				},
				false,
				["verify"]
			);
		}
	}
	
	async verify(signed,signature)
	{
		//Verify
		return await window.crypto.subtle.verify(
			{
				name: "ECDSA",
				hash: "SHA-512"
			},
			this.pubKey,
			signature,
			signed
		);
	}
	
	static getSignatureLen()
	{
		return 64;
	}
	
	static async create(pubKey)
	{
		//Craete key
		const key = new EcdsaVerifyKey();
		//Set key
		await key.setKey(pubKey);
		//Done
		return key;
		
	}
};
