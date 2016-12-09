package com.prooftechit.vaadin.widget.lg.demo;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.prooftechit.vaadin.widget.lg.TableCellDataProvider;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public class TMCellDataProvider implements TableCellDataProvider {

	@Override
	public List<Map<String, String>> loadCellData(LgTableCell tableCell) {
		return generateListData();
	}

	public static List<Map<String, String>> generateListData() {
		List<Map<String, String>> result = new ArrayList<Map<String, String>>();
		HashMap<String, String> item = new HashMap<String, String>();
		result.add(item);
		item.put("currencyName", "US Dollar");
		item.put("currencyNumericCode", "840");
		item.put("currencyAlphabeticCode", "USD");

		item = new HashMap<String, String>();
		result.add(item);
		item.put("currencyName", "Euro");
		item.put("currencyNumericCode", "978");
		item.put("currencyAlphabeticCode", "EUR");

		item = new HashMap<String, String>();
		result.add(item);
		item.put("currencyName", "Russian Ruble");
		item.put("currencyNumericCode", "643");
		item.put("currencyAlphabeticCode", "RUB");

		item = new HashMap<String, String>();
		result.add(item);
		item.put("currencyName", "Belarussian Ruble");
		item.put("currencyNumericCode", "974");
		item.put("currencyAlphabeticCode", "BYR");
		return result;
	}

}
