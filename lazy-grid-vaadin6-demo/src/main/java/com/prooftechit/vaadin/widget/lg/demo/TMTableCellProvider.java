package com.prooftechit.vaadin.widget.lg.demo;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

import com.prooftechit.vaadin.widget.lg.TableCellProvider;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellRange;
import com.prooftechit.vaadin.widget.lg.data.LgTableCellValue;

public class TMTableCellProvider implements TableCellProvider, Serializable {

	private static final long serialVersionUID = 1L;

	private static final String CELL_STYLE_SUBTOTAL = "background: #4F80FF !important; text-decoration: underline;";
	private static final String CELL_STYLE_HEADER = "text-align: center; border: 2px solid black; vertical-align: bottom; font-size: large; text-decoration: underline";
	private static final String CELL_STYLE_SUB_HEADER = "text-align: center; border: 2px solid black; text-decoration: underline";
	private static final String CELL_STYLE_INTERSECTION_HEADER = "text-align: left; border: 2px solid black; vertical-align: top; font-size: x-large; text-decoration: underline";
	private List<List<LgTableCell>> cellData = new ArrayList<List<LgTableCell>>();

	private ObjectMapper objectMapper = new ObjectMapper();
	private Set<String> cellTypeSet;

	public TMTableCellProvider() {
		this(new HashSet<String>());
	}

	public TMTableCellProvider(Set<String> cellTypeSet) {
		super();
		this.cellTypeSet = cellTypeSet;
		cellData = new ArrayList<List<LgTableCell>>();
	}

	public LgTableCell updateTableCell(LgTableCell cell) {
		Integer c = cell.getColIndex();
		Integer r = cell.getRowIndex();

		LgTableCell target = getTableCell(c, r);
		target.setValue(cell.getValue());
		return target;
	}

	public void addRow(int r) {

		List<LgTableCell> target = getRow(r);

		cellData.add(null);

		for (int k = cellData.size() - 1; k > r; k--) {
			cellData.set(k, cellData.get(k - 1));
		}
		cellData.set(r, new ArrayList<LgTableCell>());
	}

	public void removeRow(int r) {
		cellData.remove(r);
	}

	public void removeColumn(int c) {
		for (List<LgTableCell> row : cellData) {
			int r = cellData.indexOf(row);
			row.remove(c);
		}
	}

	public void addColumn(int c) {
		for (List<LgTableCell> row : cellData) {
			int r = cellData.indexOf(row);
			getTableCell(c, r);

			row.add(null);

			for (int k = row.size() - 1; k > c; k--) {
				row.set(k, row.get(k - 1));
			}

			row.set(c, createTableCell(r, c));
		}
	}

	@Override
	public List<LgTableCell> loadTableCellRange(List<LgTableCellRange> rangeList) {
		ArrayList<LgTableCell> result = new ArrayList<LgTableCell>();

		for (LgTableCellRange tableCellRange : rangeList) {
			Integer colOffset = tableCellRange.getLeft();
			Integer rowOffset = tableCellRange.getTop();

			int colCount = tableCellRange.getRight() - colOffset;
			int rowCount = tableCellRange.getBottom() - rowOffset;

			result.addAll(getTableCellData(colCount, rowCount, colOffset, rowOffset));
		}

		return result;
	}

	private List<LgTableCell> getTableCellData(int colCount, int rowCount, int offsetC, int offsetR) {
		List<LgTableCell> result = new ArrayList<LgTableCell>();
		for (int i = 0; i <= colCount; i++) {
			for (int j = 0; j <= rowCount; j++) {

				int c = offsetC + i;
				int r = offsetR + j;

				LgTableCell tableCell = getTableCell(c, r);

				result.add(tableCell);
			}
		}
		return result;
	}

	private LgTableCell getTableCell(int c, int r) {
		List<LgTableCell> rowData = getRow(r);

		LgTableCell tableCell = c < rowData.size() ? rowData.get(c) : null;
		if (tableCell == null) {
			for (int k = rowData.size(); k <= c; k++) {
				tableCell = createTableCell(r, k);

				rowData.add(k, tableCell);
			}
		}

		// tableCell.setRowIndex(cellData.lastIndexOf(rowData));
		// tableCell.setColIndex(rowData.lastIndexOf(tableCell));

		// if (cellData.lastIndexOf(rowData) % 2 == 0 && tableCell.getStyle() ==
		// null) {
		// tableCell.setStyle("background: #DDF5DD;");
		// }

		return tableCell;
	}

	private List<LgTableCell> getRow(int r) {
		List<LgTableCell> rowData = r < cellData.size() ? cellData.get(r) : null;
		if (rowData == null) {
			for (int k = cellData.size(); k <= r; k++) {
				cellData.add(k, rowData = new ArrayList<LgTableCell>());
			}
		}
		return rowData;
	}

