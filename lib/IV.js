export const IV = 
{
	generate : function(keyId,counter,salt)
	{
		//128 bits
		const iv = new Uint8Array (16);
		//Get view
		const view = new DataView(iv.buffer);
		//Set keyId
		view.setBigUint64(0, BigInt(counter));
		//Set coutner
		view.setBigUint64(8, BigInt(keyId));
		//Xor with salt key
		for (let i=0; i<iv.byteLength; ++i)
			//xor
			view.setUint8(i,iv[i]^salt[i]); 
		//return buffer
		return iv;
	}
};
