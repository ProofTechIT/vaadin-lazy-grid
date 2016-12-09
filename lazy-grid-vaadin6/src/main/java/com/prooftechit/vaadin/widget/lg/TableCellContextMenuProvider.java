package com.prooftechit.vaadin.widget.lg;

import java.util.List;

import com.prooftechit.vaadin.widget.lg.data.LgMenuItem;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public interface TableCellContextMenuProvider {

	public List<LgMenuItem> loadMenuItemList(LgTableCell cell);
	
}
