//Get worker url
const url = new URL(import.meta.url).pathname.replace("Client","Worker");

async function transferKey(key)
{
	if (key instanceof CryptoKey && key.type=="private")
		return await crypto.subtle.exportKey("pkcs8", key);
	if (key instanceof CryptoKey)
		return await crypto.subtle.exportKey("raw", key);
	return new ArrayBuffer(key);
}

class Client extends EventTarget
{
	constructor()
	{
		 super();
		 
		//Create new worker
		this.worker = new Worker(url, {type: "module"});
		
		//Cutrent transactions
		this.transId = 1;
		this.transactions = new Map();
		
		//Focus face when metadata is received
		this.worker.addEventListener("message",async (event)=>{
			//Get data
			const data = event.data;
			//If it is a transaction response
			if (data.transId)
			{
				//Get transaction 
				const transaction = this.transactions.get(data.transId);
				//Delete transaction
				this.transactions.delete(data.transId);
				//Check result
				if (data.error)
				    //Reject with error
					transaction.reject(new Error(data.error));
				else
					//Resolve promise
					transaction.resolve(data.result);
			} else if (data.event) {
				//Disptach event
				this.dispatchEvent(new Event(data.event.name, data.event.data));
			}
		});
		//Private method
		this.postMessage = (cmd, args, transferList)=>{
			//Create new promise
			return new Promise((resolve,reject)=>{
				//Get new transaction
				const transId = this.transId++;
				//Sent to worker
				this.worker.postMessage({transId,cmd,args},transferList);
				//Add it to pending transactions
				this.transactions.set(transId,{resolve,reject});
			});
		};
	}
	
	async init(senderId, config) 
	{
		return this.postMessage("init", {senderId, config});
	}
	
	async setSenderEncryptionKey(key) 
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderEncryptionKey", [transfered], [transfered]);
	}
	
	async ratchetSenderEncryptionKey()
	{
		return this.postMessage("ratchetSenderEncryptionKey");
	}
	
	async setSenderSigningKey(key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderSigningKey", [transfered]);
	}
	
	async addReceiver(receiverkKeyId)
	{
		return this.postMessage("addReceiver", [receiverkKeyId]);
	}
	
	async setReceiverEncryptionKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverEncryptionKey", [receiverkKeyId, transfered], [transfered]);
	}
	
	async setReceiverVerifyKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverVerifyKey", [receiverkKeyId, transfered], [transfered]);
	}
	
	deleteReceiver(receiverkKeyId)
	{
		return this.postMessage("deleteReceiver", [receiverkKeyId]);
	}
	
	async encrypt(id,sender)
	{
		 //We need the media kind until it is set as metadata on the chunk frame
		const kind = sender.track.kind;
		//Get the sender insertable streams
		const {readableStream,writableStream} = sender.createEncodedStreams ? sender.createEncodedStreams() : 
			sender.createEncodedVideoStreams ? sender.createEncodedVideoStreams() : sender.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("encrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}
	
	async decrypt(id,receiver)
	{
		//We need the media kind until it is set as metadata on the chunk frame
		const kind = receiver.track.kind;
		//Get the receiver insertable streams
		const {readableStream,writableStream} = receiver.createEncodedStreams ? receiver.createEncodedStreams() : 
			receiver.createEncodedVideoStreams ? receiver.createEncodedVideoStreams() : receiver.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("decrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}
	
	close()
	{
		//Terminate worker
		this.worker.terminate();
		
		//End all pending transactions
		for (let transaction of this.transactions.values())
			//Reject with terminated error
			transaction.reject(new Error("Client closed"));
		//Clear transactions
		this.transactions.clear();
	}
};

export const SFrame = 
{
	createClient : async function(senderId,config) 
	{
		//Create client
		const client = new Client();
		//Init worker async
		await client.init(senderId, config);
		//Return client
		return client;
	}
}
