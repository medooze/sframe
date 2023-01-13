import SframeWorker from './Worker.js';

/**
 * SFrame library
 *  @namespace Sframe
 */
export const SFrame =
{
	/**
	 * Create a new SFrame client context.
	 *
	 * This method will create client which communicates with web worker in which the SFrame context will be executed.
	 * @memberof SFrame
	 * @param {Number} senderId - Numeric id for this sender.
	 * @param {Object} config - Congiguration parameters [Optional].
	 * @param {Boolean} config.skipVp8PayloadHeader - Sends the vp8 payload header in clear (Note: it will be applied to all video frames as encoded chunks does not contain codec info yet).
	 * @param {Boolean} config.displayFailedDecryptionFrames - Will display frames even when decryption has failed, leading to a garbled video being displayed.
	 * @returns {Promise<Client>} Promise that resolves to the client object when the web worker is initialized.
	 */
	createClient : async function(senderId,config)
	{
		//Create client
		const client = new Client();
		//Init worker async
		await client.init(senderId, config);
		//Return client
		return client;
	}
};

async function transferKey(key)
{
	if (key instanceof CryptoKey && key.type=="private")
		return await crypto.subtle.exportKey("pkcs8", key);
	if (key instanceof CryptoKey)
		return await crypto.subtle.exportKey("raw", key);
	if (key instanceof Uint8Array)
		return key.buffer.slice(0);
	return key.slice(0);
}


/**
 * The SFrame client object which acts as a proxy for web worker context.
 */
class Client extends EventTarget
{
	/**
	 * @ignore
	 * @hideconstructor
	 * private constructor
	 */
	constructor()
	{
		 super();

		//Create new worker
		this.worker = new SframeWorker();

		//Cutrent transactions
		this.transId = 1;
		this.transactions = new Map();

		//Listen for worker messages
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
				/**
				* The authenticated event will be fired when a new sender is received on the receiver.
				*
				* @name "authenticated"
				* @memberof Client
				* @kind event
				* @argument {String} id - The id for the associated RTCRtpReceiver
				* @argument {Number} senderId - The senderId of the authenticated sender received.
				*/
				//Create event
				const event = new Event(data.event.name);
				//Set id and senderId
				event.id	= data.event.data.id;
				event.senderId	= data.event.data.senderId;
				//Disptach event
				this.dispatchEvent(event);
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

	/**
	 * Set the sender encryption key.
	 *
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - 32 bytes encryption key. If the value is a CryptoKey the algorithm must be "HKDF".
	 * @returns {Promise<void>} Promise which will be resolved when the key is set on the web worker.
	 */
	async setSenderEncryptionKey(key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderEncryptionKey", [transfered], [transfered]);
	}

	/**
	 * Ratchert the sender encryption key.
	 *
	 * @returns {Promise<void>} Promise which will be resolved when the key is ratcheted on the web worker.
	 */
	async ratchetSenderEncryptionKey()
	{
		return this.postMessage("ratchetSenderEncryptionKey");
	}

	/**
	 * Set the sender signing key.
	 *
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - Private key used for singing. If the value is a CryptoKey the algorithm must be "ECDSA".
	 * @returns {Promise<void>} Promise which will be resolved when the signing key is set on the web worker.
	 */
	async setSenderSigningKey(key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setSenderSigningKey", [transfered]);
	}

	/**
	 * Add receiver for a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @returns {Promise<void>} Promise which will be resolved when the receiver is added on the web worker.
	 */
	async addReceiver(receiverkKeyId)
	{
		return this.postMessage("addReceiver", [receiverkKeyId]);
	}

	/**
	 * Set the receiver encryption key associated to a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - 32 bytes encryption key. If the value is a CryptoKey the algorithm must be "HKDF".
	 * @returns {Promise<void>} Promise which will be resolved when the key is set on the web worker.
	 */
	async setReceiverEncryptionKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverEncryptionKey", [receiverkKeyId, transfered], [transfered]);
	}

	/**
	 * Set the receiver signing key associated to a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @param {ArrayBuffer|Uint8Array|CryptoKey} key - Private key used for singing. If the value is a CryptoKey the algorithm must be "ECDSA".
	 * @returns {Promise<void>} Promise which will be resolved when the signing key is set on the web worker.
	 */
	async setReceiverVerifyKey(receiverkKeyId,key)
	{
		const transfered = await transferKey(key);
		return this.postMessage("setReceiverVerifyKey", [receiverkKeyId, transfered], [transfered]);
	}

	/**
	 * Remove receiver for a remote sender.
	 *
	 * @param {Number} receiverkKeyId - The remote senderId.
	 * @returns {Promise<void>} Promise which will be resolved when the receiver is removed on the web worker.
	 */
	deleteReceiver(receiverkKeyId)
	{
		return this.postMessage("deleteReceiver", [receiverkKeyId]);
	}

	/**
	 * Encrypt frames for a RTCRtpSender.
	 *
	 * @param {String} id - An unique identifier associated to this sender (for example transceiver.mid).
	 * @param {RTCRtpSender} sender - The sender object, associated track must be not null.
	 */
	async encrypt(id,sender)
	{
		 //We need the media kind until it is set as metadata on the chunk frame
		const kind = sender.track.kind;
		//Get the sender insertable streams
		const {readable: readableStream, writable: writableStream} = sender.createEncodedStreams ? sender.createEncodedStreams() :
			sender.createEncodedVideoStreams ? sender.createEncodedVideoStreams() : sender.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("encrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}

	/**
	 * Decrypt frames fpr a RTCPRtpReceiver.
	 *
	 * @param {String} id - An unique identifier associated to this sender (for example transceiver.mid), it will be used for the authentication and signing events.
	 * @param {RTCRtpReceiver} receiver - The receiver object.
	 */
	async decrypt(id,receiver)
	{
		//We need the media kind until it is set as metadata on the chunk frame
		const kind = receiver.track.kind;
		//Get the receiver insertable streams
		const {readable: readableStream, writable: writableStream} = receiver.createEncodedStreams ? receiver.createEncodedStreams() :
			receiver.createEncodedVideoStreams ? receiver.createEncodedVideoStreams() : receiver.createEncodedAudioStreams();
		//Pass to worker
		return this.postMessage("decrypt",
			{id, kind, readableStream, writableStream},
			[readableStream, writableStream]
		);
	}

	/**
	 * Close client and terminate web worker.
	 */
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
