package com.prooftechit.vaadin.widget.lg;

import java.util.List;

import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;

public interface TableCellProvider {

	public List<LgTableCell> loadTableCellRange(List<LgTableCellRange> rangeList);

}
