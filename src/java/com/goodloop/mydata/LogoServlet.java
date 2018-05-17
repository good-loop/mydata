package com.goodloop.mydata;

import com.winterwell.web.FakeBrowser;
import com.winterwell.web.app.CommonFields;
import com.winterwell.web.app.IServlet;
import com.winterwell.web.app.WebRequest;
import com.winterwell.web.fields.SField;

public class LogoServlet implements IServlet {

	@Override
	public void process(WebRequest state) throws Exception {
		// TODO look in wikipedia for their logo
		// or https://developers.google.com/apis-explorer/?hl=en_GB#p/kgsearch/v1/
		
		String url = state.getRequired(new SField("url"));
		if ( ! url.startsWith("http")) url = "http://"+url;
		FakeBrowser fb = new FakeBrowser();
		String page = fb.getPage(url);
		
		// TODO find a logo
		
	}

}
