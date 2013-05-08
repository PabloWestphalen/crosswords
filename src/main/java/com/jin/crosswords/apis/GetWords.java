package com.jin.crosswords.apis;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.ArrayList;
import java.util.HashMap;

import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.codehaus.jackson.map.ObjectMapper;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Entities.EscapeMode;
import org.jsoup.safety.Whitelist;

@WebServlet(value = "/getwords")
public class GetWords extends HttpServlet {
	private static final long serialVersionUID = 1L;
	private static final int fetchSize = 10;
	private static final int maxChars = 37;

	@Override
	protected void doGet(HttpServletRequest req, HttpServletResponse resp)
			throws ServletException, IOException {
		String source = req.getParameter("source");

		System.out.println("request for " + fetchSize + " words at " + source);

		if (source != null) {
			ArrayList<HashMap<String, String>> words = new ArrayList<HashMap<String, String>>();
			if (source.equals("dic-aberto")) {
				words = dicionarioAbertoSearch(fetchSize);
			}
			if (source.equals("word-generator")) {
				words = wordGeneratorSearch(fetchSize);
			}
			if (words != null) {
				System.out.println(words);
				PrintWriter pw = resp.getWriter();
				resp.setHeader("Content-Type", "application/json");
				new ObjectMapper().writeValue(pw, words);
			}

		}
	}

	private static ArrayList<HashMap<String, String>> dicionarioAbertoSearch(
			int fetchSize) {
		ArrayList<HashMap<String, String>> words = new ArrayList<HashMap<String, String>>();
		while (words.size() < fetchSize) {
			try {
				Document doc = Jsoup
						.connect("http://www.dicionario-aberto.net/random")
						.timeout(60 * 1000).get();
				String word = doc.select("#word").val();
				System.out.println(word);
				Element defsElement = doc.select("div.innerDef div").first();
				if (defsElement == null) {
					System.out.println("nondeu");
				} else {
					String defs = defsElement.html();
					defs = Jsoup.clean(defs, new Whitelist().addTags("br"));
					Document out = Jsoup.parse(defs);
					out.outputSettings().escapeMode(EscapeMode.xhtml);
					defs = out.body().html();

					String[] arr = defs.replaceAll("\\n", "").split("<br />");

					int winner = -1;

					for (int i = 1; i < arr.length; i++) {
						System.out.println(i + arr[i]);
						if (arr[i].length() < maxChars) {
							winner = i;
						}
					}
					if(winner == -1) {
						continue;
					}
					
					System.out.println("Winner definition: " + arr[winner]);
					HashMap<String, String> m = new HashMap<>();
					m.put("word", word);
					m.put("definition", arr[winner]);
					words.add(m);
				}
			} catch (IOException e) {
				e.printStackTrace();
			}
		}
		return words;
	}

	private static ArrayList<HashMap<String, String>> wordGeneratorSearch(int fetchSize) {
		ArrayList<HashMap<String, String>> words = new ArrayList<HashMap<String, String>>();
		String url = "http://www.wordgenerator.net/application/p.php?id=dictionary_words&type=50_definition&spaceflag=false";
		while (words.size() < fetchSize) {
			try {
				Document doc = Jsoup.connect(url).timeout(60 * 1000).get();
				Element body = doc.getElementsByTag("body").first();
				String src = body.html();
				String find = "(.*)(\\n<br />\\n<p style=\\\"text-align: center;font-size: 12px;font-weight: 500;\"><b>&nbsp;Definition:</b> )(.*)(</p>,)";
				String replace = "$1__[def]__$3__[word]__";
				String[] wordTokens = src.replaceAll(find, replace).split("__\\[word\\]__");
				for(String word : wordTokens) {
					HashMap<String, String> m = new HashMap<>();
					String[] word_def = word.split("__\\[def\\]__");
					String wordString = word_def[0];
					String wordDef = word_def[1];
					
					if(wordDef.length() > maxChars) { // definition too long 
						continue;
					}
					if(wordDef.startsWith("See")) {
						continue;
					}
					
					m.put("word", wordString);
					m.put("definition", wordDef);
					words.add(m);
					System.out.println(m);
				}

			} catch (Exception e) {}			
		}
		return words;
	}
}
