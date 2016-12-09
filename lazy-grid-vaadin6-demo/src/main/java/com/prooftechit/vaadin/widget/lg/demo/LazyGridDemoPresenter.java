package com.prooftechit.vaadin.widget.lg.demo;

import java.util.List;
import java.util.Map;

import com.prooftechit.vaadin.widget.lg.TableCellContextMenuListener;
import com.prooftechit.vaadin.widget.lg.TableCellContextMenuProvider;
import com.prooftechit.vaadin.widget.lg.TableCellDataProvider;
import com.prooftechit.vaadin.widget.lg.TableCellProvider;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;

public interface LazyGridDemoPresenter extends TableCellContextMenuProvider, TableCellContextMenuListener {

	public List<LgTableCell> onSelectCellList(List<LgTableCell> source, Map<String, Object> eventParameters);
	
	public List<LgTableCell> onMouseClick(List<LgTableCell> source, Map<String, Object> eventParameters);

	public List<LgTableCell> onValueChange(List<LgTableCell> source);

	public void onUpdateCellList(LgCellContentType contentType);

	public void onReloadTable(Integer rows, Integer cols);

	public BaseDemoTab getDemoTab();

	public void setDemoTab(BaseDemoTab demoTab);

	public TableCellProvider getTableCellProvider();

	public TableCellDataProvider getCellDataProvider();

}
