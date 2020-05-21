import {IV} from "../lib/IV.js";
import {Utils}  from "../lib/Utils.js";

tape.test("IV",function(suite){
	
	suite.test("generate",function(test){
		test.same(Utils.toHex (IV.generate(0xaaaa,0xbbbb,Utils.fromHex("01020304050607081112131415161718"))),"010203040506ada2111213141516aca3");
		test.same(Utils.toHex (IV.generate(0xaa00000000000000,0xbb00000000000000,Utils.fromHex("01020304050607081112131415161718"))),"ab02030405060708aa12131415161718");
		test.end();
	});
	
	suite.end();
});
