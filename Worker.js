import {Context} from "./lib/Context.js";

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
						//encrypt
						const encrypted = await context.encrypt(kind, id, chunk.data);
						//Set back encrypted payload
						chunk.data = encrypted.buffer;
						//write back
						controller.enqueue(chunk);
					}
				});
				//Encrypt
				readableStream
					.pipeThrough(transform)
					.pipeTo(writableStream);
				break;
			}
			case "decrypt":
			{
				//Get event data
				const{id, kind, readableStream,writableStream} = args;
				//Create transform stream for encrypting
				const transformStream = new TransformStream({
					start: ()=>{
						//Last reveiced senderId
						transformStream.senderId = -1;
					},
					transform: async (chunk, controller)=>{
						//decrypt
						const decrypted = await context.decrypt(kind, id, chunk.data);
						//Set back decrypted payload
						chunk.data = decrypted.buffer;
						//write back
						controller.enqueue(chunk);
						//If it is a sender
						if (decrypted.senderId!=transformStream.senderId)
						{
							//Store it
							transform.senderId = decrypted.senderId;
							//Launch event
							postMessage ({event: {
								name	: "authenticated",
								data	: {
									id	 : id,
									senderId : transformStream.senderId
								}
							}});
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
