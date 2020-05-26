/*
	0 1 2 3 4 5 6 7
	+-+-+-+-+-+-+-+-+
	|S|LEN  |X|  K  |
	+-+-+-+-+-+-+-+-+
	SFrame header metadata

	Signature flag (S): 1 bit This field indicates the payload contains a signature of set. Counter Length (LEN): 3 bits This field indicates the length of the CTR fields in bytes. Extended Key Id Flag (X): 1 bit
	Indicates if the key field contains the key id or the key length. Key or Key Length: 3 bits This field contains the key id (KID) if the X flag is set to 0, or the key length (KLEN) if set to 1.

	If X flag is 0 then the KID is in the range of 0-7 and the frame counter (CTR) is found in the next LEN bytes:

	 0 1 2 3 4 5 6 7
	+-+-+-+-+-+-+-+-+---------------------------------+
	|S|LEN  |0| KID |    CTR... (length=LEN)          |
	+-+-+-+-+-+-+-+-+---------------------------------+
	Key id (KID): 3 bits The key id (0-7). Frame counter (CTR): (Variable length) Frame counter value up to 8 bytes long.

	if X flag is 1 then KLEN is the length of the key (KID), that is found after the SFrame header metadata byte. After the key id (KID), the frame counter (CTR) will be found in the next LEN bytes:

	 0 1 2 3 4 5 6 7
	+-+-+-+-+-+-+-+-+---------------------------+---------------------------+
	|S|LEN  |1|KLEN |   KID... (length=KLEN)    |    CTR... (length=LEN)    |
	+-+-+-+-+-+-+-+-+---------------------------+---------------------------+
*/
export const Header = {
	
	parse : function(buffer) 
	{
		//Create uint view
		const view = new Uint8Array(buffer);
		
		//Get metadata
		const metadata = view[0];
		
		//Get values
		const s		= !!(metadata & 0x80);
		const len	= (metadata >> 4) & 0x07;
		const x		= !!(metadata & 0x08);
		const k		= metadata & 0x07;
		
		//Get key id
		let keyId = 0;
		//Check if it is the extented key format
		if (x)
		{
			//Read length
			for (let i=0;i<k;i++)
				keyId = (keyId * 256) + view[i+1];
		} else {
			//Short version
			keyId = k;
		}
		
		//Get ctr
		const ini = x ? k + 1 : 1;
		let counter = 0;
		//Read length
		for (let i=0;i<len;i++)
			counter = (counter * 256) + view[ini+i];
		
		//Get header buffer view
		const header = view.subarray(0, x ? k + len + 1 : len + 1);
		
		//Add parsed atributes
		header.signature   = s;
		header.keyId	   = keyId;
		header.counter	   = counter;
		
		//Done
		return header; 
	},
	generate: function(signature,keyId,counter)
	{
		//Check keyId
		Header.checkKeyId(keyId);
		
		//Calcultate variavle length
		const varlen = (x) => x ? parseInt(Math.log(x) / Math.log(256))+1 : 1;
		
		//Get key extension and length
		const x = keyId > 7;
		const k = x ? varlen(keyId) : keyId;
		
		//Get counter length
		const len = varlen(counter);
		
		//Ensure counter is not huge
		if (len>7)
			//Error
			throw new Error("Counter is too big");
		
		//Generate header
		const header = new Uint8Array( x ? 1 + k + len : 1 + len);
		
		//Set metadata header
		header[0] = !!signature;
		header[0] = header[0] << 3  | ( len & 0x07);
		header[0] = header[0] << 1  | x;
		header[0] = header[0] << 3  | ( k & 0x07);
		
		//Add parsed atributes
		header.signature   = !!signature;
		header.keyId	   = keyId;
		header.counter	   = counter;
		
		//If extended key
		if (x)
			//Add key id
			for (let i=0; i<k; ++i)
				header[i+1] = (keyId >> (k-1-i)*8) & 0xff;
		//The coutner init
		const ini = x ? k + 1 : 1;
		//Add counter
		for (let i=0; i<len; ++i)
			header[ini+i] = (counter >> (len-1-i)*8) & 0xff;
			
		
		//Done
		return header;
	}
};

Header.MaxKeyId = 0xFFFFFFFFFF;

Header.checkKeyId = function(keyId)
{
	//Check it is possitive
	if (keyId<0)
		//Error
		throw new Error("keyId must be possitive");
	//Check it is possitive
	if (keyId>Header.MaxKeyId)
		//Error
		throw new Error("keyId must be 5 bytes long at most");
};
