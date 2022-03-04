import {Context} from "./lib/Context.js";
import {VP8PayloadHeader}  from "./lib/VP8PayloadHeader.js";
import {Utils} from "./lib/Utils.js";

class TaskQueue
{
	constructor()
	{
		this.tasks = [];
		this.running = false;
	}
	
	enqueue(promise,callback,error)
	{
		//enqueue task
		this.tasks.push({promise,callback,error});
		//Try run 
		this.run();
	}
	
	async run()
	{
		//If already running 
		if (this.running)
			//Nothing
			return;
		//Running
		this.running = true;
		//Run all pending tasks
		while(this.tasks.length)
		{
			try {
				//Wait for first promise to finish
				const result = await this.tasks[0].promise;
				//Run callback
				this.tasks[0].callback(result); 
			} catch(e) {
				//Run error callback
				this.tasks[0].error(e); 
			}
			//Remove task from queue
			this.tasks.shift();
		}
		//Ended
		this.running = false;
	}
}
let context; 

onmessage = async (event) => {
	//Get data
	const {transId,cmd,args} = event.data;
	
	try {
		let result = true;
		
		//Depending on the cmd
		switch(event.data.cmd)
		{
			case "init":
			{
				//Get info
				const {senderId, config} = args;
				//Crate context
				context = new Context(senderId, config);
				break;
			}
			case "encrypt":
			{
				//The recrypt queue
				const tasks = new TaskQueue();
				//Get event data
				const{id, kind, readableStream, writableStream} = args;
				//Create transform stream foo encrypting
				const transformStream = new TransformStream({
					transform: async (chunk, controller)=>{
						//Nothing in clear
						let skip = 0;
						//Check if it is video and we are skipping vp8 payload header
						if (kind=="video" && context.isSkippingVp8PayloadHeader())
						{
							//Get VP8 header
							const vp8 = VP8PayloadHeader.parse(chunk.data);
							//Skip it
							skip = vp8.byteLength;
						}
						//Enqueue task
						tasks.enqueue (
							context.encrypt(kind, id, chunk.data, skip),
							(encrypted) => {
								//Set back encrypted payload
								chunk.data = encrypted.buffer;
								//write back
								controller.enqueue(chunk);
							},
							(error)=>{
								//TODO: handle errors
							}
						);
					}
				});
				//Encrypt
				readableStream
					.pipeThrough(transformStream)
					.pipeTo(writableStream);
				break;
			}
			case "decrypt":
			{
				//The recrypt queue
				const tasks = new TaskQueue();
				//Last reveiced senderId
				let senderId = -1;
				//Get event data
				const{id, kind, readableStream, writableStream} = args;
				//Create transform stream for encrypting
				const transformStream = new TransformStream({
					transform: async (chunk, controller)=>{
						//Nothing in clear
						let skip = 0;
						//Check if it is video and we are skipping vp8 payload header
						if (kind=="video" && context.isSkippingVp8PayloadHeader())
						{
							//Get VP8 header
							const vp8 = VP8PayloadHeader.parse(chunk.data);
							//Skip it
							skip = vp8.byteLength;
						}
						//Enqueue task
						tasks.enqueue (
							context.decrypt(kind, id, chunk.data, skip),
							(decrypted) => {
								//Set back decrypted payload
								chunk.data = decrypted.buffer;
								//write back
								controller.enqueue(chunk);
								//If it is a sender
								if (decrypted.senderId!=senderId)
								{
									//Store it
									senderId = decrypted.senderId;
									//Launch event
									postMessage ({event: {
										name	: "authenticated",
										data	: {
											id	 : id,
											senderId : senderId
										}
									}});
								}
							},
							(error)=>{
								postMessage ({event: {
									name	: "decryptFailed",
									data	: {
										id	 : id,
										senderId : senderId
									}
								}});
							}
						);
					}
				});
				//Decrypt
				readableStream
					.pipeThrough(transformStream)
					.pipeTo(writableStream);
				break;
			}
			default:
				//Excute "cmd" method on context
				result = await context[cmd](...args || []);
		}
		//Send result back
		postMessage ({transId,result});
	} catch (error) {
		console.error(error);
		//Send error back
		postMessage({transId,error});
	}
};
