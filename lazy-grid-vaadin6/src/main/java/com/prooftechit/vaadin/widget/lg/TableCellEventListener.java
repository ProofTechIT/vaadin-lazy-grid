package com.prooftechit.vaadin.widget.lg;

import java.util.List;

import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public interface TableCellEventListener {

	public List<LgTableCell> handleEvent(TableCellEvent event);
	
}