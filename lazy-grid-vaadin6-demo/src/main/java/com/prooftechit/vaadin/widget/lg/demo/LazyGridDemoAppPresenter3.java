package com.prooftechit.vaadin.widget.lg.demo;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import com.prooftechit.vaadin.widget.lg.TableCellDataProvider;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgMenuItem;
import com.prooftechit.vaadin.widget.lg.data.LgMenuItemContext;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellValue;
import com.prooftechit.vaadin.widget.lg.data.LgTableColumn;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;
import com.prooftechit.vaadin.widget.lg.data.LgTableRow;

public class LazyGridDemoAppPresenter3 implements LazyGridDemoPresenter {

	private List<LgTableCell> selectedCellList;
	private TMTableCellProvider3 tableCellProvider = new TMTableCellProvider3(
			new HashSet<String>(Arrays.asList(new String[] { LgCellContentType.LgCellContentText.LG_CELL_CONTENT_TEXT,
					LgCellContentType.LgCellContentNumber.LG_CELL_CONTENT_NUMBER,
					LgCellContentType.LgCellContentDate.LG_CELL_CONTENT_DATE,
					LgCellContentType.LgCellContentList.LG_CELL_CONTENT_LIST,
					LgCellContentType.LgCellContentLabel.LG_CELL_CONTENT_LABEL })));
	private BaseDemoTab demoTab;
	private TableCellDataProvider cellDataProvider = new TMCellDataProvider();

	public LazyGridDemoAppPresenter3() {
	}
	
	public BaseDemoTab getDemoTab() {
		return demoTab;
	}

	public void setDemoTab(BaseDemoTab demoTab) {
		this.demoTab = demoTab;
	}

	public TableCellDataProvider getCellDataProvider() {
		return cellDataProvider;
	}

	public TMTableCellProvider3 getTableCellProvider() {
		return tableCellProvider;
	}

	public List<LgTableCell> onValueChange(List<LgTableCell> source) {
		List<LgTableCell> result = new ArrayList<LgTableCell>();
		for (LgTableCell tableCell : source) {
			result.add(tableCellProvider.updateTableCell(tableCell));
		}
		return result;
	}

	@Override
	public List<LgTableCell> onMouseClick(List<LgTableCell> source, Map<String, Object> eventParameters) {
		StringBuffer sb = processEvent(source, eventParameters, new HashSet<String>(Arrays.asList(new String[] {"onMouseClick"})));
		demoTab.setMouseClickInfo(sb.toString());
		return source;
	}

	@Override
	public List<LgTableCell> onSelectCellList(List<LgTableCell> source, Map<String, Object> eventParameters) {
		StringBuffer sb = processEvent(source, eventParameters);
		demoTab.setSelectedCellListInfo(sb.toString());
		return source;
	}

	private StringBuffer processEvent(List<LgTableCell> source, Map<String, Object> eventParameters) {
		return processEvent(source, eventParameters, new HashSet<String>());
	}
	
	private StringBuffer processEvent(List<LgTableCell> source, Map<String, Object> eventParameters, Set<String> eventList) {
		selectedCellList = new ArrayList<LgTableCell>();
		StringBuffer sb = new StringBuffer();
		if (eventList.contains("onMouseClick")){
			sb.append("doubleClick: ").append(eventParameters.get("doubleClick")).append("\n");
			sb.append("mouseButton: ").append(eventParameters.get("mouseButton")).append("\n");
			sb.append("keyAlt: ").append(eventParameters.get("keyAlt")).append("\n");
			sb.append("keyShift: ").append(eventParameters.get("keyShift")).append("\n");
			sb.append("keyCtrl: ").append(eventParameters.get("keyCtrl")).append("\n");
		}
		
		for (LgTableCell lgTableCell : source) {
			selectedCellList.add(lgTableCell);
			sb.append("[").append(lgTableCell.getRowIndex()).append("]-[").append(lgTableCell.getColIndex()).append("]")
					.append("\n");
		}
		return sb;
	}

	@Override
	public List<LgMenuItem> loadMenuItemList(LgTableCell cell) {
		List<LgMenuItem> result = new ArrayList<LgMenuItem>();

		LgMenuItem e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Добавить столбец после [" + cell.getColIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-addColumn-0");

		e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Добавить столбец перед [" + cell.getColIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-addColumn-1");

		e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Добавить строку после [" + cell.getRowIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-addRow-2");

		e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Добавить строку перед [" + cell.getRowIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-addRow-3");

		e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Удалить столбец [" + cell.getColIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-removeColumn-4");

		e = new LgMenuItem();
		result.add(e);
		e.setMenuItemName("Удалить строку [" + cell.getRowIndex() + "]");
		e.setMenuItemId("menuItem-" + cell.getRowIndex() + "-" + cell.getColIndex() + "-removeRow-5");

		return result;
	}

