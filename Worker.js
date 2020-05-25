import {Context} from "./lib/Context.js";
import {Utils} from "./lib/Utils.js";

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
				//Get event data
				const{id, kind, readableStream, writableStream} = args;
				//Create transform stream foo encrypting
				const transformStream = new TransformStream({
					transform: async (chunk, controller)=>{
						try {
							//encrypt
							const encrypted = await context.encrypt(kind, id, chunk.data);
							//if (kind=="video") console.log("encrypted " + encrypted.frameId + " "+ Utils.toHex(await crypto.subtle.digest("SHA-1", chunk.data)));
							//Set back encrypted payload
							chunk.data = encrypted.buffer;
							//write back
							controller.enqueue(chunk);
						} catch (e) {
						}
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
				//Last reveiced senderId
				let senderId = -1;
				//Get event data
				const{id, kind, readableStream,writableStream} = args;
				//Create transform stream for encrypting
				const transformStream = new TransformStream({
					transform: async (chunk, controller)=>{
						try {
							//decrypt
							const decrypted = await context.decrypt(kind, id, chunk.data);
							//Set back decrypted payload
							chunk.data = decrypted.buffer;
							//if (kind=="video") console.log("decrypt " + decrypted.frameId + " "+ Utils.toHex(await crypto.subtle.digest("SHA-1", chunk.data)));
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
						} catch (e) {
						}
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
