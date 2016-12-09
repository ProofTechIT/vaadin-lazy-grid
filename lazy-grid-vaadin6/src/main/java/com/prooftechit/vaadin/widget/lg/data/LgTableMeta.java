package com.prooftechit.vaadin.widget.lg.data;

import java.util.ArrayList;
import java.util.List;

public class LgTableMeta {

	private Integer colCount = 0;
	private Integer rowCount = 0;
	private LgTableColumn defaultColumn = new LgTableColumn();
	private LgTableRow defaultRow = new LgTableRow();
	private List<LgTableColumn> columnList = new ArrayList<LgTableColumn>();
	private List<LgTableRow> rowList = new ArrayList<LgTableRow>();
	private List<LgTableCellRange> cellSpanList = new ArrayList<LgTableCellRange>();

	public Integer getColCount() {
		return colCount;
	}

	public void setColCount(Integer colCount) {
		this.colCount = colCount;
	}

	public Integer getRowCount() {
		return rowCount;
	}

	public void setRowCount(Integer rowCount) {
		this.rowCount = rowCount;
	}

	public List<LgTableColumn> getColumnList() {
		return columnList;
	}

	public void setColumnList(List<LgTableColumn> columnList) {
		this.columnList = columnList;
	}

	public List<LgTableRow> getRowList() {
		return rowList;
	}

	public void setRowList(List<LgTableRow> rowList) {
		this.rowList = rowList;
	}

	public LgTableColumn getDefaultColumn() {
		return defaultColumn;
	}

	public void setDefaultColumn(LgTableColumn defaultColumn) {
		this.defaultColumn = defaultColumn;
	}

	public LgTableRow getDefaultRow() {
		return defaultRow;
	}

	public void setDefaultRow(LgTableRow defaultRow) {
		this.defaultRow = defaultRow;
	}

	public List<LgTableCellRange> getCellSpanList() {
		return cellSpanList;
	}

	public void setCellSpanList(List<LgTableCellRange> cellSpanList) {
		this.cellSpanList = cellSpanList;
	}
	
}
