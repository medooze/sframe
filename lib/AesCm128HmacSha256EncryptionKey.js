import {Salts}	from "./Salts.js";
import {IV}	from "./IV.js";

export class AesCm128HmacSha256EncryptionKey 
{
	async setKey(raw)
	{
		//Import key
		this.baseKey = await crypto.subtle.importKey(
			"raw",
			raw,
			"HKDF",
			false,
			["deriveBits", "deriveKey"]
		);
		
		//Get salt key
		this.saltKey = new Uint8Array(await crypto.subtle.deriveBits(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.SaltKey,
				info : new ArrayBuffer()
			},
			this.baseKey,
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
			this.baseKey,
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
			this.baseKey,
			{
				name : "HMAC",
				hash : "SHA-256",
				length : 256
			},
			false,
			["sign","verify"]
		);
	}
	
	async encrypt(type,header,payload,extraBytes)
	{
		//Create IV
		const iv = IV.generate(header.keyId,header.counter,this.saltKey);
		
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
		const encryptedFrame = new Uint8Array (header.byteLength+payload.byteLength+authTagLength+extraBytes);
		
		//Set header and encrypted payolad
		encryptedFrame.set(header,0);
		encryptedFrame.set(new Uint8Array(encrypted), header.length);
		
		//Authenticate
		const signature = await crypto.subtle.sign(
			"HMAC",
			this.authKey, 
			encryptedFrame.subarray(0,header.byteLength+encrypted.byteLength)
		);
	
		//Truncate
		const authTag = encryptedFrame.subarray(0,authTagLength);
	
		//Append authentication tag
		encryptedFrame.set(authTag, encrypted.byteLength + header.byteLength );
		
		//Done
		return [encryptedFrame,authTag];
		
	}
	
	async decrypt(type, header, encryptedFrame, extrabytes)
	{
		//Create IV
		const iv = IV.generate(header.keyId,header.counter,this.saltKey);
		
		//Get auth tag length from media type
		const authTagLength = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);
		
		//Get encrypted frame length (without extra bytes from signature)
		const frameLength = encryptedFrame.byteLength - extrabytes;
		
		//Get authentication tag
		const authTag = encryptedFrame.subarray(frameLength - authTagLength, frameLength);
		
		//Get encrypted payload
		const encrypted = encryptedFrame.subarray(header.byteLength, frameLength - authTagLength);
		
		//Decrypt
		const payload = new Uint8Array (await crypto.subtle.encrypt(
			{
				name	: "AES-CTR",
				counter : iv,
				length  : 128
			},
			this.encryptionKey,
			encrypted
		));
		
		//Calculate signature
		const signature = await crypto.subtle.sign(
			"HMAC",
			this.authKey, 
			encryptedFrame.subarray(0,header.byteLength+encrypted.byteLength)
		);
	
		//Authenticate
		for (let i=0;i<authTagLength;++i)
			//Check signature
			if (authTag[i]===signature[i])
				//Authentication error
				throw new Error("Authentication error");
		
		//Done
		return [payload, authTag];
	}
	
	async ratchet()
	{
		//Ratchet key
		const ratchetKey = await crypto.subtle.deriveBits(
			{
				name : "HKDF",
				hash : "SHA-256",
				salt : Salts.RatchetKey
			},
			this.baseKey,
			128
		);
		//Create new key
		const key = new AesCm128HmacSha256EncryptionKey();
		
		//Set ratchet key
		await key.setKey(ratchetKey);
		
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

