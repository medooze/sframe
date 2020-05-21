import {Utils} from "./Utils.js";
import {EcdsaVerifyKey}				from "./EcdsaVerifyKey.js";
import {AesCm128HmacSha256EncryptionKey}	from "./AesCm128HmacSha256EncryptionKey.js";

const MaxRachetAttemtps = 5;

export class Receiver
{
	constructor(senderId)
	{
		//Store sender id
		this.senderId = senderId;
		//Create keyring
		this.keyring = [];
		//Pending verified tags
		this.pending = new Map();
	}
	
	async decrypt(type, ssrcId, header, encryptedFrame)
	{
		let authTag, payload, extrabytes = 0, signature, signed;
		const prevAuthTags = []; 
		
		//Check if frame contains signature
		if (header.signature)
		{
			//Start from the end
			let end = encryptedFrame.byteLength;
			
			//Get lengths
			const singatureLength = ECDSAVerifyKey.getSignatureLen();
			const authTagLength   = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);
			
			//Get signature
			signature = encryptedFrame.subarray(end - singatureLength, end);
			//Move backward
			end -= singatureLength;
			
			//Get number of tags
			const num = encryptedFrame[end--];
			
			//Read all tags
			for (let i=0; i<num; ++i)
			{
				//Get previous tag
				const prevTag = encryptedFrame.subarray(end - authTagLength, end);
				//Move backward
				end -= authTagLength;
				//Add tag to previous tags in hex
				prevAuthTags.push(Utils.toHex(prevTag))
			}
			//Get the extra bytes
			extrabytes = encryptedFrame.byteLength - end;
			
			//Move backward to start oth current frame auth tag
			end -= authTagLength;
			
			//Get singed part
			signed = encryptedFrame.subarray(end, encryptedFrame.byteLength - singatureLength)
		}
		
		//For each key in key ring
		for (let i=0;i<this.keyring.length;++i)
		{
			//Get key from ring
			const key = this.keyring[i];
			try {
				//Try to decrypt payload
				[payload, authTag] = await key.decrypt(type, header, encryptedFrame, extrabytes);
				//Remove previous keys
				this.keyring = this.keyring.splice(i);
				//Done
				break;
			} catch(e) {
				
			}
		}
		
		//If not found yet
		if (!payload)
		{
			//Get last key
			const key = this.keyring[this.keyring.length-1];
			
			//Try ractchet last key
			for (let i=0; i<MaxRachetAttemtps; ++i)
			{
				//Rachet key
				const ratchet = await key.ratchet ();
				try {
					//Try to decrypt payload
					[payload, authTag] = await ratchet.decrypt(type, header, encryptedFrame, extrabytes);
					//Remove previous keys
					this.keyring = [ratchet];
					//Done
					break;
				} catch(e) {

				}
			}
		}
		
		//Last check
		if (!payload)
			//Decryption failed
			throw new Error("Decryption failed");
		
		//Check if have received anything from this ssrc before
		if (!this.pending.has(ssrcId))
			//Add it
			this.pending.set(ssrcId,new Set());
		
		//Get pending list
		const pending = this.pending.get(ssrcId);
		
		//Check if it constains signatures
		if (header.signed)
		{
			//try to verify list
			if (!await this.verifyKey.verify(signed,signature))
				//Error
				throw new Error("Could not verify signature");
			//For each signed tag
			for (const tag in prevAuthTags)
				//Delete from pending to be verified tags
				pending.delete(tag);
		} else {
			//Push this tag to 
			pending.add(Utils.toHex(authTag));
		}
		
		//Return decrypted payload
		return payload;
	}
	
	async setVerifyKey(key)
	{
		//Create new singing key
		this.verifyKey = EcdsaVerifyKey.create(key);
	}
	
	async setEncryptionKey(raw)
	{
		//Create new encryption key
		const key = await AesCm128HmacSha256EncryptionKey.create(raw);
		//Append to the keyring
		this.keyring.push(key);
	}
};