	private LgTableCell createTableCell(final int r, final int c) {
		final List<LgTableCell> rowData = getRow(r);
		LgTableCell tableCell = new LgTableCell() {

			@Override
			public Integer getRowIndex() {
				return cellData.indexOf(rowData);
			}

			@Override
			public Integer getColIndex() {
				return rowData.indexOf(this);
			}

			@Override
			public String getStyle() {
				if (getRowIndex() % 2 == 0 && super.getStyle() == null) {
					return "background: #DDF5DD";
				}
				return super.getStyle();
			}

		};
		// tableCell.setRowIndex(r);
		// tableCell.setColIndex(c);
		tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentLabel()));
		tableCell.getValue().setValue("cell-" + c + "-" + r);

		if (c == 0 && r == 0 || c == 1 && r == 1 || c == 0 && r == 1 || c == 1 && r == 0) {
			// tableCell.setContextMenuEnable(Boolean.FALSE);
			tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentText()));
			tableCell.getValue().setValue("Intersection");
			tableCell.setStyle(CELL_STYLE_INTERSECTION_HEADER);
			return tableCell;
		} else if (c == 0) {
			// заголовок строк
			tableCell.setContextMenuEnable(Boolean.FALSE);
			tableCell.getValue().setValue("Row " + r);
			//tableCell.setEditable(Boolean.FALSE);
			tableCell.setStyle(CELL_STYLE_HEADER);
		} else if (r == 0) {
			// заголовок колонок
			tableCell.setContextMenuEnable(Boolean.FALSE);
			tableCell.getValue().setValue("Col " + c);
			//tableCell.setEditable(Boolean.FALSE);
			tableCell.setStyle(CELL_STYLE_HEADER);
		} else if (c == 1) {
			// заголовок строк
			tableCell.setContextMenuEnable(Boolean.FALSE);
			tableCell.getValue().setValue("SubRow " + r);
			//tableCell.setEditable(Boolean.FALSE);
			tableCell.setStyle(CELL_STYLE_SUB_HEADER);
		} else if (r == 1) {
			// заголовок колонок
			tableCell.setContextMenuEnable(Boolean.FALSE);
			tableCell.getValue().setValue("SubCol " + c);
			//tableCell.setEditable(Boolean.FALSE);
			tableCell.setStyle(CELL_STYLE_SUB_HEADER);
		} else if (r == 10) {
			tableCell.getValue().setValue("subtotal-" + c);
			tableCell.setStyle(CELL_STYLE_SUBTOTAL);
		} else if (c % 6 == 0 && cellTypeSet.contains(LgCellContentType.LgCellContentLabel.LG_CELL_CONTENT_LABEL)) {
			tableCell.getValue().setValue("label-" + c + "-" + r);
		} else if (c % 6 == 1 && cellTypeSet.contains(LgCellContentType.LgCellContentText.LG_CELL_CONTENT_TEXT)) {
			if (r % 2 == 0) {
				tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentText()));
			} else {
				tableCell.setValue(new LgTableCellValue(new LgCellContentSeparateChars()));
			}
			tableCell.getValue().setValue("text-" + c + "-" + r);
		} else if (c % 6 == 2 && cellTypeSet.contains(LgCellContentType.LgCellContentNumber.LG_CELL_CONTENT_NUMBER)) {
			tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentNumber()));
			tableCell.getValue().setValue(Double.valueOf(c));
		} else if (c % 6 == 3 && cellTypeSet.contains(LgCellContentType.LgCellContentDate.LG_CELL_CONTENT_DATE)) {
			tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentDate()));
			tableCell.getContentType().setTypeParameter(LgCellContentType.LgCellContentDate.TYPE_PARAMETER_FORMAT, "dd.MM.yyyy");
			tableCell.getValue().setValue(System.currentTimeMillis());
			
		} else if (c % 6 == 4 && cellTypeSet.contains(LgCellContentType.LgCellContentList.LG_CELL_CONTENT_LIST)) {
			tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentList()));
			tableCell.getContentType().setTypeParameter(LgCellContentType.LgCellContentList.TYPE_PARAMETER_SELECT_MODE,
					LgCellContentType.LgCellContentList.TYPE_PARAMETER_VALUE_SELECT_MODE_DROPDOWN);
			tableCell.getContentType().setTypeParameter(LgCellContentType.LgCellContentList.TYPE_PARAMETER_KEY_FIELD,
					"currencyAlphabeticCode");

			if (r % 2 == 0) {
				tableCell.getValue().setValue("lazy-list-" + c + "-" + r);
			} else {
				tableCell.getValue().setValue("list-" + c + "-" + r);
				try {
					tableCell.getContentType().setTypeParameter(
							LgCellContentType.LgCellContentList.TYPE_PARAMETER_ITEM_LIST,
							objectMapper.writeValueAsString(TMCellDataProvider.generateListData()));
				} catch (JsonProcessingException e) {
					throw new RuntimeException(e);
				}
			}
		} else if (c % 6 == 5 && cellTypeSet.contains(LgCellContentType.LgCellContentList.LG_CELL_CONTENT_LIST)) {
			// tableCell.setValue(new LgTableCellValue(new
			// LgCellContentType.LgCellContentNumber()));
			// tableCell.getValue().setValue(Double.valueOf(c));
			tableCell.setValue(new LgTableCellValue(new LgCellContentType.LgCellContentList()));
			tableCell.getContentType().setTypeParameter(LgCellContentType.LgCellContentList.TYPE_PARAMETER_SELECT_MODE,
					LgCellContentType.LgCellContentList.TYPE_PARAMETER_VALUE_SELECT_MODE_POPUP);

			tableCell.getValue().setValue("vocabulary-" + c + "-" + r);

			tableCell.getContentType().setTypeParameter(LgCellContentType.LgCellContentList.TYPE_PARAMETER_KEY_FIELD,
					"currencyAlphabeticCode");
			tableCell.getContentType().setTypeParameter("currencyName.headerName", "currencyAlphabeticCode");
			tableCell.getContentType().setTypeParameter("currencyNumericCode.headerName", "currencyNumericCode");
			tableCell.getContentType().setTypeParameter("currencyAlphabeticCode.headerName", "currencyAlphabeticCode");
		}

		return tableCell;
	}

}