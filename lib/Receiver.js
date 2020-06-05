import {Utils}					from "./Utils.js";
import {Header}					from "./Header.js";
import {EcdsaVerifyKey}				from "./EcdsaVerifyKey.js";
import {AesCm128HmacSha256EncryptionKey}	from "./AesCm128HmacSha256EncryptionKey.js";

const MaxRachetAttemtps = 5;
const ReplayWindow = 128;
const KeyTimeout = 1000;

export class Receiver
{
	constructor(senderId)
	{
		//Check keyId
		Header.checkKeyId(senderId);
		
		//Store sender id
		this.senderId = senderId;
		//Last received counter
		this.maxReceivedCounter = -1;
		//Number or ratchets of current key
		this.numKeyRatchets = 0;
		//Create keyring
		this.keyring = [];
		//Pending verified tags
		this.pending = new Map();
		
		//Scheduled keys
		this.scheduledKeys = new WeakSet ();
		
		//Function to clear up keys up to given one
		this.schedulePreviousKeysTimeout = (key) =>{
			//If this is the only key
			if (this.keyring.length==1 && this.keyring[0]===key)
				//Do nothing
				return;
			//If has been already scheduled
			if (this.scheduledKeys.has(key))
				//Not do it twice
				return;
			//Add it
			this.scheduledKeys.add(key);
			//Schedule key timeout of previous keys
			setTimeout(()=>{
				//Find key index
				const i = this.keyring.findIndex(k=>k===key);
				//Remove previous keys
				this.keyring = this.keyring.splice(i);
			}, KeyTimeout);
		};
	}
	
	async decrypt(type, ssrcId, header, encryptedFrame, skip)
	{
		let authTag, payload, extrabytes = 0, signature, signed;
		const prevAuthTags = [];
		
		//convert if needed
		if (!(encryptedFrame instanceof Uint8Array))
			encryptedFrame = new Uint8Array (encryptedFrame);
		
		//Replay attack protection
		if (header.counter<this.maxReceivedCounter && this.maxReceivedCounter-header.counter>ReplayWindow)
			//Error
			throw new Error("Replay check failed, frame counter too old");
		
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
				[payload, authTag] = await key.decrypt(type, header, encryptedFrame, extrabytes, skip);
				//Done
				break;
			} catch(e) {
				
			}
		}
		
		//If not found yet
		if (!payload)
		{
			//Get last key
			let key = this.keyring[this.keyring.length-1];
			
			//Try ractchet last key
			for (let i=this.numKeyRatchets; i<MaxRachetAttemtps; ++i)
			{
				//Rachet key
				key = await key.ratchet();
				
				//Append to the keyring
				this.keyring.push(key);
				
				try {
					//Try to decrypt payload
					[payload, authTag] = await key.decrypt(type, header, encryptedFrame, extrabytes, skip);
					//Activate
					this.schedulePreviousKeysTimeout(key);
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
		
		//If we are sending part of the frame in clear
		if (skip)
			//Copy skiped payload
			payload.set(encryptedFrame.subarray(0,skip),0);
		
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
		
		//Set authenticated sender id and frame Id
		payload.senderId = header.keyId;
		payload.frameId  = header.counter;
		
		//Store last received counter
		this.maxReceivedCounter = Math.max(header.counter, this.maxReceivedCounter);
		
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
		//Restart ratchet count number
		this.numKeyRatchets = 0;
		//Activate
		this.schedulePreviousKeysTimeout(key);
	}
};
