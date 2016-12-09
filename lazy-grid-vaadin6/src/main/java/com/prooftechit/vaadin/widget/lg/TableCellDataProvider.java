package com.prooftechit.vaadin.widget.lg;

import java.util.List;
import java.util.Map;

import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public interface TableCellDataProvider {

	public List<Map<String, String>> loadCellData(LgTableCell tableCell);
	
}
