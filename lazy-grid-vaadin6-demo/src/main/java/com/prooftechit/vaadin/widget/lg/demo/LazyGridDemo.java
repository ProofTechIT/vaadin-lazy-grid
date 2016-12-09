package com.prooftechit.vaadin.widget.lg.demo;

import java.util.List;

import com.prooftechit.vaadin.widget.lg.LazyGrid;
import com.prooftechit.vaadin.widget.lg.TableCellEvent;
import com.prooftechit.vaadin.widget.lg.TableCellEventListener;
import com.prooftechit.vaadin.widget.lg.TableCellProvider;
import com.prooftechit.vaadin.widget.lg.data.LgTableCell;
import com.prooftechit.vaadin.widget.lg.data.LgTableMeta;

public class LazyGridDemo extends LazyGrid implements TableCellEventListener {

	private LazyGridDemoPresenter presenter;

	public LazyGridDemo(TableCellProvider cellProvider, LazyGridDemoPresenter presenter) {
		super(cellProvider);
		setCellEventListener(this);
		this.presenter = presenter;
	}

	@Override
	public List<LgTableCell> handleEvent(TableCellEvent event) {
		if ("onSelect".equals(event.getEvent())){
			return presenter.onSelectCellList(event.getSource(), event.getEventParameters());
		} else if ("onValueChange".equals(event.getEvent())){
			return presenter.onValueChange(event.getSource());
		} else if ("onMouseClick".equals(event.getEvent())){
			return presenter.onMouseClick(event.getSource(), event.getEventParameters());
		}
		return event.getSource();
	}
	
}
