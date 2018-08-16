package com.goodloop.mydata;

import java.io.File;

import javax.servlet.http.HttpServletRequestWrapper;

import com.winterwell.utils.Dep;
import com.winterwell.utils.Utils;
import com.winterwell.utils.io.ArgsParser;
import com.winterwell.utils.io.ConfigBuilder;
import com.winterwell.utils.io.FileUtils;
import com.winterwell.utils.log.Log;
import com.winterwell.utils.log.LogFile;
import com.winterwell.utils.time.Dt;
import com.winterwell.utils.time.TUnit;
import com.winterwell.utils.time.Time;
import com.winterwell.utils.web.WebUtils2;
import com.winterwell.utils.web.XStreamUtils;
import com.winterwell.web.WebEx;
import com.winterwell.web.app.AMain;
import com.winterwell.web.app.AppUtils;
import com.winterwell.web.app.FileServlet;
import com.winterwell.web.app.HttpServletWrapper;
import com.winterwell.web.app.JettyLauncher;
import com.winterwell.web.app.ManifestServlet;
import com.winterwell.web.data.XId;
import com.winterwell.youagain.client.YouAgainClient;
import com.winterwell.gson.FlexiGson;
import com.winterwell.gson.FlexiGsonBuilder;
import com.winterwell.gson.Gson;
import com.winterwell.gson.GsonBuilder;
import com.winterwell.gson.KLoopPolicy;
import com.winterwell.gson.StandardAdapters;
import com.winterwell.nlp.NLPWorkshop;
import com.winterwell.nlp.corpus.wikipedia.WikipediaCorpus;

public class MyDataServer extends AMain<MydataConfig> {
	
	private static MyDataServer main;

	public MyDataServer() {
		super("mydata", MydataConfig.class);
	}

	public static void main(String[] args) {
		main = new MyDataServer();

		logFile = new LogFile(new File("mydata.log"))
					// keep 8 weeks of 1 week log files ??revise this??
					.setLogRotation(TUnit.WEEK.dt, 8);
		
		main.doMain(args);		
	}
	
	@Override
	protected void addJettyServlets(JettyLauncher jl) {		
		super.addJettyServlets(jl);
		jl.addServlet("/logo/*", new HttpServletWrapper(LogoServlet.class));
	}

	
	@Override
	protected void init2(MydataConfig config) {
		super.init2(config);
		// data
		WikipediaCorpus wc = new WikipediaCorpus(NLPWorkshop.get());
	}
	
	@Override
	public MydataConfig init2_config(String[] args) {		
//		if (initFlag) return Dep.get(MydataConfig.class);
		return new MydataConfig();
	}


}
