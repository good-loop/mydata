package com.goodloop.mydata;

import static org.junit.Assert.*;

import java.io.File;
import java.util.Map;

import org.junit.Test;

import com.winterwell.utils.containers.ArrayMap;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.time.TimeUtils;
import com.winterwell.utils.web.WebUtils;

public class LetterGeneratorTest {

	@Test
	public void testCall() throws Exception {
		File template = new File("web/getdata-letter-print.html");
		Map<String, ?> vars = new ArrayMap(			
			"name", "Daniel Winterstein",
			"email", "daniel@sodash.com",
			"address", "27 McDonald Road, Edinburgh, EH7 4LX",
			"customerId", null,
			"hat", null,
			"companyName", "Google",
			"companyAddress", "Where are Google<br>Somewhere<br>W4 4NS",
			"date", new Time().format("d MMMMMM, yyyy")
				);
		LetterGenerator lg = new LetterGenerator(template, vars);
		File f = lg.call();
		WebUtils.display(f);
	}

}
