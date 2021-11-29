//TODO: Update to Ed25519 when available
// https://chromestatus.com/features/4913922408710144
// https://chromium.googlesource.com/chromium/src/+log/master/components/webcrypto/algorithms/ed25519.cc

export class EcdsaSignKey
{
	
	async setKey(privKey)
	{
		//If it is a crypto key already
		if (privKey instanceof CryptoKey)
		{
			//Check private key algorithm
			if (privKey.algorithm.name!="ECDSA" || !privKey.usages.includes("sign"))
				//Error
				throw new Error("Invalid key");
			//Set it
			this.privKey = privKey;
		} else {
			//Import it
			this.privKey = await crypto.subtle.importKey(
				"pkcs8",
				privKey,
				{
					name		: "ECDSA",
					namedCurve	: "P-521"
				},
				false,
				["sign"]
			);
		}
	}
	
	async sign(authTags)
	{
		//Verify
		return new Uint8Array(await crypto.subtle.sign(
			{
			  name: "ECDSA",
			  hash: "SHA-512"
			},
			this.privKey,
			authTags
		));
	}
	
	static getSignatureLen()
	{
		return 64;
	}
	
	static async create(privKey)
	{
		//Craete key
		const key = new EcdsaSignKey();
		//Set key
		await key.setKey(privKey);
		//Done
		return key;
		
	}
};
