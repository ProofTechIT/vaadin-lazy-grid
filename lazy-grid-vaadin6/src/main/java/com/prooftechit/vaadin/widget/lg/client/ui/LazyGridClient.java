package com.prooftechit.vaadin.widget.lg.client.ui;

import com.google.gwt.user.client.Element;

public interface LazyGridClient {

	public void showFrame(Object frameId, LgElementFrame frame, int delay);
	
	public Element getElement();
	
	public void setListener(LazyGridClientListener listener);
	
	public LazyGridClientListener getListener();
	
	public float getZoom();

	public void setZoom(float zoom);

	public void hideFrame();
	
}
