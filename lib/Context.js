import {Header} from "./Header.js";
import {Sender} from "./Sender.js";
import {Receiver} from "./Receiver.js";

export class Context
{
	
	constructor(senderId, config)
	{
		//Store config
		this.config = Object.assign({}, config);
		//Only one sender per context
		this.sender = new Sender(senderId);
		
		//The map of known remote senders
		this.receivers = new Map();
	}
		
	async setSenderEncryptionKey(key)
	{
		//Set it
		return this.sender.setEncryptionKey(key);
	}
	
	async ratchetSenderEncryptionKey()
	{
		//Set it
		return this.sender.ratchetEncryptionKey();
	}
	
	async setSenderSigningKey(key)
	{
		//Set it
		return this.sender.setSigningKey(key);
	}
	
	addReceiver(receiverkKeyId)
	{
		//Check we don't have a receiver already for that id
		if(this.receivers.has(receiverkKeyId))
			//Error
			throw new Error("There was already a receiver for keyId "+receiverkKeyId);
		//Add new
		this.receivers.set(receiverkKeyId, new Receiver(receiverkKeyId));
	}
	
	async setReceiverEncryptionKey(receiverkKeyId,key)
	{
		//Get receiver for the sender
		const receiver = this.receivers.get(receiverkKeyId);
		
		//IF not found
		if (!receiver)
			//Error
			throw new Error("No receiver found for keyId "+receiverkKeyId);
		
		//Rachet
		return receiver.setEncryptionKey(key);
	}
	
	async setReceiverVerifyKey(receiverkKeyId,key)
	{
		//Get receiver for the sender
		const receiver = this.receivers.get(receiverkKeyId);
		
		//IF not found
		if (!receiver)
			//Error
			throw new Error("No receiver found for keyId "+receiverkKeyId);
		
		//Rachet
		return receiver.setVerifyKey(key);
	}
	
	deleteReceiver(receiverkKeyId)
	{
		//Delete receiver
		return this.receivers.delete(receiverkKeyId);
	}
	
	async encrypt(type,ssrcId,frame)
	{
		//Encrypt it
		return this.sender.encrypt(type,ssrcId,frame);
	}
	
	async decrypt(type,ssrcId,encryptedFrame)
	{
		//Parse encrypted payload
		const header = Header.parse(encryptedFrame);
		
		//Get receiver for the sender
		const receiver = this.receivers.get(header.keyId);
		
		//IF not found
		if (!receiver)
			//Error
			throw new Error("No receiver found for keyId "+header.keyId);
		
		//Decrypt it
		return receiver.decrypt(type,ssrcId, header, encryptedFrame);
	}
	
};
