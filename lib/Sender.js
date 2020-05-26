import {Header}					from "./Header.js";
import {EcdsaSignKey}				from "./EcdsaSignKey.js";
import {AesCm128HmacSha256EncryptionKey}	from "./AesCm128HmacSha256EncryptionKey.js";


const SigningFrameInterval = 10;

export class Sender
{
	constructor(senderId)
	{
		//Check keyId
		Header.checkKeyId(senderId);
		
		//The global frame counter
		this.counter = 0;
		
		//Store senderId/keyId
		this.senderId = senderId;
		
		//Pending frames for signing
		this.pending = new Map();
	}
	
	async encrypt(type, ssrcId, payload)
	{
		//Check we have a valid key
		if (!this.key)
			throw Error("Encryption key not set");
		
		//Get counter for frame
		const counter = this.counter++;
		
		//If we don't have the ssrc
		if (!this.pending[ssrcId])
			//Create new pending frames array
			this.pending.set(ssrcId,[]);
		
		//Get pending frames for signature
		const pending = this.pending.get(ssrcId);		
		
		//Do we need to sign the frames?
		const signing = this.signingKey && pending.length > SigningFrameInterval;
		
		//Get auth tag len for type
		const authTagLen = AesCm128HmacSha256EncryptionKey.getAuthTagLen(type);
		
		//Calculae extra bytes
		const extraBytes = signing ? pending.length * AesCm128HmacSha256EncryptionKey.getAuthTagLen(type) + 1 + EcdsaSignKey.getSignatureLen() : 0;
		
		//Generate header
		const header = Header.generate(signing,this.senderId,counter);
		
		//Encrypt frame
		const [encryptedFrame,authTag] = await this.key.encrypt(type, header, payload, extraBytes);
		
		//If we need to sign the frame
		if (signing)
		{
			//Append after auth tag
			let ini = encryptedFrame.byteLength - extraBytes;
			
			//Get tag list view
			const authTags = encryptedFrame.subarray(ini - authTagLen, (pending.length+1)*authTagLen);
			
			//Add all previous tags 
			for (const previousTag of pending)
			{
				//Append to frame
				encryptedFrame.set(previousTag, ini);
				//Move
				ini += authTagLen;
			}
			
			//Add number of bytes
			encryptedFrame[ini++] = pending.length;
			
			//Create signature with all auth tags (including this frame's one)
			const signature = await this.signingKey.sign(authTags);
			
			//Add signature
			encryptedFrame.set(signature, ini);
			
			//Empty pending list 
			this.pending.set(ssrcId,[]);
			
		//If we can sign
		} else if (this.signingKey) {
			//Append a copy of current tag at the begining
			pending.unshift(authTag.slice());
		}
		
		//Set authenticated sender id and frame Id
		encryptedFrame.senderId = header.keyId;
		encryptedFrame.frameId  = header.counter;
		
		//Done
		return encryptedFrame;
	}
	
	async setSigningKey(key)
	{
		//Create new singing key
		this.signingKey = EcdsaSignKey.create(key);
	}
	
	async setEncryptionKey(key)
	{
		//Create new encryption key
		this.key = await AesCm128HmacSha256EncryptionKey.create(key);
	}
	
	async ratchetEncryptionKey()
	{
		//Check we have a valid key
		if (!this.key)
			throw Error("Encryption key not set");
		
		//Rachet the key and store it
		this.key = await this.key.ratchet();
	}
};
