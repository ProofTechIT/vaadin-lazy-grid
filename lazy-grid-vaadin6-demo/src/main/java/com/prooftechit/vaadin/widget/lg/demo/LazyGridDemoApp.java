package com.prooftechit.vaadin.widget.lg.demo;

import com.vaadin.Application;
import com.vaadin.ui.Button;
import com.vaadin.ui.Button.ClickEvent;
import com.vaadin.ui.Button.ClickListener;
import com.vaadin.ui.CssLayout;
import com.vaadin.ui.TabSheet;
import com.vaadin.ui.TextField;
import com.vaadin.ui.Window;

public class LazyGridDemoApp extends Application {

	@Override
	public void init() {
		setTheme("default");
		final Window mainWindow = new Window("Lazy Grid Demo Application");
		setMainWindow(mainWindow);

		mainWindow.setSizeFull();

		Button rebuildLayoutButton = new Button("RebuildLayout");
		mainWindow.addComponent(rebuildLayoutButton);

		
		TabSheet tabSheet = new TabSheet();
		mainWindow.addComponent(tabSheet);
		
		tabSheet.setSizeFull();

		final CssLayout tab1 = new CssLayout();
		tabSheet.addTab(tab1, "LazyGrid conteiner scroll");
		
		tab1.addStyleName("zoom-test");
		tab1.setSizeFull();
		
		final LazyGridContainerScroll lgContainerScroll = createContainerScrollLayout();
		tab1.addComponent(lgContainerScroll);

		rebuildLayoutButton.addListener(new ClickListener() {

			@Override
			public void buttonClick(ClickEvent event) {
				//tab1.removeAllComponents();
				lgContainerScroll.removeAllComponents();
				
				final TextField zoomField = new TextField();
				lgContainerScroll.addComponent(zoomField, String.format("left: %spx; top: %spx;", 3, 3));
				
				zoomField.setValue("120");
				
				Button applyZoomButton = new Button("Apply zoom");
				lgContainerScroll.addComponent(applyZoomButton, String.format("left: %spx; top: %spx;", 160, 3));

				applyZoomButton.addListener(new ClickListener() {

					@Override
					public void buttonClick(ClickEvent event) {
						Integer zoom = Integer.valueOf(zoomField.getValue().toString());
						lgContainerScroll.setZoom(((float)zoom)/100);
					}
				});
				
				lgContainerScroll.init();
				//tab1.addComponent(lgContainerScroll);
			}
		});
		
		
		final BaseDemoTab tab2 = new BaseDemoTab(new LazyGridDemoAppPresenter());
		tabSheet.addTab(tab2, "LazyGrid features");
		
		final BaseDemoTab tab3 = new BaseDemoTab(new LazyGridDemoAppPresenter3());
		tabSheet.addTab(tab3, "LazyGrid features3");
		
		final BaseDemoTab tab4 = new BaseDemoTab(new LazyGridDemoAppPresenter4());
		tabSheet.addTab(tab4, "LazyGrid features4");
	}

	protected LazyGridContainerScroll createContainerScrollLayout() {
		final LazyGridContainerScroll lgAbsoluteLayout = new LazyGridContainerScroll();

		final TextField zoomField = new TextField();
		lgAbsoluteLayout.addComponent(zoomField, String.format("left: %spx; top: %spx;", 3, 3));
		
		zoomField.setValue("120");
		
		Button applyZoomButton = new Button("Apply zoom");
		lgAbsoluteLayout.addComponent(applyZoomButton, String.format("left: %spx; top: %spx;", 160, 3));

		applyZoomButton.addListener(new ClickListener() {

			@Override
			public void buttonClick(ClickEvent event) {
				Integer zoom = Integer.valueOf(zoomField.getValue().toString());
				lgAbsoluteLayout.setZoom(((float)zoom)/100);
			}
		});		
		return lgAbsoluteLayout;
	}

}
