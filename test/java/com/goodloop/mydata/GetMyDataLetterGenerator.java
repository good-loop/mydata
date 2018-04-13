package com.goodloop.mydata;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.Map;

import com.winterwell.profiler.client.ProfilerClient;
import com.winterwell.profiler.data.Person;
import com.winterwell.profiler.data.PostalAddress;
import com.winterwell.utils.StrUtils;
import com.winterwell.utils.Utils;
import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.containers.Containers;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.time.Time;
import com.winterwell.web.data.XId;

public class GetMyDataLetterGenerator {

	private XId uxid;

	public GetMyDataLetterGenerator(XId uxid) {
		this.uxid = uxid;		
	}
	
	File dir = new File("letters");

	public void call() throws Exception {
		ProfilerClient pc = new ProfilerClient();
		pc.setDataspace("getmydata");	

		Person peep = pc.get(uxid);
		Object chosen = peep.getMostLikelyValue("chosen[]");
		
		List<String> cs;
		if (chosen instanceof String) {
			cs = StrUtils.splitCSVStyle((String) chosen);
		} else {
			cs = Containers.asList(chosen);
		}
		
		for(String c : cs) {
			doMakeLetter(peep, c);
		}
	}
	
	File template = new File("web/getdata-letter-print.html");
	
	private void doMakeLetter(Person peep, String c) throws Exception {
		String tc = StrUtils.toTitleCase(c);
		dir.mkdirs();
		Object cid = peep.getMostLikelyValue("customerIdFor"+c);
		Map<String, Object> smap = peep.getSimpleMap();
		
		List<PostalAddress> addr = ICORegistry.getData(c);
		String address = addr.get(0).toString();  
				
		Map<String, ?> vars = new ArrayMap(			
			"name", peep.getMostLikelyValue("name"),
			"email", peep.getMostLikelyValue("email"),
			"address", peep.getMostLikelyValue("address"),
			"customerId", cid,
			"hat", peep.getMostLikelyValue("hat"),
			"companyName", tc,
			"companyAddress", address,
			"date", new Time().format("d MMMMMM, yyyy")
				);
		LetterGenerator lg = new LetterGenerator(template, vars);
		File f = lg.call();
		File f2 = new File(dir, FileUtils.safeFilename(peep.getLite().getXId().getName()+"-"+c+"-"+Utils.getRandomString(4)+".pdf", false));
		FileUtils.move(f, f2);
		Log.i(f2);
	}

}
