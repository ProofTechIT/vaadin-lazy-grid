package com.prooftechit.vaadin.widget.lg;

import com.vaadin.terminal.PaintException;
import com.vaadin.terminal.PaintTarget;
import com.vaadin.ui.AbsoluteLayout;
import com.vaadin.ui.ClientWidget;

import com.prooftechit.vaadin.widget.lg.client.ui.VLgAbsoluteLayout;

@ClientWidget(VLgAbsoluteLayout.class)
public class LgAbsoluteLayout extends AbsoluteLayout {

	private Boolean reload = Boolean.FALSE;
	private float zoom = 1.0f;

	public LgAbsoluteLayout() {
		super();
	}

	public void setZoom(float zoom) {
		reload = true;
		this.zoom = zoom;
		//setWidth(String.format("%spx", (int)getWidth()/zoom));
		//setHeight(String.format("%spx", (int)getHeight()/zoom));
		requestRepaint();
	}

	public void paintContent(PaintTarget target) throws PaintException {
		super.paintContent(target);
		if (Boolean.TRUE.equals(reload)) {
			target.addAttribute(VLgAbsoluteLayout.VAR_LG_ZOOM, String.valueOf(zoom));
			reload = false;
			return;
		}
	}

}
