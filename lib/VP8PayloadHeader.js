
export const VP8PayloadHeader = {
	
	parse : function(buffer) 
	{
		//Check size
		if (buffer.byteLength<3)
			//Invalid
			return null;
		
		//Create uint view
		const view = new Uint8Array(buffer);
		
		//Read comon 3 bytes
		//   0 1 2 3 4 5 6 7
                //  +-+-+-+-+-+-+-+-+
                //  |Size0|H| VER |P|
                //  +-+-+-+-+-+-+-+-+
                //  |     Size1     |
                //  +-+-+-+-+-+-+-+-+
                //  |     Size2     |
                //  +-+-+-+-+-+-+-+-+
		const firstPartitionSize	= view[0] >> 5;
		const showFrame			= view[0] >> 4 & 0x01;
		const version			= view[0] >> 1 & 0x07;
		const isKeyFrame		= (view[0] & 0x01) == 0;

		//check if more
		if (isKeyFrame)
		{
			//Check size
			if (buffer.byteLength<10)
				//Invalid
				return null;
			//Get size in le
			const hor = view[7]<<8 | view[6];
			const ver = view[9]<<8 | view[8];
			//Get dimensions and scale
			const width		= hor & 0x3fff;
			const horizontalScale   = hor >> 14;
			const height		= ver & 0x3fff;
			const verticalScale	= ver >> 14;
			//Key frame
			return view.subarray (0,10);
		}
		
		//No key frame
		return view.subarray (0,3);
	}
};

		
