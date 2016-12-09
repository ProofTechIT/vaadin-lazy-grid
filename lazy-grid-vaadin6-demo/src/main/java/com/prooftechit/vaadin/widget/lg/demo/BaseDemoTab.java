package com.prooftechit.vaadin.widget.lg.demo;

import java.util.ArrayList;

import com.vaadin.terminal.Sizeable;
import com.vaadin.ui.Button;
import com.vaadin.ui.Button.ClickEvent;
import com.vaadin.ui.Button.ClickListener;
import com.vaadin.ui.Component;
import com.vaadin.ui.CssLayout;
import com.vaadin.ui.HorizontalLayout;
import com.vaadin.ui.Select;
import com.vaadin.ui.TextArea;
import com.vaadin.ui.TextField;
import com.vaadin.ui.VerticalSplitPanel;

import com.prooftechit.vaadin.widget.lg.LazyGrid;
import com.prooftechit.vaadin.widget.lg.data.LgCellContentType;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;

public class BaseDemoTab extends CssLayout {

	private TextArea selectedCellInfo = new TextArea();
	private TextArea mouseClickInfo = new TextArea();
	private Select cellContentTypeSelect = new Select();
	private LazyGrid lgTop;

	private LazyGridDemoPresenter presenter;

	public BaseDemoTab(LazyGridDemoPresenter presenter) {
		super();
		
		this.presenter = presenter;
		presenter.setDemoTab(this);
		
		init();
	}
	
	public LazyGridDemoPresenter getPresenter() {
		return presenter;
	}

	protected void init() {
		
		CssLayout tab2 = this;
		Component controllsLayout = createControllsLayout();
		tab2.addComponent(controllsLayout);

		VerticalSplitPanel splitPanel = new VerticalSplitPanel();
		tab2.addComponent(splitPanel);

		tab2.setSizeFull();

		splitPanel.setWidth("100%");
		splitPanel.setHeight("1500px");

		lgTop = createTableTop();
		presenter.onReloadTable(1000, 1000);

		splitPanel.addComponent(lgTop);

		LazyGridContainer c = new LazyGridContainer();
		c.setWidth("100%");
		c.setHeight("100%");
		splitPanel.addComponent(c);

		splitPanel.setSplitPosition(500, Sizeable.UNITS_PIXELS);

		c.setSizeFull();
	}

	private LazyGrid createTableTop() {
		LazyGrid lgTop = new LazyGridDemo(((LazyGridDemoPresenter) presenter).getTableCellProvider(), presenter);
		lgTop.setCellDataProvider(((LazyGridDemoPresenter) presenter).getCellDataProvider());
		lgTop.setCellContextMenuProvider(presenter);
		lgTop.setCellContextMenuListener(presenter);

		lgTop.setWidth("100%");
		lgTop.setHeight("100%");

		return lgTop;
	}

	public void setSelectedCellListInfo(String selectedCellListInfo) {
		selectedCellInfo.setValue(selectedCellListInfo + "\n-------\n " + selectedCellInfo.getValue().toString());
	}

	public void setMouseClickInfo(String pMouseClickInfo) {
		mouseClickInfo.setValue(pMouseClickInfo + "\n-------\n " + mouseClickInfo.getValue().toString());
	}

	public void updateTableCellList(ArrayList<LgTableCell> tableCellList) {
		lgTop.updateTableCellList(tableCellList);
	}

	public void setTableMetaTop(LgTableMeta tableMeta) {
		lgTop.setTableMeta(tableMeta);
	}

	public void reloadTable() {
		lgTop.reload();
	}

	private Component createControllsLayout() {
		HorizontalLayout controlsLayout = new HorizontalLayout();

		final TextField rows = new TextField();
		controlsLayout.addComponent(rows);

		rows.setValue(1000);

		final TextField cols = new TextField();
		controlsLayout.addComponent(cols);

		cols.setValue(1000);

		Button reloadButton = new Button("Reload top table");
		controlsLayout.addComponent(reloadButton);

		reloadButton.addListener(new ClickListener() {

			@Override
			public void buttonClick(ClickEvent event) {
				presenter.onReloadTable(Integer.valueOf(cols.getValue().toString()),
						Integer.valueOf(rows.getValue().toString()));
			}
		});

		controlsLayout.addComponent(selectedCellInfo);

		controlsLayout.addComponent(mouseClickInfo);

		controlsLayout.addComponent(cellContentTypeSelect);

		cellContentTypeSelect.setNullSelectionAllowed(false);
		for (Class<?> cellContentTypeClass : LgCellContentType.class.getDeclaredClasses()) {
			cellContentTypeSelect.addItem(cellContentTypeClass);
			cellContentTypeSelect.setItemCaption(cellContentTypeClass, cellContentTypeClass.getSimpleName());
		}
		cellContentTypeSelect.setValue(cellContentTypeSelect.getItemIds().iterator().next());

		Button updateCellButton = new Button("Update cell");
		controlsLayout.addComponent(updateCellButton);

		updateCellButton.addListener(new ClickListener() {

			@Override
			public void buttonClick(ClickEvent event) {
				LgCellContentType contentType = null;
				try {
					contentType = ((Class<LgCellContentType>) cellContentTypeSelect.getValue()).newInstance();
				} catch (Exception e) {
					throw new RuntimeException(e);
				}

				presenter.onUpdateCellList(contentType);
			}
		});
		return controlsLayout;
	}

}