	@Override
	public void onMenuItemClick(LgMenuItemContext menuItemContext) {
		String menuItemId = menuItemContext.getSelectedMenuItem().getMenuItemId();
		LgTableCell targetCell = menuItemContext.getTargetCell();
		if (menuItemId.endsWith("-addColumn-0")) {
			tableCellProvider.addColumn(targetCell.getColIndex() + 1);
		} else if (menuItemId.endsWith("-addColumn-1")) {
			tableCellProvider.addColumn(targetCell.getColIndex());
		} else if (menuItemId.endsWith("-addRow-2")) {
			tableCellProvider.addRow(targetCell.getRowIndex() + 1);
		} else if (menuItemId.endsWith("-addRow-3")) {
			tableCellProvider.addRow(targetCell.getRowIndex());
		} else if (menuItemId.endsWith("-removeColumn-4")) {
			tableCellProvider.removeColumn(targetCell.getColIndex());
		} else if (menuItemId.endsWith("-removeRow-5")) {
			tableCellProvider.removeRow(targetCell.getRowIndex());
		}
		demoTab.reloadTable();
	}

	@Override
	public void onUpdateCellList(LgCellContentType contentType) {
		if (selectedCellList == null || selectedCellList.size() == 0) {
			return;
		}
		ArrayList<LgTableCell> tableCellList = new ArrayList<LgTableCell>();
		for (LgTableCell selectedTableCell : selectedCellList) {
			LgTableCell cellDataItem = new LgTableCell();
			tableCellList.add(cellDataItem);

			cellDataItem.setColIndex(selectedTableCell.getColIndex());
			cellDataItem.setRowIndex(selectedTableCell.getRowIndex());

			LgTableCellValue value = new LgTableCellValue(contentType);
			cellDataItem.setValue(value);
			
			value.setValue(contentType.getDefaultValue());
		}

		demoTab.updateTableCellList(tableCellList);
	}

	@Override
	public void onReloadTable(Integer rows, Integer cols) {
		LgTableMeta tableMetaTop = createTableMetaTop(rows, cols);
		demoTab.setTableMetaTop(tableMetaTop);
	}

	private LgTableMeta createTableMetaTop(int c, int r) {
		LgTableMeta tableMeta = new LgTableMeta();
		tableMeta.setColCount(c);
		tableMeta.setRowCount(r);
		LgTableColumn defaultColumn = new LgTableColumn();
		defaultColumn.setWidth(90);
		tableMeta.setDefaultColumn(defaultColumn);

		LgTableRow defaultRow = new LgTableRow();
		defaultRow.setHeight(37);
		tableMeta.setDefaultRow(defaultRow);

		LgTableRow headerRow = new LgTableRow();
		tableMeta.getRowList().add(headerRow);

		headerRow.getStyleNameSet().add("sb-header");
		headerRow.setFixed(Boolean.TRUE);
		headerRow.setHeight(74);

		headerRow = new LgTableRow();
		tableMeta.getRowList().add(headerRow);
		
		headerRow.setIndex(1);
		headerRow.getStyleNameSet().add("sb-header");
		headerRow.setFixed(Boolean.TRUE);
		headerRow.setHeight(74);

        headerRow = new LgTableRow();
        tableMeta.getRowList().add(headerRow);

        headerRow.setIndex(2);
        headerRow.getStyleNameSet().add("sb-header");
        headerRow.setFixed(Boolean.TRUE);
        headerRow.setHeight(74);

        LgTableRow subtotalRow = new LgTableRow();
		tableMeta.getRowList().add(subtotalRow);

		subtotalRow.setIndex(10);
		subtotalRow.setFixed(Boolean.TRUE);
		
		LgTableColumn headerCol = new LgTableColumn();
		tableMeta.getColumnList().add(headerCol);

		headerCol.getStyleNameSet().add("sb-header");
		headerCol.setFixed(Boolean.TRUE);
		headerCol.setWidth(180);

		headerCol = new LgTableColumn();
		tableMeta.getColumnList().add(headerCol);

		headerCol.setIndex(1);
		headerCol.getStyleNameSet().add("sb-header");
		headerCol.setFixed(Boolean.TRUE);
		headerCol.setWidth(180);

		ArrayList<LgTableCellRange> cellSpanList = new ArrayList<LgTableCellRange>();
		tableMeta.setCellSpanList(cellSpanList);

		LgTableCellRange intersectionRange = new LgTableCellRange();
		cellSpanList.add(intersectionRange);
		
		intersectionRange.setLeft(0);
		intersectionRange.setTop(0);
		intersectionRange.setRight(1);
		intersectionRange.setBottom(1);

		 LgTableCellRange customRange = new LgTableCellRange();
         cellSpanList.add(customRange);
        customRange.setLeft(2);
        customRange.setTop(5);
        customRange.setRight(3);
        customRange.setBottom(5);
		
		for (int i = 2; i < c-2; i += 4) {
			LgTableCellRange subheaderRange = new LgTableCellRange();
			cellSpanList.add(subheaderRange);
			subheaderRange.setLeft(i);
			subheaderRange.setTop(1);
			subheaderRange.setRight(i + 2);
			subheaderRange.setBottom(1);

            subheaderRange = new LgTableCellRange();
            cellSpanList.add(subheaderRange);
            subheaderRange.setLeft(i+3);
            subheaderRange.setTop(1);
            subheaderRange.setRight(i + 3);
            subheaderRange.setBottom(2);

            subheaderRange = new LgTableCellRange();
            cellSpanList.add(subheaderRange);
            subheaderRange.setLeft(i);
            subheaderRange.setTop(0);
            subheaderRange.setRight(i + 3);
            subheaderRange.setBottom(0);
        }

		return tableMeta;
	}

}
