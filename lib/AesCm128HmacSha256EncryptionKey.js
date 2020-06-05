import {Utils}	from "./Utils.js";
import {Salts}	from "./Salts.js";
import {IV}	from "./IV.js";

export class AesCm128HmacSha256EncryptionKey 
{
	async setKey(key)
	{
		if (key instanceof CryptoKey)
		{
			//Check private key algorithm
			if (key.algorithm.name!="HKDF")
				//Error
				throw new Error("Invalid key");
		} else {
			//Import key
			key = await crypto.subtle.importKey(
				"raw",
				key,
				"HKDF",
				false,
				["deriveBits", "deriveKey"]
			);
		}
		
		//Get salt key
		this.saltKey = new Uint8Array(await crypto.subtle.deriveBits(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.SaltKey,
				info : new ArrayBuffer()
			},
			key,
			128
		));
	
		//Get encryption key
		this.encryptionKey = await crypto.subtle.deriveKey(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.EncryptionKey,
				info : new ArrayBuffer()
			},
			key,
			{
				name : "AES-CTR",
				length : 128
			},
			false,
			["encrypt","decrypt"]
		);
	
		//Get authentication key
		this.authKey = await crypto.subtle.deriveKey(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.AuthenticationKey,
				info : new ArrayBuffer()
			},
			key,
			{
				name : "HMAC",
				hash : "SHA-256",
				length : 256
			},
			false,
			["sign","verify"]
		);
	
		//Derive Ratchet key
		this.ratchetKey = await crypto.subtle.deriveBits(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.RatchetKey,
				info : new ArrayBuffer()
			},
			key,
			256
		);
	}
	
	async encrypt(type,header,payload,extraBytes,skip)
	{
		//Encure int
		skip = skip ? skip : 0;
		
		//Create IV
		const iv = IV.generate(header.keyId, header.counter, this.saltKey);
		
		//Encrypt
		const encrypted = await crypto.subtle.encrypt(
			{
				name	: "AES-CTR",
				counter : iv,
				length  : 128
			},
			this.encryptionKey,
			payload
		);
	
		//Get auth tag length from media type
		const authTagLength = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);
		
		//Create encrypted frame
		const encryptedFrame = new Uint8Array(header.byteLength + payload.byteLength + authTagLength + extraBytes + skip);
		
		//Set header and encrypted payolad
		encryptedFrame.set(header, skip);
		encryptedFrame.set(new Uint8Array(encrypted), skip + header.length);
		
		//Authenticate
		const signature = new Uint8Array(await crypto.subtle.sign(
			"HMAC",
			this.authKey, 
			encryptedFrame.subarray(skip, skip + header.byteLength + encrypted.byteLength)
		));
	
		//Truncate
		const authTag = signature.subarray(0, authTagLength);
	
		//Append authentication tag
		encryptedFrame.set(authTag, skip + encrypted.byteLength + header.byteLength );
		
		//Done
		return [encryptedFrame,authTag];
		
	}
	
	async decrypt(type, header, encryptedFrame, extrabytes, skip)
	{
		//Encure int
		skip = skip ? skip : 0;
		
		//Create IV
		const iv = IV.generate(header.keyId, header.counter, this.saltKey);
		
		//Get auth tag length from media type
		const authTagLength = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);
		
		//Get encrypted frame length (without extra bytes from signature)
		const frameLength = encryptedFrame.byteLength - extrabytes - skip;
		
		//Get authentication tag
		const authTag = encryptedFrame.subarray(skip + frameLength - authTagLength, skip + frameLength);
		
		//Get encrypted payload
		const encrypted = encryptedFrame.subarray(skip + header.byteLength, skip + frameLength - authTagLength);
		
		//Calculate signature
		const signature = new Uint8Array(await crypto.subtle.sign(
			"HMAC",
			this.authKey, 
			encryptedFrame.subarray(skip, skip + header.byteLength + encrypted.byteLength)
		));
	
		//Authenticate authTag
		let authenticated = true;
		//Avoid timimg attacks by iterating over all bytes
		for (let i=0;i<authTagLength;++i)
			//check signature
			authenticated &= authTag[i]===signature[i];
		
		//If not all where equal
		if (!authenticated)
			//Authentication error
			throw new Error("Authentication error");
		
		//Decrypt
		const payload = new Uint8Array (await crypto.subtle.decrypt(
			{
				name	: "AES-CTR",
				counter : iv,
				length  : 128
			},
			this.encryptionKey,
			encrypted
		));
		
		//Done
		return [payload, authTag];
	}
	
	async ratchet()
	{
		//Create new key
		const key = new AesCm128HmacSha256EncryptionKey();
		
		//Set ratchet key
		await key.setKey(this.ratchetKey);
		
		//Done
		return key;
	}
	
	static getAuthTagLen(type)
	{
		return type.toLowerCase()==="video" ? 10 : 4;
	};
	
	static async create(raw) 
	{
		//Create new key
		const key = new AesCm128HmacSha256EncryptionKey();
		//Set raw key
		await key.setKey(raw);
		//Done
		return key;
	}
};

