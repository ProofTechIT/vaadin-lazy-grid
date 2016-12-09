package com.prooftechit.vaadin.widget.lg.client.ui;

public interface LazyGridClientListener {

	public void onTableMove(LazyGridClient client, String action, int top, int left);

	public void onFixedCells(VLazyGrid vLazyGrid, String sEventData);
	
}
